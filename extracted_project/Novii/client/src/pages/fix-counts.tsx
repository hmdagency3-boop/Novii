import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export default function FixCounts() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const fixFollowCounts = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setResult({ success: false, message: 'يجب تسجيل الدخول أولاً' });
        setLoading(false);
        return;
      }

      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id');

      if (profilesError) throw profilesError;

      // Fix each profile's counts
      for (const profile of profiles || []) {
        // Count followers
        const { count: followersCount } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', profile.id);

        // Count following
        const { count: followingCount } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', profile.id);

        // Update profile
        await supabase
          .from('profiles')
          .update({
            followers_count: followersCount || 0,
            following_count: followingCount || 0
          })
          .eq('id', profile.id);
      }

      setResult({ 
        success: true, 
        message: `تم إصلاح عدادات المتابعة لـ ${profiles?.length || 0} مستخدم بنجاح!` 
      });
    } catch (error: any) {
      setResult({ 
        success: false, 
        message: `خطأ: ${error.message}` 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">إصلاح عدادات المتابعة</h1>
          <p className="text-muted-foreground text-sm">
            إذا كانت أعداد المتابعين والمتابَعين غير صحيحة، استخدم هذه الأداة لإصلاحها
          </p>
        </div>

        <Button 
          onClick={fixFollowCounts}
          disabled={loading}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              جاري الإصلاح...
            </>
          ) : (
            'إصلاح العدادات الآن'
          )}
        </Button>

        {result && (
          <div className={`flex items-start gap-3 p-4 rounded-lg ${
            result.success 
              ? 'bg-green-500/10 text-green-600' 
              : 'bg-red-500/10 text-red-600'
          }`}>
            {result.success ? (
              <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            )}
            <p className="text-sm">{result.message}</p>
          </div>
        )}

        <div className="text-center">
          <a href="/" className="text-sm text-primary hover:underline">
            العودة للرئيسية
          </a>
        </div>
      </Card>
    </div>
  );
}
