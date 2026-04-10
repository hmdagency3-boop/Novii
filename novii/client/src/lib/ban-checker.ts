import { supabase } from './supabase';

export interface BanStatus {
  isBanned: boolean;
  reason?: string;
  bannedUntil?: Date;
  isPermanent: boolean;
  message?: string;
}

export async function checkUserBanStatus(userId: string): Promise<BanStatus> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('is_banned, banned_reason, ban_until')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return { isBanned: false, isPermanent: false };
    }

    if (!profile.is_banned) {
      return { isBanned: false, isPermanent: false };
    }

    const banUntil = profile.ban_until ? new Date(profile.ban_until) : null;
    const now = new Date();

    // Check if ban has expired
    if (banUntil && now > banUntil) {
      // Unban automatically
      await supabase
        .from('profiles')
        .update({
          is_banned: false,
          banned_reason: null,
          ban_until: null,
        })
        .eq('id', userId);

      return { isBanned: false, isPermanent: false };
    }

    // Still banned
    const isPermanent = !banUntil;
    let message = `حسابك تم حظره${isPermanent ? ' بشكل دائم' : ''}`;

    if (profile.banned_reason) {
      message += `\nالسبب: ${profile.banned_reason}`;
    }

    if (banUntil) {
      const timeLeft = calculateTimeLeft(now, banUntil);
      message += `\nسينتهي الحظر في: ${timeLeft}`;
    }

    return {
      isBanned: true,
      reason: profile.banned_reason,
      bannedUntil: banUntil || undefined,
      isPermanent,
      message,
    };
  } catch (error) {
    console.error('Error checking ban status:', error);
    return { isBanned: false, isPermanent: false };
  }
}

function calculateTimeLeft(now: Date, banUntil: Date): string {
  const diff = banUntil.getTime() - now.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} يوم و ${hours % 24} ساعة`;
  } else if (hours > 0) {
    return `${hours} ساعة و ${minutes % 60} دقيقة`;
  } else if (minutes > 0) {
    return `${minutes} دقيقة`;
  } else {
    return 'قريب جداً';
  }
}
