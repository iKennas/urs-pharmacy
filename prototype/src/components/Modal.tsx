import type { ReactNode } from "react";
import { X } from "lucide-react";

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className={`bg-white rounded-2xl shadow-xl w-full ${wide ? "max-w-2xl" : "max-w-md"} max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-urs-border sticky top-0 bg-white z-10">
          <h3 className="font-bold text-urs-ink">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block mb-4">
      <span className="text-sm font-semibold text-slate-700 mb-1.5 block">{label}</span>
      {children}
      {hint && <span className="text-xs text-slate-400 mt-1 block">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-urs-border py-2.5 px-3 text-sm outline-none focus:border-urs-green-light focus:ring-2 focus:ring-urs-green-light/20";

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return <div className="mb-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3">{message}</div>;
}
