export function TempBan() {
  const logo = "https://placehold.co/64x64/1a1a2e/a855f7?text=N";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white via-white to-purple-50/40 overflow-hidden" dir="rtl" style={{ isolation: "isolate" }}>
      <div className="w-full max-w-[380px] mx-4 flex flex-col items-center">
        <div className="mb-6">
          <div className="w-16 h-16 rounded-2xl shadow-lg bg-gradient-to-br from-purple-600 to-violet-500 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">N</span>
          </div>
        </div>

        <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-5">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="1.5" />
            <path d="M15 9L9 15M9 9l6 6" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-1.5 text-center">
          حسابك مقيّد مؤقتاً
        </h1>
        <p className="text-[14px] text-gray-500 text-center leading-relaxed mb-6 max-w-[300px]">
          تم تقييد حسابك مؤقتاً بسبب مخالفة إرشادات المجتمع.
        </p>

        <div className="w-full space-y-3 mb-6">
          <div className="w-full rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/50">
              <span className="text-[13px] font-semibold text-gray-900">سبب التقييد</span>
            </div>
            <div className="px-4 py-3">
              <p className="text-[14px] text-gray-700 leading-relaxed">نشر محتوى مخالف لسياسة المجتمع وإرشادات الاستخدام</p>
            </div>
          </div>

        </div>

        <div className="w-full space-y-2.5">
          <button className="w-full py-3 rounded-xl text-[14px] font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors border border-gray-200">
            تسجيل الخروج
          </button>
        </div>

        <p className="text-[11px] text-gray-300 text-center mt-8">
          Novii Community Guidelines
        </p>
      </div>
    </div>
  );
}
