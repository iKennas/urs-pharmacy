import { useState } from "react";
import { Plus, Truck } from "lucide-react";
import { Button, Card, PageHeader, StatusBadge, Table, Td, Tr } from "../components/ui";
import { branchesApi, medicationsApi, purchasesApi, suppliersApi } from "../api";
import { useAsyncData } from "../hooks/useAsyncData";
import { LoadingState, ErrorState } from "../components/AsyncState";
import { dateOnly, label, money } from "../lib/labels";
import { Can } from "../components/Can";
import { Modal, Field, inputClass, FormError } from "../components/Modal";
import { StatementModal } from "../components/StatementModal";

type LineItem = { medicationId: string; batchNumber: string; quantity: number; buyPrice: number; expiresAt: string };

export default function Purchases() {
  const [tab, setTab] = useState<"invoices" | "suppliers">("invoices");
  const { data: invoices, loading: l1, error: e1, reload: r1 } = useAsyncData(() => purchasesApi.list(), []);
  const { data: suppliers, loading: l2, error: e2, reload: r2 } = useAsyncData(() => suppliersApi.list(), []);
  const { data: branches } = useAsyncData(() => branchesApi.list(), []);
  const { data: medications } = useAsyncData(() => medicationsApi.list(), []);

  const [showPurchase, setShowPurchase] = useState(false);
  const [showSupplier, setShowSupplier] = useState(false);
  const [statementId, setStatementId] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [lines, setLines] = useState<LineItem[]>([{ medicationId: "", batchNumber: "", quantity: 1, buyPrice: 0, expiresAt: "" }]);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (l1 || l2) return <LoadingState />;
  if (e1 || e2) return <ErrorState message={e1 ?? e2 ?? ""} />;

  async function savePurchase(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const validLines = lines.filter((l) => l.medicationId && l.batchNumber && l.quantity > 0 && l.expiresAt);
    if (validLines.length === 0) {
      setFormError("أضف صنفًا واحدًا على الأقل");
      setSaving(false);
      return;
    }
    try {
      await purchasesApi.create({
        branchId: String(fd.get("branchId")),
        supplierId: String(fd.get("supplierId")),
        invoiceNumber: String(fd.get("invoiceNumber")),
        paid: parseFloat(String(fd.get("paid"))),
        items: validLines,
      });
      setShowPurchase(false);
      setLines([{ medicationId: "", batchNumber: "", quantity: 1, buyPrice: 0, expiresAt: "" }]);
      r1();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "فشل الحفظ");
    } finally {
      setSaving(false);
    }
  }

  async function saveSupplier(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    try {
      await suppliersApi.create({ name: String(fd.get("name")), phone: String(fd.get("phone") || "") || undefined });
      setShowSupplier(false);
      r2();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "فشل الإضافة");
    } finally {
      setSaving(false);
    }
  }

  async function savePayment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!paymentId) return;
    setFormError(null);
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    try {
      await purchasesApi.recordPayment(paymentId, parseFloat(String(fd.get("amount"))));
      setPaymentId(null);
      r1();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "فشل التسجيل");
    } finally {
      setSaving(false);
    }
  }

  function updateLine(idx: number, patch: Partial<LineItem>) {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  return (
    <div>
      <PageHeader
        title="المشتريات والموردون"
        subtitle="فواتير الشراء المرتبطة بالمورد والدفعات، تحديث المخزون تلقائيًا، ومتابعة كشف حساب كل مورد"
        action={
          <Can perm="CREATE">
            {tab === "invoices" ? (
              <Button onClick={() => setShowPurchase(true)}><Plus size={16} /> فاتورة شراء جديدة</Button>
            ) : (
              <Button onClick={() => setShowSupplier(true)}><Plus size={16} /> إضافة مورد</Button>
            )}
          </Can>
        }
      />

      <div className="flex gap-2 mb-5">
        <button onClick={() => setTab("invoices")} className={`px-4 py-2 rounded-xl text-sm font-bold ${tab === "invoices" ? "bg-urs-green text-white" : "bg-white border border-urs-border text-slate-600"}`}>فواتير الشراء</button>
        <button onClick={() => setTab("suppliers")} className={`px-4 py-2 rounded-xl text-sm font-bold ${tab === "suppliers" ? "bg-urs-green text-white" : "bg-white border border-urs-border text-slate-600"}`}>الموردون</button>
      </div>

      {tab === "invoices" ? (
        <Card noPad>
          <div className="p-5">
            <Table head={["رقم الفاتورة", "المورد", "الفرع", "التاريخ", "الإجمالي", "المدفوع", "المتبقي", "الحالة", ""]}>
              {(invoices ?? []).map((p) => {
                const total = parseFloat(p.total);
                const paid = parseFloat(p.paid);
                return (
                  <Tr key={p.id}>
                    <Td className="font-semibold text-urs-green">{p.invoiceNumber}</Td>
                    <Td>{p.supplier.name}</Td>
                    <Td className="text-slate-500">{p.branch.name}</Td>
                    <Td className="text-slate-500 tabular-nums">{dateOnly(p.date)}</Td>
                    <Td className="tabular-nums font-semibold">{money(p.total)}</Td>
                    <Td className="tabular-nums text-urs-green">{money(p.paid)}</Td>
                    <Td className="tabular-nums text-urs-orange">{money(total - paid)}</Td>
                    <Td><StatusBadge status={label("purchase", p.status)} /></Td>
                    <Td>
                      {total > paid && (
                        <Can perm="CREATE">
                          <button className="text-xs font-bold text-urs-orange" onClick={() => setPaymentId(p.id)}>تسجيل دفعة</button>
                        </Can>
                      )}
                    </Td>
                  </Tr>
                );
              })}
            </Table>
          </div>
        </Card>
      ) : (
        <Card noPad>
          <div className="p-5">
            <Table head={["المورد", "رقم الهاتف", ""]}>
              {(suppliers ?? []).map((s) => (
                <Tr key={s.id}>
                  <Td className="font-semibold flex items-center gap-2"><Truck size={15} className="text-slate-300" /> {s.name}</Td>
                  <Td className="text-slate-500 tabular-nums" dir="ltr">{s.phone ?? "—"}</Td>
                  <Td>
                    <button className="text-xs font-bold text-urs-green" onClick={() => setStatementId(s.id)}>كشف الحساب</button>
                  </Td>
                </Tr>
              ))}
            </Table>
          </div>
        </Card>
      )}

      <Modal open={showPurchase} onClose={() => setShowPurchase(false)} title="فاتورة شراء جديدة" wide>
        <form onSubmit={savePurchase}>
          <FormError message={formError} />
          <div className="grid sm:grid-cols-2 gap-x-4 mb-4">
            <Field label="الفرع">
              <select name="branchId" required className={inputClass}>
                <option value="">اختر الفرع</option>
                {(branches ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </Field>
            <Field label="المورد">
              <select name="supplierId" required className={inputClass}>
                <option value="">اختر المورد</option>
                {(suppliers ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="رقم الفاتورة"><input name="invoiceNumber" required className={inputClass} /></Field>
            <Field label="المبلغ المدفوع"><input name="paid" type="number" step="0.01" min="0" defaultValue="0" className={inputClass} /></Field>
          </div>
          <p className="font-bold text-sm mb-2">الأصناف</p>
          {lines.map((line, idx) => (
            <div key={idx} className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-2">
              <select value={line.medicationId} onChange={(e) => updateLine(idx, { medicationId: e.target.value })} className={inputClass} required>
                <option value="">الصنف</option>
                {(medications ?? []).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <input placeholder="رقم الدفعة" value={line.batchNumber} onChange={(e) => updateLine(idx, { batchNumber: e.target.value })} className={inputClass} required />
              <input type="number" min="1" placeholder="الكمية" value={line.quantity} onChange={(e) => updateLine(idx, { quantity: parseInt(e.target.value, 10) || 0 })} className={inputClass} required />
              <input type="number" step="0.01" placeholder="سعر الشراء" value={line.buyPrice || ""} onChange={(e) => updateLine(idx, { buyPrice: parseFloat(e.target.value) || 0 })} className={inputClass} required />
              <input type="date" value={line.expiresAt} onChange={(e) => updateLine(idx, { expiresAt: e.target.value })} className={inputClass} required />
            </div>
          ))}
          <button type="button" className="text-xs font-bold text-urs-green mb-4" onClick={() => setLines((l) => [...l, { medicationId: "", batchNumber: "", quantity: 1, buyPrice: 0, expiresAt: "" }])}>
            + إضافة سطر
          </button>
          <Button type="submit" disabled={saving}>حفظ الفاتورة</Button>
        </form>
      </Modal>

      <Modal open={showSupplier} onClose={() => setShowSupplier(false)} title="إضافة مورد">
        <form onSubmit={saveSupplier}>
          <FormError message={formError} />
          <Field label="اسم المورد"><input name="name" required className={inputClass} /></Field>
          <Field label="رقم الهاتف"><input name="phone" className={inputClass} dir="ltr" /></Field>
          <Button type="submit" disabled={saving}>إضافة</Button>
        </form>
      </Modal>

      <Modal open={!!paymentId} onClose={() => setPaymentId(null)} title="تسجيل دفعة للمورد">
        <form onSubmit={savePayment}>
          <FormError message={formError} />
          <Field label="المبلغ"><input name="amount" type="number" step="0.01" min="0.01" required className={inputClass} /></Field>
          <Button type="submit" disabled={saving}>تسجيل</Button>
        </form>
      </Modal>

      <StatementModal open={!!statementId} onClose={() => setStatementId(null)} title="كشف حساب المورد" kind="supplier" entityId={statementId} />
    </div>
  );
}
