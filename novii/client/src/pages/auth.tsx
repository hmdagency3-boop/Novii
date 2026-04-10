import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Mail, Lock, Loader2, Languages, Sparkles, ArrowRight, Heart, X } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/language-context";
import { getTranslation } from "@/lib/translations";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

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
  
  // Check for ban message in URL
  const isBanned = new URLSearchParams(location.split('?')[1]).get('banned') === 'true';
  const banMessage = new URLSearchParams(location.split('?')[1]).get('message');
  
  // Show ban notification if banned
  useEffect(() => {
    if (isBanned && banMessage) {
      toast({
        variant: "destructive",
        title: language.code === 'ar' ? '🚫 تم حظرك' : '🚫 Account Banned',
        description: decodeURIComponent(banMessage),
        duration: 10000,
      });
      // Clear URL params
      setLocation('/auth');
    }
  }, [isBanned, banMessage, toast, language.code, setLocation]);

  const months = language.code === 'ar' 
    ? ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"]
    : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
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
      toast({
        variant: "destructive",
        title: t.auth.validation_error,
        description: t.auth.fill_all_fields,
      });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        variant: "destructive",
        title: t.auth.email_error,
        description: t.auth.invalid_email,
      });
      return false;
    }

    if (!isLogin) {
      if (!fullName || !username || !birthMonth || !birthDay || !birthYear || !gender) {
        toast({
          variant: "destructive",
          title: t.auth.validation_error,
          description: t.auth.fill_all_fields,
        });
        return false;
      }

      if (password.length < 8) {
        toast({
          variant: "destructive",
          title: t.auth.weak_password,
          description: t.auth.password_min_length,
        });
        return false;
      }
    }

    return true;
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!forgotPasswordEmail) {
      toast({
        variant: "destructive",
        title: language.code === 'ar' ? "❌ خطأ" : "❌ Error",
        description: language.code === 'ar' ? "الرجاء إدخال بريدك الإلكتروني" : "Please enter your email",
      });
      return;
    }

    setIsSendingReset(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotPasswordEmail,
          redirectTo: `${window.location.origin}/reset-password`,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to send reset link");

      toast({
        title: language.code === 'ar' ? "✅ تم إرسال الرابط" : "✅ Link Sent",
        description: language.code === 'ar' 
          ? "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني"
          : "Password reset link has been sent to your email",
      });

      setShowForgotPassword(false);
      setForgotPasswordEmail("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: language.code === 'ar' ? "❌ خطأ" : "❌ Error",
        description: error.message || (language.code === 'ar' 
          ? "فشل إرسال رابط إعادة التعيين"
          : "Failed to send reset link"),
      });
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
        
        // Track device on login
        try {
          const { data: { user } } = await supabase.auth.getUser();
          console.log('🔐 Login successful, user ID:', user?.id);
          if (user?.id) {
            console.log('📱 Tracking device for user:', user.id);
            const result = await api.trackDevice(user.id);
            console.log('✅ Device tracked successfully:', result);
          }
        } catch (deviceError) {
          console.error('❌ Device tracking failed:', deviceError);
          // Don't block login if device tracking fails
        }
        
        // Redirect to home page
        setLocation("/");
      } else {
        await signUp(email, password);
        
        // Create profile with gender
        try {
          const { data: { user } } = await supabase.auth.getUser();
          console.log('🔐 Signup successful, user ID:', user?.id);
          if (user?.id) {
            console.log('📱 Creating profile with gender:', gender);
            await api.createProfile(user.id, username, gender);
            console.log('✅ Profile created with gender:', gender);
          }
        } catch (profileError) {
          console.error('❌ Profile creation failed:', profileError);
          // Don't block signup if profile creation fails
        }

        // Track device on signup
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.id) {
            console.log('📱 Tracking device for user:', user.id);
            const result = await api.trackDevice(user.id);
            console.log('✅ Device tracked successfully:', result);
          }
        } catch (deviceError) {
          console.error('❌ Device tracking failed:', deviceError);
          // Don't block signup if device tracking fails
        }
        
        // Redirect to home page
        setLocation("/");
      }
    } catch (error: any) {
      // Check if this is a ban-related error
      if (error.message && (error.message.includes('banned') || error.message.includes('محظور'))) {
        toast({
          variant: "destructive",
          title: language.code === 'ar' ? '🚫 حسابك محظور' : '🚫 Account Banned',
          description: error.message,
          duration: 10000,
        });
      } else {
        toast({
          variant: "destructive",
          title: t.auth.error,
          description: error.message || t.auth.generic_error,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn(
      "min-h-screen bg-gradient-to-br from-background via-background to-background flex items-center justify-center p-4 pt-8 sm:pt-4 relative overflow-hidden",
      "dark"
    )} dir={isRTL ? "rtl" : "ltr"}>
      {/* Animated background gradients */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient orbs with animations */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-pink-500/40 via-purple-500/30 to-transparent rounded-full blur-3xl opacity-60 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-cyan-500/30 via-purple-500/20 to-transparent rounded-full blur-3xl opacity-50 animate-pulse delay-1000"></div>
        <div className="absolute top-1/3 right-1/3 w-80 h-80 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl opacity-40 animate-blob"></div>
        <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-gradient-to-tr from-cyan-500/15 to-purple-500/15 rounded-full blur-3xl opacity-30 animate-blob delay-2000"></div>
      </div>

      {/* Language Toggle */}
      <div className="absolute top-6 right-6 z-20">
        <Button
          onClick={() => setLanguage(language.code === 'ar' ? 'en' : 'ar')}
          variant="outline"
          className="bg-card/50 backdrop-blur-md border-border hover:bg-card/80 hover:border-primary/50 transition-all duration-300 gap-2"
        >
          <Languages className="w-4 h-4" />
          <span className="hidden sm:inline font-medium text-sm">{language.code === 'ar' ? 'English' : 'العربية'}</span>
        </Button>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-7xl flex gap-12 items-center relative z-10">
        {/* Left side - Marketing content (Desktop only) */}
        <div className="hidden lg:flex flex-1 flex-col items-center justify-center space-y-12">
          <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
            <div className="space-y-4">
              <div className="flex items-center gap-4 group cursor-pointer">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary via-purple-500 to-pink-500 rounded-3xl blur-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <img src={logo} alt="Novii" className="relative w-24 h-24 rounded-3xl shadow-2xl object-cover" />
                </div>
                <div>
                  <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Novii
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">Creative Platform</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-4xl font-light leading-relaxed text-foreground">
                {t.auth.tagline}{" "}
                <span className="text-transparent bg-gradient-to-r from-primary to-pink-500 bg-clip-text font-semibold">
                  {t.auth.friends_nearby}
                </span>
              </h2>
              
              <div className="flex items-center gap-3 text-muted-foreground">
                <Heart className="w-5 h-5 text-primary" />
                <span className="text-sm">{t.auth.platform_tagline}</span>
              </div>
            </div>
          </div>

          {/* Floating elements */}
          <div className="relative w-80 h-80 animate-in zoom-in duration-700 delay-300">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-pink-500/20 rounded-full blur-2xl"></div>
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=400&fit=crop"
              alt="Friends"
              className="relative w-full h-full rounded-full object-cover shadow-2xl border-2 border-primary/30"
            />
          </div>
        </div>

        {/* Right side - Auth Form */}
        <div className="flex-1 max-w-md w-full flex flex-col max-h-[100dvh] py-4 animate-in fade-in slide-in-from-right-8 duration-700 delay-100">
          {/* Form Card */}
          <div className="relative group flex-1 min-h-0 flex flex-col">
            {/* Glowing border effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-purple-500 to-pink-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
            
            {/* Main form container */}
            <div className="relative bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-5 sm:p-8 space-y-4 sm:space-y-6 shadow-2xl overflow-y-auto flex-1 min-h-0">
              {/* Header */}
              <div className="text-center space-y-2 sm:space-y-4">
                <div className="flex justify-center mb-2 animate-in zoom-in duration-500">
                  <div className="relative group">
                    <div className="absolute -inset-3 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-full blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-300 animate-pulse"></div>
                    <img src={logo} alt="Novii" className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-3xl shadow-2xl object-contain bg-black/20 p-2" />
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent animate-in fade-in slide-in-from-top-4 duration-700 delay-100">
                    Novii
                  </h1>
                  <div className="h-1 w-16 bg-gradient-to-r from-pink-500 to-cyan-500 rounded-full animate-in fade-in duration-700 delay-200"></div>
                </div>
                <p className="text-sm text-muted-foreground animate-in fade-in duration-700 delay-300">
                  {isLogin ? t.auth.login_subtitle : t.auth.signup_subtitle}
                </p>
              </div>

              {/* Form Content */}
              {!isLogin ? (
                <>
                  <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-3.5 overflow-visible">
                    <Input
                      type="email"
                      placeholder={t.auth.mobile_or_email}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-background/50 border-border/80 text-foreground placeholder:text-muted-foreground h-9 sm:h-11 focus:border-primary focus:ring-primary/20 transition-all duration-200 text-sm"
                      dir="ltr"
                    />

                    <Input
                      type="text"
                      placeholder={t.auth.full_name}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="bg-background/50 border-border/80 text-foreground placeholder:text-muted-foreground h-9 sm:h-11 focus:border-primary focus:ring-primary/20 transition-all duration-200 text-sm"
                    />

                    <Input
                      type="text"
                      placeholder={t.auth.username}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="bg-background/50 border-border/80 text-foreground placeholder:text-muted-foreground h-9 sm:h-11 focus:border-primary focus:ring-primary/20 transition-all duration-200 text-sm"
                      dir="ltr"
                    />

                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder={t.auth.password}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-background/50 border-border/80 text-foreground placeholder:text-muted-foreground h-9 sm:h-11 focus:border-primary focus:ring-primary/20 transition-all duration-200 text-sm"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">{language.code === 'ar' ? 'الجنس' : 'Gender'}</label>
                      <Select value={gender} onValueChange={setGender}>
                        <SelectTrigger className="bg-background/50 border-border/80 text-foreground h-9 sm:h-11 text-sm hover:border-primary/50 transition-colors">
                          <SelectValue placeholder={language.code === 'ar' ? 'اختر الجنس' : 'Select gender'} />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border" side="bottom" align="start" sideOffset={8}>
                          <SelectItem value="male" className="text-foreground hover:bg-primary/10">
                            {language.code === 'ar' ? 'ذكر' : 'Male'}
                          </SelectItem>
                          <SelectItem value="female" className="text-foreground hover:bg-primary/10">
                            {language.code === 'ar' ? 'أنثى' : 'Female'}
                          </SelectItem>
                          <SelectItem value="other" className="text-foreground hover:bg-primary/10">
                            {language.code === 'ar' ? 'آخر' : 'Other'}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">{t.auth.date_of_birth}</label>
                      <div className="grid grid-cols-3 gap-2">
                        <Select value={birthMonth} onValueChange={setBirthMonth}>
                          <SelectTrigger className="bg-background/50 border-border/80 text-foreground h-10 text-xs hover:border-primary/50 transition-colors">
                            <SelectValue placeholder={t.auth.month} />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border" side="bottom" align="start" sideOffset={4}>
                            {months.map((month, index) => (
                              <SelectItem key={index} value={String(index + 1)} className="text-foreground hover:bg-primary/10">
                                {month}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select value={birthDay} onValueChange={setBirthDay}>
                          <SelectTrigger className="bg-background/50 border-border/80 text-foreground h-10 text-xs hover:border-primary/50 transition-colors">
                            <SelectValue placeholder={t.auth.day} />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border max-h-60" side="bottom" align="start" sideOffset={4}>
                            {days.map((day) => (
                              <SelectItem key={day} value={String(day)} className="text-foreground hover:bg-primary/10">
                                {day}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select value={birthYear} onValueChange={setBirthYear}>
                          <SelectTrigger className="bg-background/50 border-border/80 text-foreground h-10 text-xs hover:border-primary/50 transition-colors">
                            <SelectValue placeholder={t.auth.year} />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border max-h-60" side="bottom" align="start" sideOffset={4}>
                            {years.map((year) => (
                              <SelectItem key={year} value={String(year)} className="text-foreground hover:bg-primary/10">
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {t.auth.dob_info2}
                    </p>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white h-10 sm:h-11 font-semibold shadow-lg shadow-primary/25 transition-all duration-300"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {t.auth.loading}
                        </>
                      ) : (
                        <>
                          {t.auth.signup_button}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </form>
                </>
              ) : (
                <>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2.5">
                      <label className="text-sm font-medium text-foreground">{t.auth.email}</label>
                      <div className="relative">
                        <Mail className="absolute right-3 top-3.5 w-5 h-5 text-muted-foreground pointer-events-none" />
                        <Input
                          type="email"
                          placeholder="example@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="bg-background/50 border-border/80 text-foreground placeholder:text-muted-foreground pr-10 h-11 focus:border-primary focus:ring-primary/20 transition-all duration-200"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <label className="text-sm font-medium text-foreground">{t.auth.password}</label>
                      <div className="relative">
                        <Lock className="absolute right-3 top-3.5 w-5 h-5 text-muted-foreground pointer-events-none" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="bg-background/50 border-border/80 text-foreground placeholder:text-muted-foreground pr-10 pl-10 h-11 focus:border-primary focus:ring-primary/20 transition-all duration-200"
                          dir="ltr"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute left-3 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <label className="flex items-center gap-2.5 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 rounded border-border bg-background text-primary focus:ring-primary/20 transition-all"
                        />
                        <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{t.auth.remember_me}</span>
                      </label>
                      <button 
                        type="button" 
                        onClick={() => setShowForgotPassword(true)}
                        className="text-sm text-primary hover:text-primary/80 font-medium transition-colors">
                        {t.auth.forgot_password}
                      </button>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white h-11 font-semibold shadow-lg shadow-primary/25 transition-all duration-300 mt-6"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {t.auth.loading}
                        </>
                      ) : (
                        <>
                          {t.auth.login_button}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </form>
                </>
              )}
            </div>
          </div>

          {/* Toggle Form */}
          <div className="mt-3 sm:mt-6 bg-card/50 backdrop-blur-md border border-border/50 rounded-xl p-3 sm:p-4 text-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            <p className="text-sm text-muted-foreground">
              {isLogin ? t.auth.no_account : t.auth.have_account}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setPassword("");
                  setConfirmPassword("");
                  setFullName("");
                  setUsername("");
                  setBirthMonth("");
                  setBirthDay("");
                  setBirthYear("");
                  setGender("");
                }}
                className="text-primary hover:text-primary/80 font-semibold ml-2 transition-colors"
              >
                {isLogin ? t.auth.create_new_account : t.auth.login_link}
              </button>
            </p>
          </div>

          {/* Footer */}
          <div className="mt-3 sm:mt-8 text-center pb-4 space-y-1">
            <Link href="/features">
              <span className="text-xs text-primary/70 hover:text-primary cursor-pointer transition-colors">
                {isRTL ? "اكتشف مميزات Novii ←" : "Discover Novii Features →"}
              </span>
            </Link>
            <p className="text-xs text-muted-foreground">
              {t.auth.copyright}
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                {language.code === 'ar' ? "إعادة تعيين كلمة المرور" : "Reset Password"}
              </h2>
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotPasswordEmail("");
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground">
              {language.code === 'ar'
                ? "أدخل بريدك الإلكتروني وسنرسل إليك رابط إعادة تعيين كلمة المرور"
                : "Enter your email and we'll send you a password reset link"}
            </p>

            {/* Form */}
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {language.code === 'ar' ? "البريد الإلكتروني" : "Email"}
                </label>
                <div className="relative">
                  <Mail className="absolute right-3 top-3.5 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="example@email.com"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    className="bg-background/50 border-border/80 text-foreground placeholder:text-muted-foreground pr-10 h-10 focus:border-primary focus:ring-primary/20 transition-all duration-200 text-sm"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotPasswordEmail("");
                  }}
                  className="flex-1"
                >
                  {language.code === 'ar' ? "إلغاء" : "Cancel"}
                </Button>
                <Button
                  type="submit"
                  disabled={isSendingReset || !forgotPasswordEmail}
                  className="flex-1 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90"
                >
                  {isSendingReset ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {language.code === 'ar' ? "جاري الإرسال..." : "Sending..."}
                    </>
                  ) : (
                    language.code === 'ar' ? "إرسال الرابط" : "Send Link"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
