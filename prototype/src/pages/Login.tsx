import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowLeft } from "lucide-react";
import { LogoCompact, LogoCompactOnDark } from "../assets/logo";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../api";
import { Modal, Field, inputClass, FormError } from "../components/Modal";
import { Button } from "../components/ui";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("a.harbi@urs-pharma.sa");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotLoading, setForgotLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const kind = await login(email, password);
      navigate(kind === "admin" ? "/subscriptions" : "/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setForgotError(null);
    setForgotMsg(null);
    setForgotLoading(true);
    try {
      const res = await authApi.forgotPassword(forgotEmail);
      setForgotMsg(res.message);
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : "فشل إرسال الطلب");
    } finally {
      setForgotLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2" dir="rtl">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-[#284e22] to-[#152a11] text-white relative overflow-hidden">
        <div className="absolute -left-24 -top-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -right-16 bottom-0 w-72 h-72 rounded-full bg-urs-green-light/10" />
        <div className="relative z-10"><LogoCompactOnDark height={64} /></div>
        <div className="relative z-10 max-w-md">
          <h1 className="text-3xl font-extrabold leading-tight mb-4">منصة واحدة لإدارة كل عمليات صيدليتك</h1>
          <p className="text-white/70 leading-relaxed">
            المبيعات، المخزون، الدفعات، المشتريات، العملاء، والربط مع الجهات الحكومية — كل ذلك من لوحة تحكم سحابية واحدة
          </p>
        </div>
        <p className="text-xs text-white/40 relative z-10">© 2026 URS Pharmacy Solutions. جميع الحقوق محفوظة.</p>
      </div>

      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex justify-center mb-8"><LogoCompact height={64} /></div>
          <h2 className="text-2xl font-extrabold text-urs-ink mb-1">تسجيل الدخول</h2>
          <p className="text-sm text-slate-500 mb-8">أدخل بيانات حسابك للوصول إلى لوحة تحكم صيدليتك</p>

          {error && <div className="mb-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3">{error}</div>}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">البريد الإلكتروني</label>
              <div className="relative">
                <Mail size={17} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded-xl border border-urs-border py-3 pr-11 pl-3 text-sm outline-none focus:border-urs-green-light focus:ring-2 focus:ring-urs-green-light/20" />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-slate-700">كلمة المرور</label>
                <button type="button" onClick={() => { setForgotEmail(email); setShowForgot(true); }} className="text-xs font-bold text-urs-green hover:underline">
                  نسيت كلمة المرور؟
                </button>
              </div>
              <div className="relative">
                <Lock size={17} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full rounded-xl border border-urs-border py-3 pr-11 pl-3 text-sm outline-none focus:border-urs-green-light focus:ring-2 focus:ring-urs-green-light/20" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-urs-green text-white rounded-xl py-3 font-bold hover:bg-urs-green-dark transition-colors shadow-sm shadow-urs-green/25 flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? "جاري الدخول..." : "تسجيل الدخول"}
              <ArrowLeft size={17} />
            </button>
          </form>

          <p className="text-xs text-slate-400 text-center mt-8">
            الدخول متاح عبر البريد الإلكتروني وكلمة المرور فقط. مشرف المنصة: admin@urs-platform.sa
          </p>
        </div>
      </div>

      <Modal open={showForgot} onClose={() => { setShowForgot(false); setForgotMsg(null); setForgotError(null); }} title="استعادة كلمة المرور">
        <form onSubmit={handleForgot}>
          <FormError message={forgotError} />
          {forgotMsg && <div className="mb-4 rounded-xl bg-urs-green-lighter text-urs-green-dark text-sm px-4 py-3">{forgotMsg}</div>}
          <Field label="البريد الإلكتروني" hint="سيتم إرسال رابط إعادة التعيين إذا كان الحساب موجودًا">
            <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required className={inputClass} dir="ltr" />
          </Field>
          <Button type="submit" disabled={forgotLoading}>{forgotLoading ? "جاري الإرسال..." : "إرسال رابط الاستعادة"}</Button>
        </form>
      </Modal>
    </div>
  );
}
