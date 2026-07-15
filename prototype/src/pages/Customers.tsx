import { useState } from "react";
import { Plus, FileText } from "lucide-react";
import { Button, Card, PageHeader, Table, Td, Tr } from "../components/ui";
import { customersApi } from "../api";
import { useAsyncData } from "../hooks/useAsyncData";
import { LoadingState, ErrorState } from "../components/AsyncState";
import { dateOnly } from "../lib/labels";
import { Can } from "../components/Can";
import { Modal, Field, inputClass, FormError } from "../components/Modal";
import { StatementModal } from "../components/StatementModal";

export default function Customers() {
  const { data, loading, error, reload } = useAsyncData(() => customersApi.list(), []);
  const [showAdd, setShowAdd] = useState(false);
  const [statementId, setStatementId] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  async function saveCustomer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    try {
      await customersApi.create({
        name: String(fd.get("name")),
        phone: String(fd.get("phone") || "") || undefined,
      });
      setShowAdd(false);
      reload();
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
      await customersApi.recordPayment(paymentId, parseFloat(String(fd.get("amount"))), String(fd.get("note") || "") || undefined);
      setPaymentId(null);
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
        title="العملاء والديون"
        subtitle="بيانات العملاء، سجل المشتريات، الفواتير الآجلة ودفعات السداد، والرصيد المتبقي لكل عميل"
        action={
          <Can perm="CREATE">
            <Button onClick={() => setShowAdd(true)}>
              <Plus size={16} /> إضافة عميل
            </Button>
          </Can>
        }
      />

      <Card noPad>
        <div className="p-5">
          <Table head={["اسم العميل", "رقم الهاتف", "تاريخ التسجيل", ""]}>
            {(data ?? []).map((c) => (
              <Tr key={c.id}>
                <Td className="font-semibold">{c.name}</Td>
                <Td className="text-slate-500 tabular-nums" dir="ltr">{c.phone ?? "—"}</Td>
                <Td className="text-slate-500 tabular-nums">{dateOnly(c.createdAt)}</Td>
                <Td>
                  <div className="flex gap-3">
                    <button className="text-xs font-bold text-urs-green flex items-center gap-1" onClick={() => setStatementId(c.id)}>
                      <FileText size={13} /> كشف حساب
                    </button>
                    <Can perm="CREATE">
                      <button className="text-xs font-bold text-urs-orange" onClick={() => setPaymentId(c.id)}>تسجيل دفعة</button>
                    </Can>
                  </div>
                </Td>
              </Tr>
            ))}
          </Table>
        </div>
      </Card>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="إضافة عميل">
        <form onSubmit={saveCustomer}>
          <FormError message={formError} />
          <Field label="اسم العميل"><input name="name" required className={inputClass} /></Field>
          <Field label="رقم الهاتف"><input name="phone" className={inputClass} dir="ltr" /></Field>
          <Button type="submit" disabled={saving}>إضافة</Button>
        </form>
      </Modal>

      <Modal open={!!paymentId} onClose={() => setPaymentId(null)} title="تسجيل دفعة سداد">
        <form onSubmit={savePayment}>
          <FormError message={formError} />
          <Field label="المبلغ"><input name="amount" type="number" step="0.01" min="0.01" required className={inputClass} /></Field>
          <Field label="ملاحظة"><input name="note" className={inputClass} /></Field>
          <Button type="submit" disabled={saving}>تسجيل</Button>
        </form>
      </Modal>

      <StatementModal
        open={!!statementId}
        onClose={() => setStatementId(null)}
        title="كشف حساب العميل"
        kind="customer"
        entityId={statementId}
      />
    </div>
  );
}
