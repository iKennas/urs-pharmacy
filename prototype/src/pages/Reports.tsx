import { useState } from "react";
import { Plus, FileBarChart, Users2, Coins, Landmark } from "lucide-react";
import { Button, Card, PageHeader, Table, Td, Tr } from "../components/ui";
import { branchesApi, expensesApi, reportsApi } from "../api";
import { useAsyncData } from "../hooks/useAsyncData";
import { LoadingState, ErrorState } from "../components/AsyncState";
import { dateOnly, money } from "../lib/labels";
import { Can } from "../components/Can";
import { Modal, Field, inputClass, FormError } from "../components/Modal";

const reportCards = [
  { title: "المبيعات اليومية والشهرية", icon: FileBarChart, key: "sales" },
  { title: "تقارير الفروع والمستخدمين", icon: Users2, key: "branches" },
  { title: "أفضل المنتجات مبيعًا", icon: FileBarChart, key: "top" },
  { title: "قيمة المخزون", icon: Coins, key: "inventory" },
  { title: "ديون العملاء ومستحقات الموردين", icon: Landmark, key: "debts" },
  { title: "تقرير أرباح تقديري", icon: Coins, key: "profit" },
];

export default function Reports() {
  const [tab, setTab] = useState<"reports" | "expenses">("reports");
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [showExpense, setShowExpense] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: expenses, loading: l1, error: e1, reload: rExp } = useAsyncData(() => expensesApi.list(), []);
  const { data: branches } = useAsyncData(() => branchesApi.list(), []);
  const { data: salesSummary, loading: l2, error: e2 } = useAsyncData(() => reportsApi.salesSummary(), []);
  const { data: byBranch, loading: l3, error: e3 } = useAsyncData(() => reportsApi.byBranch(), []);
  const { data: topProducts, loading: l4, error: e4 } = useAsyncData(() => reportsApi.topProducts(), []);
  const { data: inventoryValue, loading: l5, error: e5 } = useAsyncData(() => reportsApi.inventoryValue(), []);
  const { data: debts, loading: l6, error: e6 } = useAsyncData(() => reportsApi.debtsAndDues(), []);
  const { data: profit, loading: l7, error: e7 } = useAsyncData(() => reportsApi.estimatedProfit(), []);

  if (l1 || l2 || l3 || l4 || l5 || l6 || l7) return <LoadingState />;
  if (e1 || e2 || e3 || e4 || e5 || e6 || e7) return <ErrorState message={e1 ?? e2 ?? e3 ?? e4 ?? e5 ?? e6 ?? e7 ?? ""} />;

  async function saveExpense(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    try {
      await expensesApi.create({
        type: String(fd.get("type")),
        amount: parseFloat(String(fd.get("amount"))),
        branchId: String(fd.get("branchId") || "") || undefined,
        date: String(fd.get("date") || "") || undefined,
        note: String(fd.get("note") || "") || undefined,
      });
      setShowExpense(false);
      rExp();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "فشل التسجيل");
    } finally {
      setSaving(false);
    }
  }

  function renderReportDetail() {
    switch (activeReport) {
      case "sales":
        return (
          <Card>
            <p className="font-bold mb-3">ملخص المبيعات</p>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <p>عدد الفواتير: <strong>{salesSummary?.invoiceCount}</strong></p>
              <p>إجمالي المبيعات: <strong>{money(salesSummary?.totalSales ?? 0)}</strong></p>
              <p>مبيعات نقدية: <strong>{money(salesSummary?.cashSales ?? 0)}</strong></p>
              <p>مبيعات آجلة: <strong>{money(salesSummary?.creditSales ?? 0)}</strong></p>
            </div>
          </Card>
        );
      case "branches":
        return (
          <Card noPad>
            <div className="p-5">
              <Table head={["الفرع", "عدد الفواتير", "الإجمالي"]}>
                {(byBranch ?? []).map((b) => (
                  <Tr key={b.branchName}>
                    <Td className="font-semibold">{b.branchName}</Td>
                    <Td>{b.count}</Td>
                    <Td>{money(b.total)}</Td>
                  </Tr>
                ))}
              </Table>
            </div>
          </Card>
        );
      case "top":
        return (
          <Card noPad>
            <div className="p-5">
              <Table head={["المنتج", "الكمية المباعة"]}>
                {(topProducts ?? []).map((p) => (
                  <Tr key={p.name}>
                    <Td className="font-semibold">{p.name}</Td>
                    <Td>{p.qty}</Td>
                  </Tr>
                ))}
              </Table>
            </div>
          </Card>
        );
      case "inventory":
        return (
          <Card>
            <p className="font-bold mb-3">قيمة المخزون</p>
            <p className="text-sm">بسعر الشراء: <strong>{money(inventoryValue?.atBuyPrice ?? 0)}</strong></p>
            <p className="text-sm">بسعر البيع: <strong>{money(inventoryValue?.atSellPrice ?? 0)}</strong></p>
            <p className="text-sm text-slate-500">عدد الأصناف: {inventoryValue?.itemCount}</p>
          </Card>
        );
      case "debts":
        return (
          <Card>
            <p className="font-bold mb-3">الديون والمستحقات</p>
            <p className="text-sm">ديون العملاء: <strong className="text-urs-orange">{money(debts?.customerDebt ?? 0)}</strong></p>
            <p className="text-sm">مستحقات الموردين: <strong>{money(debts?.supplierDue ?? 0)}</strong></p>
          </Card>
        );
      case "profit":
        return (
          <Card>
            <p className="font-bold mb-3">تقرير أرباح تقديري</p>
            <p className="text-sm">الإيرادات: <strong>{money(profit?.revenue ?? 0)}</strong></p>
            <p className="text-sm">صافي الربح التقديري: <strong className="text-urs-green">{money(profit?.estimatedNetProfit ?? 0)}</strong></p>
            <p className="text-xs text-urs-orange mt-3">{profit?.disclaimer}</p>
          </Card>
        );
      default:
        return null;
    }
  }

  return (
    <div>
      <PageHeader
        title="المصروفات والتقارير"
        subtitle="تسجيل المصروفات حسب النوع والفرع والتاريخ، مع مجموعة تقارير جاهزة للتصدير"
        action={
          tab === "expenses" ? (
            <Can perm="CREATE">
              <Button onClick={() => setShowExpense(true)}>
                <Plus size={16} /> تسجيل مصروف
              </Button>
            </Can>
          ) : undefined
        }
      />

      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setTab("reports")}
          className={`px-4 py-2 rounded-xl text-sm font-bold ${tab === "reports" ? "bg-urs-green text-white" : "bg-white border border-urs-border text-slate-600"}`}
        >
          التقارير
        </button>
        <button
          onClick={() => setTab("expenses")}
          className={`px-4 py-2 rounded-xl text-sm font-bold ${tab === "expenses" ? "bg-urs-green text-white" : "bg-white border border-urs-border text-slate-600"}`}
        >
          المصروفات
        </button>
      </div>

      {tab === "reports" ? (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {reportCards.map((r) => (
              <Card
                key={r.title}
                className={`hover:border-urs-green-light transition-colors cursor-pointer ${activeReport === r.key ? "border-urs-green" : ""}`}
                onClick={() => setActiveReport(r.key)}
              >
                <div className="w-11 h-11 rounded-xl bg-urs-green-lighter text-urs-green-dark flex items-center justify-center mb-3">
                  <r.icon size={20} />
                </div>
                <p className="font-bold text-sm leading-snug">{r.title}</p>
              </Card>
            ))}
            <Card className="sm:col-span-2 lg:col-span-3 bg-urs-orange-light border-urs-orange/20 text-urs-orange text-xs font-semibold">
              ملاحظة: تقرير الأرباح تقديري ويعتمد على البيانات المدخلة داخل النظام، ولا يُعد بديلاً عن التقارير المحاسبية الرسمية.
            </Card>
          </div>
          {renderReportDetail()}
        </>
      ) : (
        <Card noPad>
          <div className="p-5">
            <Table head={["نوع المصروف", "الفرع", "المبلغ", "التاريخ"]}>
              {(expenses ?? []).map((e) => (
                <Tr key={e.id}>
                  <Td className="font-semibold">{e.type}</Td>
                  <Td className="text-slate-500">{e.branch?.name ?? "كل الفروع"}</Td>
                  <Td className="tabular-nums font-semibold text-urs-orange">{money(e.amount)}</Td>
                  <Td className="text-slate-500 tabular-nums">{dateOnly(e.date)}</Td>
                </Tr>
              ))}
            </Table>
          </div>
        </Card>
      )}

      <Modal open={showExpense} onClose={() => setShowExpense(false)} title="تسجيل مصروف">
        <form onSubmit={saveExpense}>
          <FormError message={formError} />
          <Field label="نوع المصروف"><input name="type" required className={inputClass} placeholder="إيجار، رواتب، كهرباء..." /></Field>
          <Field label="المبلغ"><input name="amount" type="number" step="0.01" min="0.01" required className={inputClass} /></Field>
          <Field label="الفرع">
            <select name="branchId" className={inputClass}>
              <option value="">كل الفروع</option>
              {(branches ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Field>
          <Field label="التاريخ"><input name="date" type="date" className={inputClass} /></Field>
          <Field label="ملاحظة"><input name="note" className={inputClass} /></Field>
          <Button type="submit" disabled={saving}>تسجيل</Button>
        </form>
      </Modal>
    </div>
  );
}
