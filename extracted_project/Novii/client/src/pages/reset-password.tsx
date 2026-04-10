import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Lock, Loader2, ArrowLeft, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/language-context";
import { getTranslation } from "@/lib/translations";
import { cn } from "@/lib/utils";

const logo = "/assets/novii_logo_new.png";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSessionValid, setIsSessionValid] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { language, direction } = useLanguage();
  const t = getTranslation(language.code);
  const isRTL = direction === "rtl";

  // Check if we have a valid recovery session from Supabase
  useEffect(() => {
    const checkRecoverySession = async () => {
      try {
        console.log('🔍 Checking for Supabase recovery session...');
        
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('📋 Current session:', !!session);
        console.log('🔐 Session user:', session?.user?.id);
        
        if (error) {
          console.error('❌ Session check error:', error);
          throw error;
        }

        // Supabase will automatically create a recovery session when user clicks the recovery link
        // We just need to check if we're in a recovery scenario
        if (session?.user?.id) {
          console.log('✅ Valid session found - user can reset password');
          setIsSessionValid(true);
        } else {
          console.warn('⚠️ No valid session found');
          throw new Error('No recovery session found');
        }
      } catch (error) {
        console.error('❌ Recovery session check failed:', error);
        setIsCheckingSession(false);
        toast({
          variant: "destructive",
          title: language.code === 'ar' ? "❌ رابط غير صالح" : "❌ Invalid Link",
          description: language.code === 'ar' 
            ? "رابط إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية"
            : "Password reset link is invalid or expired",
        });
        setTimeout(() => setLocation("/auth"), 3000);
        return;
      }
      
      setIsCheckingSession(false);
    };

    checkRecoverySession();
  }, []);

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

  const passwordStrength = getPasswordStrength(password);

  const validateForm = (): boolean => {
    if (!password || !confirmPassword) {
      toast({
        variant: "destructive",
        title: t.auth.validation_error,
        description: language.code === 'ar' 
          ? "الرجاء ملء جميع الحقول"
          : "Please fill all fields",
      });
      return false;
    }

    if (password.length < 8) {
      toast({
        variant: "destructive",
        title: language.code === 'ar' ? "❌ كلمة مرور ضعيفة" : "❌ Weak Password",
        description: language.code === 'ar' 
          ? "يجب أن تكون كلمة المرور 8 أحرف على الأقل"
          : "Password must be at least 8 characters",
      });
      return false;
    }

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: language.code === 'ar' ? "❌ عدم تطابق" : "❌ Mismatch",
        description: language.code === 'ar' 
          ? "كلمات المرور غير متطابقة"
          : "Passwords do not match",
      });
      return false;
    }

    return true;
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      console.log('📝 Updating password via Supabase...');
      
      // Update the password using Supabase auth
      const { data, error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        console.error('❌ Password update error:', error);
        throw new Error(`Password update failed: ${error.message}`);
      }

      console.log('✅ Password updated successfully');

      toast({
        title: language.code === 'ar' ? "✅ تم بنجاح" : "✅ Success",
        description: language.code === 'ar' 
          ? "تم تعيين كلمة المرور الجديدة بنجاح"
          : "Password reset successfully",
      });

      // Sign out and redirect to auth page
      await supabase.auth.signOut();
      setTimeout(() => setLocation("/auth"), 2000);
    } catch (error: any) {
      console.error('❌ Password reset error:', error);
      
      const errorMessage = error?.message || (language.code === 'ar' 
        ? "فشل إعادة تعيين كلمة المرور. يرجى المحاولة مرة أخرى"
        : "Failed to reset password. Please try again");

      toast({
        variant: "destructive",
        title: language.code === 'ar' ? "❌ خطأ" : "❌ Error",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className={cn(
        "min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5",
        isRTL && "direction-rtl"
      )}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            {language.code === 'ar' ? "جاري التحقق..." : "Verifying..."}
          </p>
        </div>
      </div>
    );
  }

  if (!isSessionValid) {
    return null; // Will redirect
  }

  return (
    <div className={cn(
      "min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4",
      isRTL && "direction-rtl"
    )}>
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="flex flex-col items-center gap-3">
          <img src={logo} alt="Novii" className="w-12 h-12 rounded-xl shadow-lg shadow-primary/20" />
          <div>
            <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              {language.code === 'ar' ? "إعادة تعيين كلمة المرور" : "Reset Password"}
            </h1>
            <p className="text-sm text-muted-foreground text-center mt-2">
              {language.code === 'ar' 
                ? "أدخل كلمة مرور جديدة قوية"
                : "Enter a strong new password"}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleResetPassword} className="space-y-4">
          {/* Password Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {language.code === 'ar' ? "كلمة المرور الجديدة" : "New Password"}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder={language.code === 'ar' ? "كلمة المرور الجديدة" : "New password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {password && (
              <div className="space-y-1">
                <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full transition-all", passwordStrength.color)}
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {language.code === 'ar' ? "قوة: " : "Strength: "}{passwordStrength.label}
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {language.code === 'ar' ? "تأكيد كلمة المرور" : "Confirm Password"}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder={language.code === 'ar' ? "تأكيد كلمة المرور" : "Confirm password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {confirmPassword && password === confirmPassword && (
              <p className="text-xs text-green-500">
                {language.code === 'ar' ? "✓ كلمات المرور متطابقة" : "✓ Passwords match"}
              </p>
            )}
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-500">
                {language.code === 'ar' ? "✗ كلمات المرور غير متطابقة" : "✗ Passwords do not match"}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading || !password || !confirmPassword}
            className="w-full bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {language.code === 'ar' ? "جاري الإرسال..." : "Resetting..."}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                {language.code === 'ar' ? "إعادة تعيين كلمة المرور" : "Reset Password"}
              </>
            )}
          </Button>
        </form>

        {/* Back to Login */}
        <button
          onClick={() => setLocation("/auth")}
          className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {language.code === 'ar' ? "العودة إلى تسجيل الدخول" : "Back to Login"}
        </button>
      </div>
    </div>
  );
}
