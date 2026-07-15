import { Wallet, PackageX, CalendarClock, Users2, TrendingUp } from "lucide-react";
import { Card, PageHeader, StatCard, StatusBadge, Table, Td, Tr } from "../components/ui";
import { branchesApi, inventoryApi, reportsApi, salesApi } from "../api";
import { useAsyncData } from "../hooks/useAsyncData";
import { LoadingState, ErrorState } from "../components/AsyncState";
import { label, money } from "../lib/labels";

export default function Dashboard() {
  const today = new Date();
  const from = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const to = today.toISOString();

  const { data: summary, loading: l1, error: e1 } = useAsyncData(() => reportsApi.salesSummary(from, to), []);
  const { data: topProducts, loading: l2, error: e2 } = useAsyncData(() => reportsApi.topProducts(), []);
  const { data: debts, loading: l3, error: e3 } = useAsyncData(() => reportsApi.debtsAndDues(), []);
  const { data: profit, loading: l4, error: e4 } = useAsyncData(() => reportsApi.estimatedProfit(), []);
  const { data: sales, loading: l5, error: e5 } = useAsyncData(() => salesApi.list({ from, to }), []);
  const { data: branches, loading: l6, error: e6 } = useAsyncData(() => branchesApi.list(), []);
  const { data: lowStock, loading: l7, error: e7 } = useAsyncData(() => inventoryApi.lowStock(), []);

  if (l1 || l2 || l3 || l4 || l5 || l6 || l7) return <LoadingState />;
  if (e1 || e2 || e3 || e4 || e5 || e6 || e7) return <ErrorState message={e1 ?? e2 ?? e3 ?? e4 ?? e5 ?? e6 ?? e7 ?? ""} />;

  const maxQty = topProducts?.[0]?.qty ?? 1;

  return (
    <div>
      <PageHeader
        title="لوحة التحكم"
        subtitle={`نظرة عامة على أداء صيدليتك — ${today.toLocaleDateString("ar-SA", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="مبيعات اليوم"
          value={money(summary?.totalSales ?? 0)}
          hint={`${summary?.invoiceCount ?? 0} فاتورة`}
          icon={<Wallet size={20} />}
          tone="green"
        />
        <StatCard
          label="ربح تقديري"
          value={money(profit?.estimatedNetProfit ?? 0)}
          hint="تقديري وفق البيانات المدخلة"
          icon={<TrendingUp size={20} />}
          tone="green"
        />
        <StatCard
          label="أصناف منخفضة"
          value={String(lowStock?.length ?? 0)}
          hint="أقل من الحد الأدنى"
          icon={<PackageX size={20} />}
          tone="orange"
        />
        <StatCard
          label="ديون العملاء"
          value={money(debts?.customerDebt ?? 0)}
          hint={`مستحقات الموردين ${money(debts?.supplierDue ?? 0)}`}
          icon={<Users2 size={20} />}
          tone="red"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <h3 className="font-bold text-urs-ink mb-4">أفضل المنتجات مبيعًا</h3>
          <div className="space-y-3.5">
            {(topProducts ?? []).map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-urs-green-lighter text-urs-green-dark text-xs font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold truncate">{p.name}</span>
                    <span className="text-slate-400 shrink-0">{p.qty}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-urs-orange rounded-full" style={{ width: `${(p.qty / maxQty) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="font-bold text-urs-ink mb-4">ملخص الفروع</h3>
          <div className="space-y-3">
            {(branches ?? []).map((b) => (
              <div key={b.id} className="flex items-center justify-between text-sm border-b border-urs-border last:border-0 pb-3 last:pb-0">
                <div>
                  <p className="font-semibold">{b.name}</p>
                  <p className="text-xs text-slate-400">{b.city} · {b._count?.users ?? 0} موظفين</p>
                </div>
                <StatusBadge status={label("branch", b.status)} />
              </div>
            ))}
          </div>
          {(lowStock?.length ?? 0) > 0 && (
            <div className="mt-4 pt-4 border-t border-urs-border flex items-center gap-2 text-xs text-urs-orange bg-urs-orange-light rounded-xl p-3">
              <CalendarClock size={15} />
              {lowStock!.length} صنف يحتاج مراجعة مخزون
            </div>
          )}
        </Card>
      </div>

      <Card noPad>
        <div className="flex items-center justify-between p-5 pb-0">
          <h3 className="font-bold text-urs-ink">أحدث الفواتير</h3>
        </div>
        <div className="p-5 pt-3">
          <Table head={["رقم الفاتورة", "الفرع", "العميل", "الإجمالي", "الحالة"]}>
            {(sales ?? []).slice(0, 8).map((s) => (
              <Tr key={s.id}>
                <Td className="font-semibold text-urs-green">{s.invoiceNumber}</Td>
                <Td className="text-slate-500">{s.branch.name}</Td>
                <Td>{s.customer?.name ?? "زبون نقدي"}</Td>
                <Td className="font-semibold">{money(s.total)}</Td>
                <Td>
                  <StatusBadge status={label("sale", s.status)} />
                </Td>
              </Tr>
            ))}
          </Table>
        </div>
      </Card>
    </div>
  );
}
