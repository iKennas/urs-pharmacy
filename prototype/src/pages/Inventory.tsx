import { useState } from "react";
import { ArrowLeftRight, ClipboardList, TriangleAlert, PackageX, Archive } from "lucide-react";
import { Button, Card, PageHeader, Table, Td, Tr, StatCard } from "../components/ui";
import { branchesApi, inventoryApi, medicationsApi, reportsApi } from "../api";
import { useAsyncData } from "../hooks/useAsyncData";
import { LoadingState, ErrorState } from "../components/AsyncState";
import { money } from "../lib/labels";
import { Can } from "../components/Can";
import { Modal, Field, inputClass, FormError } from "../components/Modal";

const tabs = ["المخزون الحالي", "الأصناف الناقصة", "قريبة الانتهاء", "الأصناف الراكدة"] as const;

export default function Inventory() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("المخزون الحالي");
  const [showTransfer, setShowTransfer] = useState(false);
  const [showStocktake, setShowStocktake] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: stock, loading: l1, error: e1, reload: r1 } = useAsyncData(() => inventoryApi.list(), []);
  const { data: low, loading: l2, error: e2 } = useAsyncData(() => inventoryApi.lowStock(), []);
  const { data: nearExpiry, loading: l3, error: e3 } = useAsyncData(() => inventoryApi.nearExpiry(), []);
  const { data: stale, loading: l4, error: e4 } = useAsyncData(() => inventoryApi.stale(), []);
  const { data: value, loading: l5, error: e5 } = useAsyncData(() => reportsApi.inventoryValue(), []);
  const { data: branches } = useAsyncData(() => branchesApi.list(), []);
  const { data: medications } = useAsyncData(() => medicationsApi.list(), []);

  if (l1 || l2 || l3 || l4 || l5) return <LoadingState />;
  if (e1 || e2 || e3 || e4 || e5) return <ErrorState message={e1 ?? e2 ?? e3 ?? e4 ?? e5 ?? ""} />;

  const rows = tab === "الأصناف الناقصة" ? low : tab === "الأصناف الراكدة" ? stale : stock;

  async function saveTransfer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    try {
      await inventoryApi.transfer({
        fromBranchId: String(fd.get("fromBranchId")),
        toBranchId: String(fd.get("toBranchId")),
        medicationId: String(fd.get("medicationId")),
        quantity: parseInt(String(fd.get("quantity")), 10),
      });
      setShowTransfer(false);
      r1();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "فشل التحويل");
    } finally {
      setSaving(false);
    }
  }

  async function saveStocktake(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    try {
      await inventoryApi.stocktake({
        branchId: String(fd.get("branchId")),
        medicationId: String(fd.get("medicationId")),
        countedQuantity: parseInt(String(fd.get("countedQuantity")), 10),
        reason: String(fd.get("reason")),
      });
      setShowStocktake(false);
      r1();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "فشل الجرد");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="إدارة المخزون"
        subtitle="عرض المخزون لكل فرع، تنفيذ الجرد والتسويات، تحويل الأصناف بين الفروع، وسجل حركة كل صنف"
        action={
          <Can perm="ADJUST_STOCK">
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setShowStocktake(true)}>
                <ClipboardList size={16} /> تنفيذ جرد
              </Button>
              <Button onClick={() => setShowTransfer(true)}>
                <ArrowLeftRight size={16} /> تحويل بين الفروع
              </Button>
            </div>
          </Can>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="إجمالي الأصناف" value={String(stock?.length ?? 0)} hint="عبر جميع الفروع" icon={<Archive size={20} />} tone="green" />
        <StatCard label="أصناف ناقصة" value={String(low?.length ?? 0)} hint="أقل من الحد الأدنى" icon={<PackageX size={20} />} tone="orange" />
        <StatCard label="قريبة الانتهاء" value={String(nearExpiry?.length ?? 0)} hint="خلال 90 يوم" icon={<TriangleAlert size={20} />} tone="red" />
        <StatCard label="قيمة المخزون" value={money(value?.atBuyPrice ?? 0)} hint="بسعر الشراء" icon={<Archive size={20} />} tone="slate" />
      </div>

      <Card noPad>
        <div className="p-5 pb-0 flex gap-2 flex-wrap">
          {tabs.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-xl text-sm font-bold ${tab === t ? "bg-urs-green text-white" : "bg-slate-100 text-slate-600"}`}>{t}</button>
          ))}
        </div>
        <div className="p-5 pt-4">
          {tab === "قريبة الانتهاء" ? (
            <Table head={["الصنف", "رقم الدفعة", "الفرع", "الكمية", "تاريخ الانتهاء"]}>
              {(nearExpiry ?? []).map((b) => (
                <Tr key={b.id}>
                  <Td className="font-semibold">{b.medication.name}</Td>
                  <Td className="text-urs-green font-semibold">{b.batchNumber}</Td>
                  <Td className="text-slate-500">{b.branch.name}</Td>
                  <Td className="tabular-nums">{b.quantity}</Td>
                  <Td className="text-slate-500">{new Date(b.expiresAt).toLocaleDateString("ar-SA")}</Td>
                </Tr>
              ))}
            </Table>
          ) : (
            <Table head={["الصنف", "التصنيف", "الفرع", "الكمية الحالية", "الحد الأدنى"]}>
              {(rows ?? []).map((row) => (
                <Tr key={row.id}>
                  <Td className="font-semibold">{row.medication.name}</Td>
                  <Td className="text-slate-500">{row.medication.category?.name ?? "—"}</Td>
                  <Td className="text-slate-500">{row.branch.name}</Td>
                  <Td className={`tabular-nums font-bold ${row.quantity <= row.medication.minStock ? "text-urs-orange" : ""}`}>{row.quantity}</Td>
                  <Td className="tabular-nums text-slate-400">{row.medication.minStock}</Td>
                </Tr>
              ))}
            </Table>
          )}
        </div>
      </Card>

      <Modal open={showTransfer} onClose={() => setShowTransfer(false)} title="تحويل مخزون بين الفروع">
        <form onSubmit={saveTransfer}>
          <FormError message={formError} />
          <Field label="من الفرع">
            <select name="fromBranchId" required className={inputClass}>
              <option value="">اختر</option>
              {(branches ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Field>
          <Field label="إلى الفرع">
            <select name="toBranchId" required className={inputClass}>
              <option value="">اختر</option>
              {(branches ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Field>
          <Field label="الصنف">
            <select name="medicationId" required className={inputClass}>
              <option value="">اختر</option>
              {(medications ?? []).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </Field>
          <Field label="الكمية"><input name="quantity" type="number" min="1" required className={inputClass} /></Field>
          <Button type="submit" disabled={saving}>تنفيذ التحويل</Button>
        </form>
      </Modal>

      <Modal open={showStocktake} onClose={() => setShowStocktake(false)} title="تنفيذ جرد وتسوية">
        <form onSubmit={saveStocktake}>
          <FormError message={formError} />
          <Field label="الفرع">
            <select name="branchId" required className={inputClass}>
              <option value="">اختر</option>
              {(branches ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Field>
          <Field label="الصنف">
            <select name="medicationId" required className={inputClass}>
              <option value="">اختر</option>
              {(medications ?? []).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </Field>
          <Field label="الكمية المعدودة"><input name="countedQuantity" type="number" min="0" required className={inputClass} /></Field>
          <Field label="سبب التسوية"><input name="reason" required className={inputClass} /></Field>
          <Button type="submit" disabled={saving}>تسجيل الجرد</Button>
        </form>
      </Modal>
    </div>
  );
}
