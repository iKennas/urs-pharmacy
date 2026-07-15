import { useState } from "react";
import { Search, Ban, Undo2 } from "lucide-react";
import { Button, Card, PageHeader, SearchInput, StatusBadge, Table, Td, Tr } from "../components/ui";
import { branchesApi, salesApi } from "../api";
import type { SalesInvoiceDetail } from "../api/types";
import { useAsyncData } from "../hooks/useAsyncData";
import { LoadingState, ErrorState } from "../components/AsyncState";
import { dateAr, label, money } from "../lib/labels";
import { Can } from "../components/Can";
import { Modal, Field, inputClass, FormError } from "../components/Modal";

export default function Sales() {
  const [query, setQuery] = useState("");
  const [branchId, setBranchId] = useState("");
  const { data: branches } = useAsyncData(() => branchesApi.list(), []);
  const { data, loading, error, reload } = useAsyncData(() => salesApi.list(branchId ? { branchId } : undefined), [branchId]);

  const [cancelId, setCancelId] = useState<string | null>(null);
  const [returnInvoice, setReturnInvoice] = useState<SalesInvoiceDetail | null>(null);
  const [returnQtys, setReturnQtys] = useState<Record<string, number>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  const filtered = (data ?? []).filter(
    (s) => s.invoiceNumber.includes(query) || (s.customer?.name ?? "").includes(query),
  );

  async function openReturn(id: string) {
    setFormError(null);
    try {
      const inv = await salesApi.get(id);
      setReturnInvoice(inv);
      const qtys: Record<string, number> = {};
      inv.items.forEach((i) => { qtys[i.id] = 0; });
      setReturnQtys(qtys);
    } catch (err) {
      alert(err instanceof Error ? err.message : "فشل تحميل الفاتورة");
    }
  }

  async function submitCancel(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!cancelId) return;
    setFormError(null);
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    try {
      await salesApi.cancel(cancelId, String(fd.get("reason")));
      setCancelId(null);
      reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "فشل الإلغاء");
    } finally {
      setSaving(false);
    }
  }

  async function submitReturn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!returnInvoice) return;
    setFormError(null);
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const items = Object.entries(returnQtys)
      .filter(([, q]) => q > 0)
      .map(([salesInvoiceItemId, quantity]) => ({ salesInvoiceItemId, quantity, restockToBatch: true }));
    if (items.length === 0) {
      setFormError("حدد كمية مرتجع لصنف واحد على الأقل");
      setSaving(false);
      return;
    }
    try {
      await salesApi.return(returnInvoice.id, { reason: String(fd.get("reason")), items });
      setReturnInvoice(null);
      reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "فشل المرتجع");
    } finally {
      setSaving(false);
    }
  }

  const canReturn = (status: string) => status === "COMPLETED" || status === "PARTIALLY_RETURNED";
  const canCancel = (status: string) => status === "COMPLETED" || status === "HELD";

  return (
    <div>
      <PageHeader title="المبيعات والمرتجعات" subtitle="عرض الفواتير وتفاصيلها، الفلترة حسب الفرع والمستخدم والتاريخ، وتنفيذ المرتجعات الكاملة أو الجزئية" />

      <Card noPad>
        <div className="p-5 pb-0 flex gap-3 flex-wrap">
          <SearchInput placeholder="بحث برقم الفاتورة أو اسم العميل..." icon={<Search size={16} />} value={query} onChange={setQuery} />
          <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="rounded-xl border border-urs-border bg-white px-3 py-2.5 text-sm outline-none focus:border-urs-green-light">
            <option value="">كل الفروع</option>
            {(branches ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div className="p-5 pt-4">
          <Table head={["رقم الفاتورة", "الفرع", "الكاشير", "العميل", "التاريخ", "طريقة الدفع", "الإجمالي", "الحالة", ""]}>
            {filtered.map((s) => (
              <Tr key={s.id}>
                <Td className="font-semibold text-urs-green">{s.invoiceNumber}</Td>
                <Td className="text-slate-500">{s.branch.name}</Td>
                <Td className="text-slate-500">{s.cashierUser.name}</Td>
                <Td>{s.customer?.name ?? "زبون نقدي"}</Td>
                <Td className="text-slate-500 tabular-nums">{dateAr(s.createdAt)}</Td>
                <Td>{label("payment", s.paymentMethod)}</Td>
                <Td className="tabular-nums font-semibold">{money(s.total)}</Td>
                <Td><StatusBadge status={label("sale", s.status)} /></Td>
                <Td>
                  <div className="flex gap-2">
                    <Can perm="RETURN">
                      {canReturn(s.status) && (
                        <button title="مرتجع" className="text-slate-400 hover:text-urs-orange" onClick={() => openReturn(s.id)}>
                          <Undo2 size={15} />
                        </button>
                      )}
                    </Can>
                    <Can perm="DELETE">
                      {canCancel(s.status) && (
                        <button title="إلغاء" className="text-slate-400 hover:text-red-500" onClick={() => setCancelId(s.id)}>
                          <Ban size={15} />
                        </button>
                      )}
                    </Can>
                  </div>
                </Td>
              </Tr>
            ))}
          </Table>
        </div>
      </Card>

      <Modal open={!!cancelId} onClose={() => setCancelId(null)} title="إلغاء الفاتورة">
        <form onSubmit={submitCancel}>
          <FormError message={formError} />
          <Field label="سبب الإلغاء"><textarea name="reason" required className={inputClass} rows={3} /></Field>
          <Button type="submit" variant="danger" disabled={saving}>تأكيد الإلغاء</Button>
        </form>
      </Modal>

      <Modal open={!!returnInvoice} onClose={() => setReturnInvoice(null)} title={`مرتجع — ${returnInvoice?.invoiceNumber ?? ""}`} wide>
        {returnInvoice && (
          <form onSubmit={submitReturn}>
            <FormError message={formError} />
            <div className="space-y-3 mb-4">
              {returnInvoice.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 border-b border-urs-border pb-2">
                  <div>
                    <p className="font-semibold text-sm">{item.medication.name}</p>
                    <p className="text-xs text-slate-400">مباع: {item.quantity} · {money(
                      Number(item.unitPrice) * item.quantity - Number(item.discount ?? 0) + Number(item.taxAmount ?? 0),
                    )}</p>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={item.quantity}
                    value={returnQtys[item.id] ?? 0}
                    onChange={(e) => setReturnQtys((q) => ({ ...q, [item.id]: parseInt(e.target.value, 10) || 0 }))}
                    className="w-20 rounded-lg border border-urs-border px-2 py-1.5 text-sm text-center"
                  />
                </div>
              ))}
            </div>
            <Field label="سبب المرتجع"><textarea name="reason" required className={inputClass} rows={2} /></Field>
            <Button type="submit" disabled={saving}>تسجيل المرتجع</Button>
          </form>
        )}
      </Modal>
    </div>
  );
}
