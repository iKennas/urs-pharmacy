import { useEffect, useState } from "react";
import { Search, Plus, Minus, Trash2, Pause, Printer, User, Banknote, CreditCard } from "lucide-react";
import { branchesApi, medicationsApi, salesApi } from "../api";
import { useAuth } from "../context/AuthContext";
import { useAsyncData } from "../hooks/useAsyncData";
import { LoadingState, ErrorState } from "../components/AsyncState";
import { label } from "../lib/labels";
import type { Medication } from "../api/types";

type CartLine = { id: string; name: string; price: number; qty: number; unit: string };

export default function Pos() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [payMethod, setPayMethod] = useState<"CASH" | "CREDIT">("CASH");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [branchId, setBranchId] = useState(user?.branchId ?? "");

  const { data: medications, loading: l1, error: e1 } = useAsyncData(() => medicationsApi.list(), []);
  const { data: categories, loading: l2, error: e2 } = useAsyncData(() => medicationsApi.categories(), []);
  const { data: branches, loading: l3, error: e3 } = useAsyncData(() => branchesApi.list(), []);

  useEffect(() => {
    if (user?.branchId) setBranchId(user.branchId);
    else if (branches?.length && !branchId) setBranchId(branches[0].id);
  }, [user?.branchId, branches, branchId]);

  if (l1 || l2 || l3) return <LoadingState />;
  if (e1 || e2 || e3) return <ErrorState message={e1 ?? e2 ?? e3 ?? ""} />;

  const filtered = (medications ?? []).filter(
    (m) =>
      (!activeCat || m.category?.name === activeCat) &&
      (m.name.includes(query) || m.barcode.includes(query)),
  );

  function addToCart(m: Medication) {
    const price = parseFloat(m.sellPrice);
    setCart((prev) => {
      const existing = prev.find((c) => c.id === m.id);
      if (existing) {
        return prev.map((c) => (c.id === m.id ? { ...c, qty: c.qty + 1 } : c));
      }
      return [...prev, { id: m.id, name: m.name, price, qty: 1, unit: label("unit", m.saleUnit) }];
    });
  }

  function updateQty(id: string, delta: number) {
    setCart((prev) =>
      prev.map((c) => (c.id === id ? { ...c, qty: Math.max(1, c.qty + delta) } : c)).filter((c) => c.qty > 0),
    );
  }

  function removeLine(id: string) {
    setCart((prev) => prev.filter((c) => c.id !== id));
  }

  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const tax = subtotal * 0.15;
  const total = subtotal + tax;

  async function completeSale() {
    if (!branchId || cart.length === 0) {
      setMessage("يرجى اختيار الفرع وإضافة منتجات للسلة");
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const invoice = await salesApi.create({
        branchId,
        items: cart.map((c) => ({ medicationId: c.id, quantity: c.qty })),
        paymentMethod: payMethod,
      });
      setCart([]);
      setMessage(`تم إنشاء الفاتورة ${invoice.invoiceNumber} بنجاح`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "فشل إتمام البيع");
    } finally {
      setSubmitting(false);
    }
  }

  async function holdSale() {
    if (!branchId || cart.length === 0) {
      setMessage("يرجى اختيار الفرع وإضافة منتجات للسلة");
      return;
    }
    setSubmitting(true);
    try {
      const invoice = await salesApi.hold({
        branchId,
        items: cart.map((c) => ({ medicationId: c.id, quantity: c.qty })),
        paymentMethod: payMethod,
      });
      setCart([]);
      setMessage(`تم تعليق الفاتورة ${invoice.invoiceNumber}`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "فشل تعليق الفاتورة");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-6 h-[calc(100vh-8.5rem)]">
      <div className="flex flex-col min-h-0">
        {message && (
          <div className="mb-3 rounded-xl bg-urs-green-lighter text-urs-green-dark text-sm px-4 py-2 font-semibold">{message}</div>
        )}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={17} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث بالاسم أو الباركود..."
              className="w-full rounded-xl border border-urs-border bg-white py-3 pr-11 pl-3 text-sm outline-none focus:border-urs-green-light focus:ring-2 focus:ring-urs-green-light/20"
              autoFocus
            />
          </div>
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveCat(null)}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap ${!activeCat ? "bg-urs-green text-white" : "bg-white border border-urs-border text-slate-600"}`}
          >
            الكل
          </button>
          {(categories ?? []).map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCat(c.name)}
              className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap ${activeCat === c.name ? "bg-urs-green text-white" : "bg-white border border-urs-border text-slate-600"}`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 overflow-y-auto pb-2">
          {filtered.map((m) => (
            <button
              key={m.id}
              onClick={() => addToCart(m)}
              className="text-right bg-white border border-urs-border rounded-2xl p-4 hover:border-urs-green-light hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="w-9 h-9 rounded-lg bg-urs-green-lighter text-urs-green-dark flex items-center justify-center text-xs font-bold">
                  {m.name.slice(0, 2)}
                </span>
              </div>
              <p className="font-bold text-sm mb-0.5 leading-tight">{m.name}</p>
              <p className="text-xs text-slate-400 mb-2">{m.category?.name}</p>
              <p className="font-extrabold text-urs-green">{parseFloat(m.sellPrice).toFixed(2)} ر.س</p>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-urs-border shadow-sm flex flex-col min-h-0">
        <div className="p-4 border-b border-urs-border flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-sm font-bold">
            <User size={16} className="text-slate-400" />
            زبون نقدي
          </div>
          {!user?.branchId && (
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="rounded-lg border border-urs-border px-2 py-1 text-xs outline-none focus:border-urs-green-light"
            >
              {(branches ?? []).map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 && <p className="text-sm text-slate-400 text-center py-10">السلة فارغة — أضف منتجات للبدء</p>}
          {cart.map((c) => (
            <div key={c.id} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{c.name}</p>
                <p className="text-xs text-slate-400">{c.price.toFixed(2)} ر.س / {c.unit}</p>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-1">
                <button onClick={() => updateQty(c.id, -1)} className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-white">
                  <Minus size={13} />
                </button>
                <span className="w-6 text-center text-sm font-bold tabular-nums">{c.qty}</span>
                <button onClick={() => updateQty(c.id, 1)} className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-white">
                  <Plus size={13} />
                </button>
              </div>
              <p className="w-16 text-left text-sm font-bold tabular-nums">{(c.price * c.qty).toFixed(2)}</p>
              <button onClick={() => removeLine(c.id)} className="text-red-400 hover:text-red-600">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-urs-border space-y-2 text-sm">
          <div className="flex justify-between text-slate-500">
            <span>الإجمالي قبل الضريبة</span>
            <span className="tabular-nums">{subtotal.toFixed(2)} ر.س</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>ضريبة القيمة المضافة (15%)</span>
            <span className="tabular-nums">{tax.toFixed(2)} ر.س</span>
          </div>
          <div className="flex justify-between text-base font-extrabold pt-2 border-t border-dashed border-urs-border">
            <span>الإجمالي المطلوب</span>
            <span className="text-urs-green tabular-nums">{total.toFixed(2)} ر.س</span>
          </div>
        </div>

        <div className="p-4 pt-0 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setPayMethod("CASH")}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border ${payMethod === "CASH" ? "bg-urs-green text-white border-urs-green" : "border-urs-border text-slate-600"}`}
            >
              <Banknote size={16} /> نقدي
            </button>
            <button
              onClick={() => setPayMethod("CREDIT")}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border ${payMethod === "CREDIT" ? "bg-urs-green text-white border-urs-green" : "border-urs-border text-slate-600"}`}
            >
              <CreditCard size={16} /> آجل
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              disabled={submitting || cart.length === 0}
              onClick={holdSale}
              className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50"
            >
              <Pause size={16} /> تعليق الفاتورة
            </button>
            <button
              disabled={submitting || cart.length === 0}
              onClick={completeSale}
              className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-urs-green-dark text-white hover:brightness-110 disabled:opacity-50"
            >
              <Printer size={16} /> {submitting ? "جاري الحفظ..." : "إتمام البيع"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
