import { useState } from "react";
import { Plus, AlertTriangle } from "lucide-react";
import { Button, Card, PageHeader, StatusBadge, Table, Td, Tr } from "../components/ui";
import { batchesApi, branchesApi, medicationsApi, suppliersApi } from "../api";
import { useAsyncData } from "../hooks/useAsyncData";
import { LoadingState, ErrorState } from "../components/AsyncState";
import { dateOnly, label, money } from "../lib/labels";
import { Can } from "../components/Can";
import { Modal, Field, inputClass, FormError } from "../components/Modal";

export default function Batches() {
  const { data, loading, error, reload } = useAsyncData(() => batchesApi.list(), []);
  const { data: branches } = useAsyncData(() => branchesApi.list(), []);
  const { data: medications } = useAsyncData(() => medicationsApi.list(), []);
  const { data: suppliers } = useAsyncData(() => suppliersApi.list(), []);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const nearExpiry = (data ?? []).filter((b) => b.status === "NEAR_EXPIRY").length;

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  async function saveBatch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    try {
      await batchesApi.create({
        branchId: String(fd.get("branchId")),
        medicationId: String(fd.get("medicationId")),
        supplierId: String(fd.get("supplierId") || "") || undefined,
        batchNumber: String(fd.get("batchNumber")),
        quantity: parseInt(String(fd.get("quantity")), 10),
        buyPrice: parseFloat(String(fd.get("buyPrice"))),
        producedAt: String(fd.get("producedAt") || "") || undefined,
        expiresAt: String(fd.get("expiresAt")),
      });
      setShowForm(false);
      reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "فشل التسجيل");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="الدفعات والتشغيلات"
        subtitle="رقم التشغيلة، تاريخ الإنتاج والانتهاء، ربط الدفعة بالمورد والفرع، مع اختيار الأقرب انتهاءً تلقائيًا عند البيع"
        action={
          <Can perm="CREATE">
            <Button onClick={() => setShowForm(true)}>
              <Plus size={16} /> تسجيل دفعة جديدة
            </Button>
          </Can>
        }
      />

      {nearExpiry > 0 && (
        <div className="flex items-center gap-2 bg-urs-orange-light text-urs-orange text-sm font-semibold rounded-xl p-3.5 mb-5">
          <AlertTriangle size={17} />
          يوجد {nearExpiry} دفعة تقترب من تاريخ الانتهاء
        </div>
      )}

      <Card noPad>
        <div className="p-5">
          <Table head={["رقم الدفعة", "الصنف", "المورد", "الفرع", "الكمية", "سعر الشراء", "تاريخ الإنتاج", "تاريخ الانتهاء", "الحالة"]}>
            {(data ?? []).map((b) => (
              <Tr key={b.id}>
                <Td className="font-semibold text-urs-green">{b.batchNumber}</Td>
                <Td className="font-semibold">{b.medication.name}</Td>
                <Td className="text-slate-500">{b.supplier?.name ?? "—"}</Td>
                <Td className="text-slate-500">{b.branch.name}</Td>
                <Td className="tabular-nums">{b.quantity}</Td>
                <Td className="tabular-nums">{money(b.buyPrice)}</Td>
                <Td className="text-slate-500 tabular-nums">{dateOnly(b.producedAt)}</Td>
                <Td className="text-slate-500 tabular-nums">{dateOnly(b.expiresAt)}</Td>
                <Td><StatusBadge status={label("batch", b.status)} /></Td>
              </Tr>
            ))}
          </Table>
        </div>
      </Card>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="تسجيل دفعة جديدة" wide>
        <form onSubmit={saveBatch}>
          <FormError message={formError} />
          <div className="grid sm:grid-cols-2 gap-x-4">
            <Field label="الفرع">
              <select name="branchId" required className={inputClass}>
                <option value="">اختر الفرع</option>
                {(branches ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </Field>
            <Field label="الصنف">
              <select name="medicationId" required className={inputClass}>
                <option value="">اختر الصنف</option>
                {(medications ?? []).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </Field>
            <Field label="المورد">
              <select name="supplierId" className={inputClass}>
                <option value="">بدون مورد</option>
                {(suppliers ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="رقم الدفعة"><input name="batchNumber" required className={inputClass} /></Field>
            <Field label="الكمية"><input name="quantity" type="number" min="1" required className={inputClass} /></Field>
            <Field label="سعر الشراء"><input name="buyPrice" type="number" step="0.01" min="0" required className={inputClass} /></Field>
            <Field label="تاريخ الإنتاج"><input name="producedAt" type="date" className={inputClass} /></Field>
            <Field label="تاريخ الانتهاء"><input name="expiresAt" type="date" required className={inputClass} /></Field>
          </div>
          <Button type="submit" disabled={saving} className="mt-2">تسجيل</Button>
        </form>
      </Modal>
    </div>
  );
}
