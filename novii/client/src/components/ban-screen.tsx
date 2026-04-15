import { useAuth } from "@/lib/auth-context";
import { useState, useEffect, useRef } from "react";

const logo = "/assets/novii_logo_new.png";

interface AppealStatus {
  id: string;
  status: 'pending' | 'reviewing' | 'approved' | 'rejected';
  created_at: string;
  admin_note?: string;
  reviewed_at?: string;
}

export function BanScreen() {
  const { banInfo, signOut, session } = useAuth();
  const [view, setView] = useState<'info' | 'appeal'>('info');
  const [appealStatus, setAppealStatus] = useState<AppealStatus | null | undefined>(undefined);

  useEffect(() => {
    if (!session?.access_token) return;
    fetch('/api/auth/ban-appeal-status', {
      headers: { 'x-user-token': session.access_token },
    })
      .then(r => r.json())
      .then(d => setAppealStatus(d.appeal))
      .catch(() => setAppealStatus(null));
  }, [session?.access_token]);

  if (!banInfo) return null;

  const banUntil = banInfo.ban_until ? new Date(banInfo.ban_until) : null;
  const showDuration = banInfo.show_duration && banUntil;
  const hasActiveAppeal = appealStatus && ['pending', 'reviewing'].includes(appealStatus.status);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-auto" dir="rtl" style={{ background: "hsl(240,10%,3.9%)" }}>
      {view === 'info' ? (
        <div className="w-full max-w-[380px] mx-4 flex flex-col items-center py-10">
          <div className="mb-6">
            <img src={logo} alt="Novii" className="w-16 h-16 rounded-2xl shadow-lg object-contain p-1.5" style={{ background: "rgba(255,255,255,0.06)" }} />
          </div>

          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-5" style={{ background: "rgba(239,68,68,0.15)" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="1.5" />
              <path d="M15 9L9 15M9 9l6 6" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>

          <h1 className="text-xl font-bold mb-1.5 text-center" style={{ color: "#f5f5f5", fontFamily: "var(--font-display, 'Outfit', sans-serif)" }}>
            {banInfo.is_permanent ? "تم تعليق حسابك" : "حسابك مقيّد مؤقتاً"}
          </h1>
          <p className="text-[14px] text-center leading-relaxed mb-6 max-w-[300px]" style={{ color: "#a1a1aa" }}>
            {banInfo.is_permanent
              ? "تم تعليق حسابك بشكل دائم لمخالفة إرشادات مجتمع Novii."
              : "تم تقييد حسابك مؤقتاً بسبب مخالفة إرشادات المجتمع."}
          </p>

          <div className="w-full space-y-3 mb-6">
            {banInfo.reason && (
              <div className="w-full rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)" }}>
                <div className="px-4 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)" }}>
                  <span className="text-[13px] font-semibold" style={{ color: "#e4e4e7" }}>سبب التقييد</span>
                </div>
                <div className="px-4 py-3">
                  <p className="text-[14px] leading-relaxed" style={{ color: "#a1a1aa" }}>{banInfo.reason}</p>
                </div>
              </div>
            )}

            {showDuration && banUntil && (
              <div className="w-full rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)" }}>
                <div className="px-4 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)" }}>
                  <span className="text-[13px] font-semibold" style={{ color: "#e4e4e7" }}>ينتهي التقييد في</span>
                </div>
                <div className="px-4 py-3 text-center">
                  <p className="text-[15px] font-semibold" dir="ltr" style={{ color: "#f5f5f5" }}>
                    {banUntil.toLocaleString("ar-EG", { dateStyle: "long", timeStyle: "short" })}
                  </p>
                  <p className="text-[12px] mt-1" style={{ color: "#71717a" }}>
                    {getTimeLeft(banUntil)}
                  </p>
                </div>
              </div>
            )}

            {hasActiveAppeal && (
              <div className="w-full rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(139,92,246,0.3)", background: "rgba(139,92,246,0.08)" }}>
                <div className="px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(139,92,246,0.2)" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M12 6v6l4 2" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" />
                      <circle cx="12" cy="12" r="10" stroke="#a78bfa" strokeWidth="1.5" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold" style={{ color: "#c4b5fd" }}>طلب استئناف قيد المراجعة</p>
                    <p className="text-[12px]" style={{ color: "#8b5cf6" }}>
                      تم الإرسال {new Date(appealStatus!.created_at).toLocaleDateString("ar-EG")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {appealStatus?.status === 'rejected' && (
              <div className="w-full rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.08)" }}>
                <div className="px-4 py-3">
                  <p className="text-[13px] font-semibold mb-1" style={{ color: "#fca5a5" }}>تم رفض الاستئناف السابق</p>
                  {appealStatus.admin_note && (
                    <p className="text-[12px]" style={{ color: "#f87171" }}>{appealStatus.admin_note}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="w-full space-y-2.5">
            {!hasActiveAppeal && (
              <button
                onClick={() => setView('appeal')}
                className="flex items-center justify-center w-full py-3 rounded-xl text-[14px] font-semibold transition-colors"
                style={{ color: "#ffffff", background: "hsl(262,80%,50%)", border: "1px solid hsl(262,80%,60%)" }}
              >
                تقديم استئناف
              </button>
            )}

            <button
              onClick={signOut}
              className="w-full py-3 rounded-xl text-[14px] font-medium transition-colors"
              style={{ color: "#a1a1aa", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              تسجيل الخروج
            </button>
          </div>

          <p className="text-[11px] text-center mt-8" style={{ color: "#52525b" }}>
            Novii Community Guidelines
          </p>
        </div>
      ) : (
        <AppealForm
          token={session?.access_token || ''}
          onBack={() => setView('info')}
          onSubmitted={(appeal) => { setAppealStatus(appeal); setView('info'); }}
        />
      )}
    </div>
  );
}

function AppealForm({ token, onBack, onSubmitted }: {
  token: string;
  onBack: () => void;
  onSubmitted: (appeal: AppealStatus) => void;
}) {
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const idFrontRef = useRef<HTMLInputElement>(null);
  const idBackRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);

  const allReady = idFront && idBack && selfie;

  async function submit() {
    if (!allReady) return;
    setSubmitting(true);
    setError('');

    try {
      const form = new FormData();
      form.append('id_front', idFront);
      form.append('id_back', idBack);
      form.append('selfie', selfie);
      if (message.trim()) form.append('message', message.trim());

      const res = await fetch('/api/auth/ban-appeal', {
        method: 'POST',
        headers: { 'x-user-token': token },
        body: form,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الإرسال');

      onSubmitted({ id: '', status: 'pending', created_at: new Date().toISOString() });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-[420px] mx-4 flex flex-col py-10">
      <button
        onClick={onBack}
        className="flex items-center gap-2 mb-6 text-[14px] font-medium self-start"
        style={{ color: "#a1a1aa" }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ transform: 'scaleX(-1)' }}>
          <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        رجوع
      </button>

      <h2 className="text-lg font-bold mb-1" style={{ color: "#f5f5f5", fontFamily: "var(--font-display, 'Outfit', sans-serif)" }}>
        تقديم استئناف
      </h2>
      <p className="text-[13px] mb-6" style={{ color: "#71717a" }}>
        يرجى تقديم المستندات المطلوبة لمراجعة حسابك. جميع البيانات سرية.
      </p>

      <div className="space-y-4 mb-6">
        <UploadField
          label="صورة البطاقة — الوجه"
          hint="صورة واضحة للوجه الأمامي لبطاقة الهوية"
          file={idFront}
          inputRef={idFrontRef}
          onChange={setIdFront}
        />
        <UploadField
          label="صورة البطاقة — الظهر"
          hint="صورة واضحة للوجه الخلفي لبطاقة الهوية"
          file={idBack}
          inputRef={idBackRef}
          onChange={setIdBack}
        />
        <UploadField
          label="صورة شخصية (سيلفي)"
          hint="صورة واضحة لوجهك مع إمساك البطاقة بجانب وجهك"
          file={selfie}
          inputRef={selfieRef}
          onChange={setSelfie}
          isSelfie
        />
      </div>

      <div className="mb-5">
        <label className="block text-[13px] font-medium mb-1.5" style={{ color: "#e4e4e7" }}>
          رسالة إضافية <span style={{ color: "#71717a" }}>(اختياري)</span>
        </label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="أي توضيح تريد إضافته..."
          className="w-full rounded-xl px-4 py-3 text-[14px] resize-none placeholder:text-[#52525b] focus:outline-none focus:ring-2"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#e4e4e7",
            focusRingColor: "hsl(262,80%,50%)",
          }}
        />
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl text-[13px]" style={{ background: "rgba(239,68,68,0.1)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.2)" }}>
          {error}
        </div>
      )}

      <button
        onClick={submit}
        disabled={!allReady || submitting}
        className="w-full py-3.5 rounded-xl text-[14px] font-semibold transition-all"
        style={{
          color: "#ffffff",
          background: allReady && !submitting ? "hsl(262,80%,50%)" : "rgba(255,255,255,0.08)",
          border: `1px solid ${allReady && !submitting ? "hsl(262,80%,60%)" : "rgba(255,255,255,0.1)"}`,
          opacity: allReady && !submitting ? 1 : 0.5,
          cursor: allReady && !submitting ? 'pointer' : 'not-allowed',
        }}
      >
        {submitting ? 'جاري الإرسال...' : 'إرسال الاستئناف'}
      </button>
    </div>
  );
}

