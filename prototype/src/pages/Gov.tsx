import { RefreshCw, ShieldCheck, Radio } from "lucide-react";
import { Card, PageHeader, StatCard, StatusBadge, Table, Td, Tr } from "../components/ui";
import { govApi } from "../api";
import { useAsyncData } from "../hooks/useAsyncData";
import { LoadingState, ErrorState } from "../components/AsyncState";
import { dateAr, label } from "../lib/labels";
import { Can } from "../components/Can";

export default function Gov() {
  const { data, loading, error, reload } = useAsyncData(() => govApi.list(), []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  const pending = (data ?? []).filter((g) => g.status === "QUEUED" || g.status === "RETRYING").length;
  const rejected = (data ?? []).filter((g) => g.status === "REJECTED").length;
  const accepted = (data ?? []).filter((g) => g.status === "ACCEPTED").length;

  async function retry(id: string) {
    try {
      await govApi.retry(id);
      reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "فشلت إعادة المحاولة");
    }
  }

  return (
    <div>
      <PageHeader title="الربط الحكومي" subtitle="تجهيز النظام للربط مع هيئة الزكاة والضريبة والجمارك (فوترة إلكترونية) ونظام رصد" />

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="عمليات مقبولة" value={String(accepted)} icon={<ShieldCheck size={20} />} tone="green" />
        <StatCard label="عمليات معلقة / إعادة محاولة" value={String(pending)} hint="سيُعاد الإرسال تلقائيًا" icon={<RefreshCw size={20} />} tone="orange" />
        <StatCard label="عمليات مرفوضة" value={String(rejected)} hint="تحتاج مراجعة يدوية" icon={<Radio size={20} />} tone="red" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-6">
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-xl bg-urs-green-lighter text-urs-green-dark flex items-center justify-center font-black text-xs">زاتكا</div>
            <div>
              <p className="font-bold">هيئة الزكاة والضريبة والجمارك</p>
              <p className="text-xs text-slate-400">الفوترة الإلكترونية (مرحلة الربط والتكامل)</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            يعتمد التفعيل الفعلي للربط على توفير بيانات المنشأة ومفاتيح الوصول والشهادات من الهيئة.
          </p>
        </Card>
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-xl bg-urs-orange-light text-urs-orange flex items-center justify-center font-black text-xs">رصد</div>
            <div>
              <p className="font-bold">نظام رصد</p>
              <p className="text-xs text-slate-400">تسجيل حالة الإرسال ومتابعة العمليات</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            إرسال العمليات عبر قائمة انتظار مستقلة مع إعادة المحاولة تلقائيًا عند فشل الاتصال.
          </p>
        </Card>
      </div>

      <Card noPad>
        <div className="flex items-center justify-between p-5 pb-0">
          <h3 className="font-bold">قائمة انتظار العمليات</h3>
        </div>
        <div className="p-5 pt-4">
          <Table head={["رقم العملية", "النوع", "الفاتورة المرتبطة", "الوقت", "الحالة", ""]}>
            {(data ?? []).map((g) => (
              <Tr key={g.id}>
                <Td className="font-semibold text-urs-green">{g.id.slice(0, 8)}</Td>
                <Td>{label("govType", g.type)}</Td>
                <Td className="text-slate-500">{g.salesInvoice.invoiceNumber}</Td>
                <Td className="text-slate-500 tabular-nums">{dateAr(g.createdAt)}</Td>
                <Td><StatusBadge status={label("govStatus", g.status)} /></Td>
                <Td>
                  <Can perm="UPDATE">
                    {(g.status === "REJECTED" || g.status === "RETRYING") && (
                      <button className="text-xs font-bold text-urs-green flex items-center gap-1" onClick={() => retry(g.id)}>
                        <RefreshCw size={12} /> إعادة المحاولة
                      </button>
                    )}
                  </Can>
                </Td>
              </Tr>
            ))}
          </Table>
        </div>
      </Card>
    </div>
  );
}
