export function LoadingState({ label = "جاري التحميل..." }: { label?: string }) {
  return <div className="text-center py-16 text-slate-400 text-sm">{label}</div>;
}

export function ErrorState({ message }: { message: string }) {
  return <div className="text-center py-16 text-red-500 text-sm">{message}</div>;
}