function UploadField({ label, hint, file, inputRef, onChange, isSelfie }: {
  label: string;
  hint: string;
  file: File | null;
  inputRef: React.RefObject<HTMLInputElement>;
  onChange: (f: File | null) => void;
  isSelfie?: boolean;
}) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div>
      <label className="block text-[13px] font-medium mb-1.5" style={{ color: "#e4e4e7" }}>{label}</label>
      <p className="text-[11px] mb-2" style={{ color: "#71717a" }}>{hint}</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture={isSelfie ? "user" : undefined}
        className="hidden"
        onChange={e => onChange(e.target.files?.[0] || null)}
      />
      {preview ? (
        <div className="relative rounded-xl overflow-hidden" style={{ border: "1px solid rgba(139,92,246,0.3)" }}>
          <img src={preview} alt={label} className="w-full h-[140px] object-cover" />
          <button
            onClick={() => { onChange(null); if (inputRef.current) inputRef.current.value = ''; }}
            className="absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.6)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <div className="absolute bottom-2 right-2 px-2 py-1 rounded-md text-[11px] font-medium" style={{ background: "rgba(139,92,246,0.8)", color: "white" }}>
            تم الرفع
          </div>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full h-[100px] rounded-xl flex flex-col items-center justify-center gap-2 transition-colors"
          style={{ border: "2px dashed rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.03)" }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            {isSelfie ? (
              <>
                <circle cx="12" cy="8" r="4" stroke="#71717a" strokeWidth="1.5" />
                <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="#71717a" strokeWidth="1.5" strokeLinecap="round" />
              </>
            ) : (
              <>
                <rect x="3" y="5" width="18" height="14" rx="2" stroke="#71717a" strokeWidth="1.5" />
                <path d="M3 15l4-4a2 2 0 012.8 0L15 16" stroke="#71717a" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="16" cy="9" r="1.5" fill="#71717a" />
              </>
            )}
          </svg>
          <span className="text-[12px]" style={{ color: "#71717a" }}>اضغط لاختيار صورة</span>
        </button>
      )}
    </div>
  );
}

function getTimeLeft(banUntil: Date): string {
  const diff = banUntil.getTime() - Date.now();
  if (diff <= 0) return "قريباً";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return `متبقي ${days} يوم و ${hours} ساعة`;
  if (hours > 0) return `متبقي ${hours} ساعة و ${minutes} دقيقة`;
  if (minutes > 0) return `متبقي ${minutes} دقيقة`;
  return "قريباً";
}
