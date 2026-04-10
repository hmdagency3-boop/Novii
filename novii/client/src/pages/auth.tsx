import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Mail, Lock, Loader2, Languages, ArrowRight, X, User, AtSign, Calendar, ChevronRight, ImageIcon, BookOpen, Video, MessageCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/language-context";
import { getTranslation } from "@/lib/translations";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

const logo = "/assets/novii_logo_new.png";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [gender, setGender] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { signIn, signUp } = useAuth();
  const { language, setLanguage, direction } = useLanguage();
  const t = getTranslation(language.code);
  const isRTL = direction === "rtl";

  const isBanned = new URLSearchParams(location.split('?')[1]).get('banned') === 'true';
  const banMessage = new URLSearchParams(location.split('?')[1]).get('message');

  useEffect(() => {
    if (isBanned && banMessage) {
      toast({
        variant: "destructive",
        title: language.code === 'ar' ? '🚫 تم حظرك' : '🚫 Account Banned',
        description: decodeURIComponent(banMessage),
        duration: 10000,
      });
      setLocation('/auth');
    }
  }, [isBanned, banMessage, toast, language.code, setLocation]);

  const months = language.code === 'ar'
    ? ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"]
    : ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  const getPasswordStrength = (pwd: string): { score: number; label: string; color: string } => {
    if (!pwd) return { score: 0, label: "", color: "" };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;
    if (score <= 2) return { score, label: t.auth.weak, color: "bg-red-500" };
    if (score <= 3) return { score, label: t.auth.medium, color: "bg-yellow-500" };
    if (score <= 4) return { score, label: t.auth.good, color: "bg-blue-500" };
    return { score, label: t.auth.very_strong, color: "bg-green-500" };
  };

  const passwordStrength = !isLogin ? getPasswordStrength(password) : null;

  const validateForm = (): boolean => {
    if (!email || !password) {
      toast({ variant: "destructive", title: t.auth.validation_error, description: t.auth.fill_all_fields });
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({ variant: "destructive", title: t.auth.email_error, description: t.auth.invalid_email });
      return false;
    }
    if (!isLogin) {
      if (!fullName || !username || !birthMonth || !birthDay || !birthYear || !gender) {
        toast({ variant: "destructive", title: t.auth.validation_error, description: t.auth.fill_all_fields });
        return false;
      }
      if (password.length < 8) {
        toast({ variant: "destructive", title: t.auth.weak_password, description: t.auth.password_min_length });
        return false;
      }
    }
    return true;
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPasswordEmail) {
      toast({ variant: "destructive", title: language.code === 'ar' ? "❌ خطأ" : "❌ Error", description: language.code === 'ar' ? "الرجاء إدخال بريدك الإلكتروني" : "Please enter your email" });
      return;
    }
    setIsSendingReset(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotPasswordEmail, redirectTo: `${window.location.origin}/reset-password` }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to send reset link");
      toast({ title: language.code === 'ar' ? "✅ تم إرسال الرابط" : "✅ Link Sent", description: language.code === 'ar' ? "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني" : "Password reset link has been sent to your email" });
      setShowForgotPassword(false);
      setForgotPasswordEmail("");
    } catch (error: any) {
      toast({ variant: "destructive", title: language.code === 'ar' ? "❌ خطأ" : "❌ Error", description: error.message || (language.code === 'ar' ? "فشل إرسال رابط إعادة التعيين" : "Failed to send reset link") });
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.id) await api.trackDevice(user.id);
        } catch {}
        setLocation("/");
      } else {
        await signUp(email, password);
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.id) {
            await api.createProfile(user.id, username, gender);
            await api.trackDevice(user.id);
          }
        } catch {}
        setLocation("/");
      }
    } catch (error: any) {
      if (error.message && (error.message.includes('banned') || error.message.includes('محظور'))) {
        toast({ variant: "destructive", title: language.code === 'ar' ? '🚫 حسابك محظور' : '🚫 Account Banned', description: error.message, duration: 10000 });
      } else {
        toast({ variant: "destructive", title: t.auth.error, description: error.message || t.auth.generic_error });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (toLogin: boolean) => {
    setIsLogin(toLogin);
    setPassword(""); setConfirmPassword(""); setFullName("");
    setUsername(""); setBirthMonth(""); setBirthDay(""); setBirthYear(""); setGender("");
  };

  const features = language.code === 'ar'
    ? [
        { icon: <ImageIcon className="w-4 h-4" />, text: "شارك صورك ولحظاتك" },
        { icon: <BookOpen className="w-4 h-4" />, text: "قصص يومية تختفي بعد 24 ساعة" },
        { icon: <Video className="w-4 h-4" />, text: "ريلز قصيرة ومميزة" },
        { icon: <MessageCircle className="w-4 h-4" />, text: "دردشة مباشرة مع أصدقائك" },
      ]
    : [
        { icon: <ImageIcon className="w-4 h-4" />, text: "Share photos & moments" },
        { icon: <BookOpen className="w-4 h-4" />, text: "24h daily stories" },
        { icon: <Video className="w-4 h-4" />, text: "Short creative reels" },
        { icon: <MessageCircle className="w-4 h-4" />, text: "Direct messaging" },
      ];

  return (
    <div className={cn("dark fixed inset-0 overflow-hidden bg-[#0a0a0f]")} dir={isRTL ? "rtl" : "ltr"}>

      {/* ── Animated mesh background ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-purple-600/20 blur-[120px] animate-pulse" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-pink-600/15 blur-[120px] animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-cyan-600/10 blur-[100px] animate-pulse delay-2000" />
      </div>

      {/* ── Language toggle ── */}
      <div className="absolute top-4 right-4 z-30">
        <button
          onClick={() => setLanguage(language.code === 'ar' ? 'en' : 'ar')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all text-xs font-medium backdrop-blur-sm"
        >
          <Languages className="w-3.5 h-3.5" />
          {language.code === 'ar' ? 'English' : 'العربية'}
        </button>
      </div>

      {/* ── Main layout ── */}
      <div className="relative z-10 h-full flex">

        {/* ══ LEFT PANEL — desktop branding ══ */}
        <div className="hidden lg:flex flex-col justify-between w-[45%] xl:w-[42%] h-full p-10 xl:p-14 border-r border-white/5">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl blur-lg opacity-60" />
              <img src={logo} alt="Novii" className="relative w-11 h-11 rounded-2xl object-contain" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Novii
            </span>
          </div>

          {/* Center content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-3 py-1 text-xs text-purple-300">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                {language.code === 'ar' ? 'المنصة الاجتماعية العربية' : 'Arabic Social Platform'}
              </div>
              <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
                {language.code === 'ar' ? (
                  <>شارك لحظاتك<br /><span className="bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">مع من تحب</span></>
                ) : (
                  <>Share your<br /><span className="bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">best moments</span></>
                )}
              </h1>
              <p className="text-white/50 text-base leading-relaxed max-w-xs">
                {language.code === 'ar'
                  ? 'منصة تواصل اجتماعي عربية حديثة مع دعم كامل للغة العربية والإنجليزية'
                  : 'A modern Arabic social platform with full RTL support and bilingual experience'}
              </p>
            </div>

            {/* Features */}
            <div className="space-y-3">
              {features.map((f, i) => (
                <div key={i} className="flex items-center gap-3 text-white/60 group">
                  <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-purple-400 group-hover:bg-purple-500/10 group-hover:border-purple-500/30 transition-all">
                    {f.icon}
                  </div>
                  <span className="text-sm">{f.text}</span>
                  <ChevronRight className={cn("w-3.5 h-3.5 text-white/20 mr-auto", isRTL && "rotate-180")} />
                </div>
              ))}
            </div>
          </div>

          {/* Bottom */}
          <div className="space-y-2">
            <Link href="/features">
              <span className="text-xs text-purple-400/70 hover:text-purple-300 cursor-pointer transition-colors">
                {language.code === 'ar' ? 'اكتشف كل المميزات ←' : 'Explore all features →'}
              </span>
            </Link>
            <p className="text-xs text-white/20">{t.auth.copyright}</p>
          </div>
        </div>

        {/* ══ RIGHT PANEL — auth form ══ */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 overflow-y-auto">
          <div className="w-full max-w-sm">

            {/* Mobile logo */}
            <div className="flex lg:hidden items-center justify-center gap-2 mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl blur-md opacity-60" />
                <img src={logo} alt="Novii" className="relative w-9 h-9 rounded-xl object-contain" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Novii
              </span>
            </div>

            {/* ── Tabs ── */}
            <div className="flex rounded-xl bg-white/5 border border-white/10 p-1 mb-6">
              <button
                onClick={() => switchMode(true)}
                className={cn(
                  "flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                  isLogin
                    ? "bg-gradient-to-r from-pink-500/80 via-purple-600/80 to-cyan-500/80 text-white shadow-lg"
                    : "text-white/40 hover:text-white/70"
                )}
              >
                {t.auth.login_button || (language.code === 'ar' ? 'تسجيل الدخول' : 'Sign In')}
              </button>
              <button
                onClick={() => switchMode(false)}
                className={cn(
                  "flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                  !isLogin
                    ? "bg-gradient-to-r from-pink-500/80 via-purple-600/80 to-cyan-500/80 text-white shadow-lg"
                    : "text-white/40 hover:text-white/70"
                )}
              >
                {t.auth.signup_button || (language.code === 'ar' ? 'إنشاء حساب' : 'Sign Up')}
              </button>
            </div>

            {/* ── Heading ── */}
            <div className="mb-5">
              <h2 className="text-2xl font-bold text-white">
                {isLogin
                  ? (language.code === 'ar' ? 'أهلاً بعودتك 👋' : 'Welcome back 👋')
                  : (language.code === 'ar' ? 'انضم إلينا 🎉' : 'Join us today 🎉')}
              </h2>
              <p className="text-white/40 text-sm mt-1">
                {isLogin ? t.auth.login_subtitle : t.auth.signup_subtitle}
              </p>
            </div>

            {/* ── Form ── */}
            <form onSubmit={handleSubmit} className="space-y-3">

              {/* Email */}
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" style={isRTL ? {} : { right: 'auto', left: '0.75rem' }} />
                <Input
                  type="email"
                  placeholder={t.auth.mobile_or_email || "example@email.com"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  dir="ltr"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25 h-11 focus:border-purple-500/60 focus:bg-white/8 transition-all rounded-xl text-sm pr-10"
                />
              </div>

              {/* Signup extra fields */}
              {!isLogin && (
                <>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" style={isRTL ? {} : { right: 'auto', left: '0.75rem' }} />
                    <Input
                      type="text"
                      placeholder={t.auth.full_name}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/25 h-11 focus:border-purple-500/60 transition-all rounded-xl text-sm pr-10"
                    />
                  </div>

                  <div className="relative">
                    <AtSign className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" style={isRTL ? {} : { right: 'auto', left: '0.75rem' }} />
                    <Input
                      type="text"
                      placeholder={t.auth.username}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      dir="ltr"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/25 h-11 focus:border-purple-500/60 transition-all rounded-xl text-sm pr-10"
                    />
                  </div>
                </>
              )}

              {/* Password */}
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" style={isRTL ? {} : { right: 'auto', left: '0.75rem' }} />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder={isLogin ? "••••••••" : t.auth.password}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  dir="ltr"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25 h-11 focus:border-purple-500/60 transition-all rounded-xl text-sm pr-10 pl-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                  style={isRTL ? {} : { left: 'auto', right: '0.75rem' }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength */}
              {!isLogin && password && passwordStrength && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map((i) => (
                      <div key={i} className={cn("h-1 flex-1 rounded-full transition-all", i <= passwordStrength.score ? passwordStrength.color : "bg-white/10")} />
                    ))}
                  </div>
                  <p className="text-xs text-white/40">{passwordStrength.label}</p>
                </div>
              )}

              {/* Signup: Gender + DOB */}
              {!isLogin && (
                <>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white h-11 rounded-xl text-sm hover:border-purple-500/40 transition-colors">
                      <SelectValue placeholder={language.code === 'ar' ? 'اختر الجنس' : 'Select gender'} />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a2e] border-white/10">
                      <SelectItem value="male" className="text-white">{language.code === 'ar' ? 'ذكر' : 'Male'}</SelectItem>
                      <SelectItem value="female" className="text-white">{language.code === 'ar' ? 'أنثى' : 'Female'}</SelectItem>
                      <SelectItem value="other" className="text-white">{language.code === 'ar' ? 'آخر' : 'Other'}</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="space-y-1.5">
                    <label className="text-xs text-white/40 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {t.auth.date_of_birth}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: birthMonth, onChange: setBirthMonth, placeholder: t.auth.month, items: months.map((m, i) => ({ v: String(i+1), l: m })) },
                        { value: birthDay, onChange: setBirthDay, placeholder: t.auth.day, items: days.map(d => ({ v: String(d), l: String(d) })) },
                        { value: birthYear, onChange: setBirthYear, placeholder: t.auth.year, items: years.map(y => ({ v: String(y), l: String(y) })) },
                      ].map((sel, i) => (
                        <Select key={i} value={sel.value} onValueChange={sel.onChange}>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white h-10 rounded-xl text-xs hover:border-purple-500/40 transition-colors">
                            <SelectValue placeholder={sel.placeholder} />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1a1a2e] border-white/10 max-h-52">
                            {sel.items.map(it => (
                              <SelectItem key={it.v} value={it.v} className="text-white text-xs">{it.l}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-white/30 leading-relaxed">{t.auth.dob_info2}</p>
                </>
              )}

              {/* Login: Remember me + forgot password */}
              {isLogin && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 accent-purple-500"
                    />
                    <span className="text-xs text-white/40">{t.auth.remember_me}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    {t.auth.forgot_password}
                  </button>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-xl font-semibold text-white text-sm bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 mt-1 disabled:opacity-60"
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />{t.auth.loading}</>
                ) : (
                  <>{isLogin ? t.auth.login_button : t.auth.signup_button}<ArrowRight className={cn("w-4 h-4", isRTL && "rotate-180")} /></>
                )}
              </button>
            </form>

            {/* ── Switch mode (mobile) ── */}
            <p className="mt-5 text-center text-sm text-white/40">
              {isLogin ? t.auth.no_account : t.auth.have_account}{" "}
              <button onClick={() => switchMode(!isLogin)} className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
                {isLogin ? t.auth.create_new_account : t.auth.login_link}
              </button>
            </p>

            {/* Mobile footer */}
            <div className="mt-4 text-center space-y-1 lg:hidden">
              <Link href="/features">
                <span className="text-xs text-purple-400/60 hover:text-purple-300 cursor-pointer transition-colors">
                  {language.code === 'ar' ? 'اكتشف مميزات Novii ←' : 'Explore Novii features →'}
                </span>
              </Link>
              <p className="text-xs text-white/20">{t.auth.copyright}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Forgot Password Modal ── */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12121e] border border-white/10 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {language.code === 'ar' ? "إعادة تعيين كلمة المرور" : "Reset Password"}
              </h2>
              <button onClick={() => { setShowForgotPassword(false); setForgotPasswordEmail(""); }} className="text-white/40 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-white/40">
              {language.code === 'ar' ? "أدخل بريدك الإلكتروني وسنرسل إليك رابط إعادة تعيين كلمة المرور" : "Enter your email and we'll send you a password reset link"}
            </p>
            <form onSubmit={handleForgotPassword} className="space-y-3">
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                <Input
                  type="email"
                  placeholder="example@email.com"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25 pr-10 h-10 rounded-xl text-sm focus:border-purple-500/60"
                  dir="ltr"
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => { setShowForgotPassword(false); setForgotPasswordEmail(""); }} className="flex-1 border-white/10 text-white/60 hover:text-white bg-transparent">
                  {language.code === 'ar' ? "إلغاء" : "Cancel"}
                </Button>
                <button
                  type="submit"
                  disabled={isSendingReset || !forgotPasswordEmail}
                  className="flex-1 h-10 rounded-lg font-medium text-white text-sm bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSendingReset ? <><Loader2 className="w-4 h-4 animate-spin" />{language.code === 'ar' ? "جاري..." : "Sending..."}</> : (language.code === 'ar' ? "إرسال الرابط" : "Send Link")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
