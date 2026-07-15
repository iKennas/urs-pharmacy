import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Store,
  Users,
  Pill,
  Layers,
  Boxes,
  Truck,
  ShoppingCart,
  Receipt,
  Contact,
  BarChart3,
  Landmark,
  CreditCard,
  ShieldCheck,
  Bell,
  ChevronDown,
  LogOut,
  Search,
} from "lucide-react";
import { LogoCompactOnDark } from "../assets/logo";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const nav = [
  { to: "/app", label: "لوحة التحكم", icon: LayoutDashboard, end: true },
  { to: "/pos", label: "نقطة البيع", icon: ShoppingCart },
  { to: "/sales", label: "المبيعات والمرتجعات", icon: Receipt },
  { to: "/medications", label: "الأصناف والأدوية", icon: Pill },
  { to: "/batches", label: "الدفعات والتشغيلات", icon: Layers },
  { to: "/inventory", label: "إدارة المخزون", icon: Boxes },
  { to: "/purchases", label: "المشتريات والموردون", icon: Truck },
  { to: "/customers", label: "العملاء والديون", icon: Contact },
  { to: "/reports", label: "المصروفات والتقارير", icon: BarChart3 },
  { to: "/gov", label: "الربط الحكومي", icon: Landmark },
  { to: "/branches", label: "الصيدليات والفروع", icon: Store },
  { to: "/users", label: "المستخدمون والصلاحيات", icon: Users },
  { to: "/subscriptions", label: "الاشتراكات ولوحة الإدارة", icon: CreditCard },
  { to: "/security", label: "النسخ الاحتياطي والأمان", icon: ShieldCheck },
];

export default function Layout() {
  const navigate = useNavigate();
  const { user, admin, logout, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);

  const visibleNav = isAdmin ? nav.filter((item) => item.to === "/subscriptions") : nav;

  const displayName = user?.name ?? admin?.name ?? "";
  const displayRole = user?.roleName ?? "مشرف المنصة";
  const branchLabel = user?.branchName ?? "كل الصيدليات";
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen flex bg-urs-bg" dir="rtl">
      <aside className="w-64 shrink-0 bg-white border-l border-urs-border h-screen sticky top-0 flex flex-col">
        <div className="h-24 flex items-center justify-center border-b border-urs-border bg-urs-green-dark px-4">
          <LogoCompactOnDark height={62} />
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {visibleNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isActive ? "bg-urs-green text-white shadow-sm shadow-urs-green/25" : "text-slate-600 hover:bg-slate-100"
                }`
              }
            >
              <item.icon size={18} strokeWidth={2.2} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-urs-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100"
          >
            <LogOut size={18} />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-20 bg-white border-b border-urs-border flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="relative w-80 max-w-[40vw]">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="بحث سريع عن صنف، فاتورة، عميل..."
              className="w-full rounded-xl border border-urs-border bg-slate-50 py-2.5 pr-9 pl-3 text-sm outline-none focus:border-urs-green-light focus:ring-2 focus:ring-urs-green-light/20"
            />
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-bold bg-urs-green-lighter text-urs-green-dark px-3 py-1.5 rounded-full border border-urs-green-light/30">
                <Store size={13} /> {branchLabel}
              </span>
            )}
            <button className="relative w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200">
              <Bell size={18} />
            </button>
            <div className="relative">
              <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 pr-1 pl-2 py-1 rounded-xl hover:bg-slate-100">
                <div className="w-9 h-9 rounded-full bg-urs-green flex items-center justify-center text-white font-bold text-sm">{initials}</div>
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold leading-tight">{displayName}</p>
                  <p className="text-xs text-slate-400 leading-tight">{displayRole}</p>
                </div>
                <ChevronDown size={16} className="text-slate-400" />
              </button>
              {open && (
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-xl border border-urs-border shadow-lg p-1.5 text-sm">
                  <button
                    onClick={handleLogout}
                    className="w-full text-right px-3 py-2 rounded-lg hover:bg-slate-100 text-red-600 flex items-center gap-2"
                  >
                    <LogOut size={15} /> تسجيل الخروج
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
