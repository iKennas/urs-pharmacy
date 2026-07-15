import { useState } from "react";
import { Bell, RefreshCw, Power } from "lucide-react";
import { Button, Card, PageHeader, StatCard, StatusBadge, Table, Td, Tr } from "../components/ui";
import { adminApi, pharmacyApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { useAsyncData } from "../hooks/useAsyncData";
import { LoadingState, ErrorState } from "../components/AsyncState";
import { dateOnly, label } from "../lib/labels";
import { Modal, Field, inputClass, FormError } from "../components/Modal";

export default function Subscriptions() {
  const { isAdmin } = useAuth();
  const { data: pharmacies, loading: l1, error: e1, reload: r1 } = useAsyncData(
    () => (isAdmin ? adminApi.pharmacies() : Promise.resolve(null)),
    [isAdmin],
  );
  const { data: myPharmacy, loading: l2, error: e2 } = useAsyncData(
    () => (!isAdmin ? pharmacyApi.me() : Promise.resolve(null)),
    [isAdmin],
  );

  const [renewId, setRenewId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (l1 || l2) return <LoadingState />;
  if (e1 || e2) return <ErrorState message={e1 ?? e2 ?? ""} />;

  const list = isAdmin ? pharmacies ?? [] : myPharmacy ? [myPharmacy] : [];
  const active = list.filter((p) => p.subscriptionStatus === "ACTIVE").length;
  const expiring = list.filter((p) => p.subscriptionStatus === "EXPIRING_SOON").length;
  const expired = list.filter((p) => p.subscriptionStatus === "READ_ONLY" || p.subscriptionStatus === "SUSPENDED").length;

  async function saveRenew(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!renewId) return;
    setFormError(null);
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    try {
      await adminApi.renew(renewId, parseInt(String(fd.get("months")), 10));
      setRenewId(null);
      r1();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "فشل التجديد");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="الاشتراكات ولوحة الإدارة"
        subtitle={isAdmin ? "إدارة اشتراكات جميع الصيدليات على المنصة" : "متابعة اشتراك صيدليتك الحالي"}
      />

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="صيدليات نشطة" value={String(active)} icon={<Power size={20} />} tone="green" />
        <StatCard label="اشتراكات قاربت على الانتهاء" value={String(expiring)} hint="يُرسل تنبيه تلقائي" icon={<Bell size={20} />} tone="orange" />
        <StatCard label="اشتراكات منتهية" value={String(expired)} hint="وضع القراءة فقط" icon={<RefreshCw size={20} />} tone="red" />
      </div>

      <Card noPad>
        <div className="p-5">
          <Table head={["الصيدلية", "الباقة", "عدد الفروع", "بداية الاشتراك", "نهاية الاشتراك", "الحالة", ""]}>
            {list.map((s) => (
              <Tr key={s.id}>
                <Td className="font-semibold">{s.name}</Td>
                <Td>{s.planName}</Td>
                <Td className="tabular-nums">{s._count?.branches ?? 0}</Td>
                <Td className="text-slate-500 tabular-nums">{dateOnly(s.subscriptionStart)}</Td>
                <Td className="text-slate-500 tabular-nums">{dateOnly(s.subscriptionEnd)}</Td>
                <Td><StatusBadge status={label("subscription", s.subscriptionStatus)} /></Td>
                <Td>
                  {isAdmin && (
                    <button className="text-xs font-bold text-urs-green" onClick={() => setRenewId(s.id)}>تجديد</button>
                  )}
                </Td>
              </Tr>
            ))}
          </Table>
        </div>
      </Card>

      <Modal open={!!renewId} onClose={() => setRenewId(null)} title="تجديد الاشتراك">
        <form onSubmit={saveRenew}>
          <FormError message={formError} />
          <Field label="عدد الأشهر">
            <select name="months" required className={inputClass} defaultValue="12">
              <option value="1">شهر واحد</option>
              <option value="3">3 أشهر</option>
              <option value="6">6 أشهر</option>
              <option value="12">سنة</option>
            </select>
          </Field>
          <Button type="submit" disabled={saving}>تأكيد التجديد</Button>
        </form>
      </Modal>
    </div>
  );
}
