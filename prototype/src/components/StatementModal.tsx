import { useEffect, useState } from "react";
import { Button } from "./ui";
import { Modal } from "./Modal";
import { LoadingState } from "./AsyncState";
import { dateOnly, money } from "../lib/labels";
import { printHtml } from "../lib/printStatement";
import { customersApi, suppliersApi } from "../api";
import type { CustomerStatement, SupplierStatement } from "../api/types";

type StatementData = CustomerStatement | SupplierStatement;

function isCustomerStatement(s: StatementData): s is CustomerStatement {
  return "payments" in s;
}

export function StatementModal({
  open,
  onClose,
  title,
  kind,
  entityId,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  kind: "customer" | "supplier";
  entityId: string | null;
}) {
  const [data, setData] = useState<StatementData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !entityId) {
      setData(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    const fetcher = kind === "customer" ? customersApi.statement(entityId) : suppliersApi.statement(entityId);
    fetcher
      .then((result) => { if (!cancelled) setData(result); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : "فشل تحميل كشف الحساب"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, entityId, kind]);

  function handleClose() {
    setData(null);
    setError(null);
    onClose();
  }

  function handlePrint() {
    if (!data) return;
    const name = isCustomerStatement(data) ? data.customer.name : data.supplier.name;
    const rows = isCustomerStatement(data)
      ? [
          ...data.invoices.map(
            (i) =>
              `<tr><td>فاتورة ${i.invoiceNumber}</td><td>${dateOnly(i.createdAt)}</td><td>${money(i.total)}</td><td>مدين</td></tr>`,
          ),
          ...data.payments.map(
            (p) =>
              `<tr><td>دفعة</td><td>${dateOnly(p.createdAt)}</td><td>${money(p.amount)}</td><td>دائن</td></tr>`,
          ),
        ].join("")
      : data.invoices
          .map(
            (i) =>
              `<tr><td>فاتورة ${i.invoiceNumber}</td><td>${dateOnly(i.date)}</td><td>${money(i.total)}</td><td>مدفوع ${money(i.paid)}</td></tr>`,
          )
          .join("");

    printHtml(
      `كشف حساب — ${name}`,
      `<h1>كشف حساب — ${name}</h1>
       <p>إجمالي الفواتير: ${money(data.totalInvoiced)} · المدفوع: ${money(data.totalPaid)} · الرصيد: ${money(data.balanceDue)}</p>
       <table><thead><tr><th>البيان</th><th>التاريخ</th><th>المبلغ</th><th>ملاحظة</th></tr></thead><tbody>${rows}</tbody></table>
       <p class="summary">الرصيد المتبقي: ${money(data.balanceDue)}</p>`,
    );
  }

  async function handleShare() {
    if (!data) return;
    const name = isCustomerStatement(data) ? data.customer.name : data.supplier.name;
    const text = `كشف حساب ${name}\nالرصيد المتبقي: ${money(data.balanceDue)}`;
    if (navigator.share) {
      await navigator.share({ title: `كشف حساب — ${name}`, text });
    } else {
      await navigator.clipboard.writeText(text);
      alert("تم نسخ ملخص كشف الحساب");
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title={title} wide>
      {loading && <LoadingState />}
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {data && (
        <>
          <div className="grid sm:grid-cols-3 gap-3 mb-4 text-sm">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-slate-500 text-xs">إجمالي الفواتير</p>
              <p className="font-bold">{money(data.totalInvoiced)}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-slate-500 text-xs">المدفوع</p>
              <p className="font-bold text-urs-green">{money(data.totalPaid)}</p>
            </div>
            <div className="bg-urs-orange-light rounded-xl p-3">
              <p className="text-urs-orange text-xs">الرصيد المتبقي</p>
              <p className="font-bold text-urs-orange">{money(data.balanceDue)}</p>
            </div>
          </div>

          {isCustomerStatement(data) && data.invoices.length > 0 && (
            <div className="mb-4">
              <p className="font-bold text-sm mb-2">الفواتير</p>
              <div className="space-y-1 text-sm max-h-40 overflow-y-auto">
                {data.invoices.map((i) => (
                  <div key={i.id} className="flex justify-between border-b border-urs-border py-1.5">
                    <span>{i.invoiceNumber}</span>
                    <span>{money(i.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isCustomerStatement(data) && data.invoices.length > 0 && (
            <div className="mb-4">
              <p className="font-bold text-sm mb-2">فواتير الشراء</p>
              <div className="space-y-1 text-sm max-h-40 overflow-y-auto">
                {data.invoices.map((i) => (
                  <div key={i.id} className="flex justify-between border-b border-urs-border py-1.5">
                    <span>{i.invoiceNumber}</span>
                    <span>{money(i.total)} (مدفوع {money(i.paid)})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            <Button onClick={handlePrint}>طباعة / PDF</Button>
            <Button variant="ghost" onClick={handleShare}>مشاركة</Button>
            <Button variant="ghost" onClick={handleClose}>إغلاق</Button>
          </div>
        </>
      )}
    </Modal>
  );
}
