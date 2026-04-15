import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Lock, Mail, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
      <div className="w-full max-w-[350px] mx-4">
        <div className="bg-white border border-[#dbdbdb] rounded-sm p-10 mb-2.5">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 mb-4">
              <img
                src={`${import.meta.env.BASE_URL}novii_logo_transparent.png`}
                alt="Novii"
                className="w-16 h-16 object-contain"
                onError={(e) => {
                  const el = e.target as HTMLImageElement;
                  el.style.display = 'none';
                  el.parentElement!.innerHTML = '<div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737] flex items-center justify-center"><span class="text-white text-2xl font-bold">N</span></div>';
                }}
              />
            </div>
            <h1 className="text-[28px] font-light text-[#262626] tracking-tight mb-1">Novii Admin</h1>
            <p className="text-[13px] text-[#8e8e8e] font-normal">لوحة تحكم المنصة</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8e8e8e]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-[9px] bg-[#fafafa] border border-[#dbdbdb] rounded-[3px] text-[12px] text-[#262626] placeholder-[#8e8e8e] focus:outline-none focus:border-[#a8a8a8] transition-colors"
                placeholder="البريد الإلكتروني"
                required
                dir="ltr"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8e8e8e]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-[9px] bg-[#fafafa] border border-[#dbdbdb] rounded-[3px] text-[12px] text-[#262626] placeholder-[#8e8e8e] focus:outline-none focus:border-[#a8a8a8] transition-colors"
                placeholder="كلمة المرور"
                required
                dir="ltr"
              />
            </div>

            {error && (
              <div className="bg-[#ed4956]/5 border border-[#ed4956]/20 rounded-[3px] px-3 py-2.5 text-[12px] text-[#ed4956] text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full py-[7px] px-4 bg-[#0095f6] hover:bg-[#1877f2] text-white text-[14px] font-semibold rounded-lg transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2 justify-center">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  جاري الدخول...
                </span>
              ) : (
                "تسجيل الدخول"
              )}
            </button>
          </form>
        </div>

        <div className="bg-white border border-[#dbdbdb] rounded-sm p-5 text-center">
          <p className="text-[14px] text-[#262626]">
            <span className="text-[#8e8e8e]">Novii Admin Panel</span>
          </p>
        </div>

        <p className="text-center text-[#8e8e8e] text-[12px] mt-6">
          &copy; {new Date().getFullYear()} Novii. Authorized Personnel Only.
        </p>
      </div>
    </div>
  );
}
