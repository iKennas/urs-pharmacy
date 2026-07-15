import { useState } from "react";
import { Plus, MapPin, Users } from "lucide-react";
import { Button, Card, PageHeader, StatusBadge } from "../components/ui";
import { branchesApi, pharmacyApi } from "../api";
import { useAsyncData } from "../hooks/useAsyncData";
import { LoadingState, ErrorState } from "../components/AsyncState";
import { label } from "../lib/labels";
import { LogoMark } from "../assets/logo";
import { Can } from "../components/Can";
import { Modal, Field, inputClass, FormError } from "../components/Modal";

export default function Branches() {
  const { data: pharmacy, loading: l1, error: e1, reload: r1 } = useAsyncData(() => pharmacyApi.me(), []);
  const { data: branches, loading: l2, error: e2, reload: r2 } = useAsyncData(() => branchesApi.list(), []);
  const [showBranch, setShowBranch] = useState(false);
  const [showPharmacy, setShowPharmacy] = useState(false);
  const [editBranch, setEditBranch] = useState<{ id: string; name: string; city: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (l1 || l2) return <LoadingState />;
  if (e1 || e2) return <ErrorState message={e1 ?? e2 ?? ""} />;

  async function saveBranch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "");
    const city = String(fd.get("city") ?? "");
    try {
      if (editBranch) {
        await branchesApi.update(editBranch.id, { name, city });
      } else {
        await branchesApi.create({ name, city });
      }
      setShowBranch(false);
      setEditBranch(null);
      r2();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "فشل الحفظ");
    } finally {
      setSaving(false);
    }
  }

  async function savePharmacy(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    try {
      await pharmacyApi.update({
        name: String(fd.get("name") ?? ""),
        taxNumber: String(fd.get("taxNumber") ?? "") || undefined,
        commercialRegister: String(fd.get("commercialRegister") ?? "") || undefined,
        invoiceFooterNote: String(fd.get("invoiceFooterNote") ?? "") || undefined,
      });
      setShowPharmacy(false);
      r1();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "فشل الحفظ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="إدارة الصيدليات والفروع"
        subtitle="بيانات الصيدلية والشعار والرقم الضريبي، إضافة الفروع حسب الباقة، وربط الموظفين والمخزون بكل فرع"
        action={
          <Can perm="CREATE">
            <Button onClick={() => { setEditBranch(null); setShowBranch(true); }}>
              <Plus size={16} /> إضافة فرع
            </Button>
          </Can>
        }
      />

      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-6">
          <LogoMark size={64} />
          <div className="flex-1 min-w-[200px]">
            <p className="font-extrabold text-lg">{pharmacy?.name}</p>
            <p className="text-sm text-slate-400">
              الرقم الضريبي: {pharmacy?.taxNumber ?? "—"} · {pharmacy?.planName} (حتى {pharmacy?.maxBranches} فروع)
            </p>
          </div>
          <Can perm="UPDATE">
            <Button variant="ghost" onClick={() => setShowPharmacy(true)}>
              تعديل بيانات الصيدلية
            </Button>
          </Can>
        </div>
      </Card>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(branches ?? []).map((b) => (
          <Card key={b.id}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-urs-green-lighter text-urs-green-dark flex items-center justify-center">
                <MapPin size={18} />
              </div>
              <StatusBadge status={label("branch", b.status)} />
            </div>
            <p className="font-bold mb-1">{b.name}</p>
            <p className="text-xs text-slate-400 mb-3">{b.city}</p>
            <div className="flex items-center justify-between border-t border-urs-border pt-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Users size={13} /> {b._count?.users ?? 0} موظفين
              </div>
              <Can perm="UPDATE">
                <button
                  className="text-xs font-bold text-urs-green"
                  onClick={() => { setEditBranch({ id: b.id, name: b.name, city: b.city }); setShowBranch(true); }}
                >
                  تعديل
                </button>
              </Can>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={showBranch} onClose={() => { setShowBranch(false); setEditBranch(null); }} title={editBranch ? "تعديل الفرع" : "إضافة فرع"}>
        <form onSubmit={saveBranch}>
          <FormError message={formError} />
          <Field label="اسم الفرع">
            <input name="name" required defaultValue={editBranch?.name} className={inputClass} />
          </Field>
          <Field label="المدينة">
            <input name="city" defaultValue={editBranch?.city} className={inputClass} />
          </Field>
          <Button type="submit" disabled={saving}>{saving ? "جاري الحفظ..." : "حفظ"}</Button>
        </form>
      </Modal>

      <Modal open={showPharmacy} onClose={() => setShowPharmacy(false)} title="تعديل بيانات الصيدلية">
        <form onSubmit={savePharmacy}>
          <FormError message={formError} />
          <Field label="اسم الصيدلية">
            <input name="name" required defaultValue={pharmacy?.name} className={inputClass} />
          </Field>
          <Field label="الرقم الضريبي">
            <input name="taxNumber" defaultValue={pharmacy?.taxNumber ?? ""} className={inputClass} />
          </Field>
          <Field label="السجل التجاري">
            <input name="commercialRegister" defaultValue={pharmacy?.commercialRegister ?? ""} className={inputClass} />
          </Field>
          <Field label="ملاحظة تذييل الفاتورة">
            <textarea name="invoiceFooterNote" defaultValue={pharmacy?.invoiceFooterNote ?? ""} className={inputClass} rows={2} />
          </Field>
          <Button type="submit" disabled={saving}>{saving ? "جاري الحفظ..." : "حفظ"}</Button>
        </form>
      </Modal>
    </div>
  );
}
