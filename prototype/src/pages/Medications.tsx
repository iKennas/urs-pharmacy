import { useRef, useState } from "react";
import { Search, Plus, FileUp, FileDown, Pencil, Barcode } from "lucide-react";
import { Button, Card, PageHeader, Table, Td, Tr } from "../components/ui";
import { medicationsApi } from "../api";
import type { Medication } from "../api/types";
import { useAsyncData } from "../hooks/useAsyncData";
import { LoadingState, ErrorState } from "../components/AsyncState";
import { label } from "../lib/labels";
import { Can } from "../components/Can";
import { Modal, Field, inputClass, FormError } from "../components/Modal";

export default function Medications() {
  const [query, setQuery] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const { data, loading, error, reload } = useAsyncData(() => medicationsApi.list(query || undefined), [query]);
  const { data: categories, reload: reloadCats } = useAsyncData(() => medicationsApi.categories(), []);
  const [showForm, setShowForm] = useState(false);
  const [editMed, setEditMed] = useState<Medication | null>(null);
  const [showCategory, setShowCategory] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  async function saveMedication(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const body = {
      name: String(fd.get("name")),
      scientificName: String(fd.get("scientificName") || "") || undefined,
      barcode: String(fd.get("barcode")),
      categoryId: String(fd.get("categoryId") || "") || undefined,
      manufacturer: String(fd.get("manufacturer") || "") || undefined,
      form: String(fd.get("form") || "") || undefined,
      saleUnit: String(fd.get("saleUnit")),
      buyPrice: parseFloat(String(fd.get("buyPrice"))),
      sellPrice: parseFloat(String(fd.get("sellPrice"))),
      taxRate: parseFloat(String(fd.get("taxRate") || "15")),
      minStock: parseInt(String(fd.get("minStock") || "0"), 10),
    };
    try {
      if (editMed) await medicationsApi.update(editMed.id, body);
      else await medicationsApi.create(body);
      setShowForm(false);
      setEditMed(null);
      reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "فشل الحفظ");
    } finally {
      setSaving(false);
    }
  }

  async function saveCategory(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    try {
      await medicationsApi.createCategory(String(fd.get("name")));
      setShowCategory(false);
      reloadCats();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "فشل الإضافة");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="إدارة الأصناف والأدوية"
        subtitle="تسجيل الأدوية بالاسم العلمي والتجاري، الباركود، التصنيف، الأسعار، والحد الأدنى للمخزون"
        action={
          <div className="flex gap-2 flex-wrap">
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) { await medicationsApi.importExcel(file); reload(); }
            }} />
            <Can perm="CREATE">
              <Button variant="ghost" onClick={() => fileRef.current?.click()}>
                <FileUp size={16} /> استيراد Excel
              </Button>
            </Can>
            <Button variant="ghost" onClick={() => medicationsApi.exportExcel()}>
              <FileDown size={16} /> تصدير Excel
            </Button>
            <Can perm="CREATE">
              <Button variant="ghost" onClick={() => setShowCategory(true)}>تصنيف جديد</Button>
              <Button onClick={() => { setEditMed(null); setShowForm(true); }}>
                <Plus size={16} /> إضافة صنف
              </Button>
            </Can>
          </div>
        }
      />

      <Card noPad>
        <div className="p-5 pb-0 flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث بالاسم أو الباركود..."
              className="w-full rounded-xl border border-urs-border py-2.5 pr-10 pl-3 text-sm outline-none focus:border-urs-green-light focus:ring-2 focus:ring-urs-green-light/20"
            />
          </div>
        </div>
        <div className="p-5 pt-4">
          <Table head={["الصنف", "الاسم العلمي", "الباركود", "التصنيف", "وحدة البيع", "سعر الشراء", "سعر البيع", "الحد الأدنى", ""]}>
            {(data ?? []).map((m) => (
              <Tr key={m.id}>
                <Td className="font-semibold">{m.name}</Td>
                <Td className="text-slate-500">{m.scientificName ?? "—"}</Td>
                <Td className="text-slate-500 flex items-center gap-1.5">
                  <Barcode size={14} className="text-slate-300" /> {m.barcode}
                </Td>
                <Td>{m.category?.name ?? "—"}</Td>
                <Td>{label("unit", m.saleUnit)}</Td>
                <Td className="tabular-nums">{parseFloat(m.buyPrice).toFixed(2)}</Td>
                <Td className="tabular-nums font-semibold text-urs-green">{parseFloat(m.sellPrice).toFixed(2)}</Td>
                <Td className="tabular-nums text-slate-400">{m.minStock}</Td>
                <Td>
                  <Can perm="UPDATE">
                    <button className="text-slate-400 hover:text-urs-green" onClick={() => { setEditMed(m); setShowForm(true); }}>
                      <Pencil size={15} />
                    </button>
                  </Can>
                </Td>
              </Tr>
            ))}
          </Table>
        </div>
      </Card>

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditMed(null); }} title={editMed ? "تعديل صنف" : "إضافة صنف"} wide>
        <form onSubmit={saveMedication}>
          <FormError message={formError} />
          <div className="grid sm:grid-cols-2 gap-x-4">
            <Field label="الاسم التجاري"><input name="name" required defaultValue={editMed?.name} className={inputClass} /></Field>
            <Field label="الاسم العلمي"><input name="scientificName" defaultValue={editMed?.scientificName ?? ""} className={inputClass} /></Field>
            <Field label="الباركود"><input name="barcode" required defaultValue={editMed?.barcode} className={inputClass} dir="ltr" /></Field>
            <Field label="التصنيف">
              <select name="categoryId" defaultValue={editMed?.category?.id ?? ""} className={inputClass}>
                <option value="">بدون تصنيف</option>
                {(categories ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="الشركة المصنعة"><input name="manufacturer" defaultValue={editMed?.manufacturer ?? ""} className={inputClass} /></Field>
            <Field label="الشكل الدوائي"><input name="form" defaultValue={editMed?.form ?? ""} className={inputClass} /></Field>
            <Field label="وحدة البيع">
              <select name="saleUnit" required defaultValue={editMed?.saleUnit ?? "PIECE"} className={inputClass}>
                <option value="PIECE">حبة</option>
                <option value="STRIP">شريط</option>
                <option value="BOX">علبة</option>
              </select>
            </Field>
            <Field label="سعر الشراء"><input name="buyPrice" type="number" step="0.01" min="0" required defaultValue={editMed?.buyPrice ?? ""} className={inputClass} /></Field>
            <Field label="سعر البيع"><input name="sellPrice" type="number" step="0.01" min="0" required defaultValue={editMed?.sellPrice ?? ""} className={inputClass} /></Field>
            <Field label="نسبة الضريبة %"><input name="taxRate" type="number" step="0.01" min="0" defaultValue={editMed?.taxRate ?? "15"} className={inputClass} /></Field>
            <Field label="الحد الأدنى للمخزون"><input name="minStock" type="number" min="0" defaultValue={editMed?.minStock ?? 0} className={inputClass} /></Field>
          </div>
          <Button type="submit" disabled={saving} className="mt-2">{saving ? "جاري الحفظ..." : "حفظ"}</Button>
        </form>
      </Modal>

      <Modal open={showCategory} onClose={() => setShowCategory(false)} title="إضافة تصنيف">
        <form onSubmit={saveCategory}>
          <FormError message={formError} />
          <Field label="اسم التصنيف"><input name="name" required className={inputClass} /></Field>
          <Button type="submit" disabled={saving}>إضافة</Button>
        </form>
      </Modal>
    </div>
  );
}
