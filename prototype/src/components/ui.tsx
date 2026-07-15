import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  noPad = false,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  noPad?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-urs-border shadow-sm ${noPad ? "" : "p-5"} ${className}`}
    >
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
      <div>
        <h1 className="text-xl font-extrabold text-urs-ink">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

const badgeTones: Record<string, string> = {
  green: "bg-urs-green-lighter text-urs-green-dark border-urs-green-light/30",
  orange: "bg-urs-orange-light text-urs-orange border-urs-orange/30",
  red: "bg-red-50 text-red-600 border-red-200",
  slate: "bg-slate-100 text-slate-600 border-slate-200",
  blue: "bg-blue-50 text-blue-600 border-blue-200",
};

export function Badge({ children, tone = "slate" }: { children: ReactNode; tone?: keyof typeof badgeTones }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeTones[tone]}`}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { tone: keyof typeof badgeTones }> = {
    "نشط": { tone: "green" },
    "مكتملة": { tone: "green" },
    "مسددة": { tone: "green" },
    "سارية": { tone: "green" },
    "مقبولة": { tone: "green" },
    "متوقف": { tone: "slate" },
    "موقوف": { tone: "slate" },
    "جزئية": { tone: "orange" },
    "قرب الانتهاء": { tone: "orange" },
    "قارب على الانتهاء": { tone: "orange" },
    "معلقة": { tone: "orange" },
    "إعادة محاولة": { tone: "orange" },
    "مرتجع جزئي": { tone: "orange" },
    "غير مسددة": { tone: "red" },
    "منتهي": { tone: "red" },
    "ملغاة": { tone: "red" },
    "مرفوضة": { tone: "red" },
  };
  return <StatusBadgeInner label={status} tone={map[status]?.tone ?? "slate"} />;
}

function StatusBadgeInner({ label, tone }: { label: string; tone: keyof typeof badgeTones }) {
  return <Badge tone={tone}>{label}</Badge>;
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "green",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: ReactNode;
  tone?: "green" | "orange" | "red" | "slate";
}) {
  const tones: Record<string, string> = {
    green: "bg-urs-green-lighter text-urs-green-dark",
    orange: "bg-urs-orange-light text-urs-orange",
    red: "bg-red-50 text-red-600",
    slate: "bg-slate-100 text-slate-600",
  };
  return (
    <Card className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-slate-500 mb-1.5">{label}</p>
        <p className="text-2xl font-extrabold text-urs-ink tabular-nums">{value}</p>
        {hint && <p className="text-xs text-slate-400 mt-1.5">{hint}</p>}
      </div>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${tones[tone]}`}>{icon}</div>
    </Card>
  );
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto -mx-5">
      <table className="w-full text-sm min-w-[720px]">
        <thead>
          <tr className="text-slate-500 text-xs border-b border-urs-border">
            {head.map((h) => (
              <th key={h} className="px-5 py-3 font-semibold text-right whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-urs-border">{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ children, className = "", dir }: { children: ReactNode; className?: string; dir?: "ltr" | "rtl" }) {
  return (
    <td className={`px-5 py-3.5 whitespace-nowrap ${className}`} dir={dir}>
      {children}
    </td>
  );
}

export function Tr({ children }: { children: ReactNode }) {
  return <tr className="hover:bg-slate-50/70 transition-colors">{children}</tr>;
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...rest
}: { children: ReactNode; variant?: "primary" | "secondary" | "ghost" | "danger" } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const variants: Record<string, string> = {
    primary: "bg-urs-green text-white hover:bg-urs-green-dark shadow-sm shadow-urs-green/20",
    secondary: "bg-urs-green-dark text-white hover:brightness-110 shadow-sm shadow-urs-green-dark/20",
    ghost: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
  };
  return (
    <button
      className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function SearchInput({ placeholder, value, onChange, icon }: { placeholder: string; value?: string; onChange?: (v: string) => void; icon: ReactNode }) {
  return (
    <div className="relative flex-1 min-w-[220px]">
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-urs-border bg-white py-2.5 pr-10 pl-3 text-sm outline-none focus:border-urs-green-light focus:ring-2 focus:ring-urs-green-light/20"
      />
    </div>
  );
}
