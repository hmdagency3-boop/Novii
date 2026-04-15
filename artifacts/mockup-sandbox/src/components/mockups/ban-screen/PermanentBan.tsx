export function PermanentBan() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white via-white to-purple-50/40" dir="rtl">
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
          تم تعليق حسابك
        </h1>
        <p className="text-[14px] text-gray-500 text-center leading-relaxed mb-6 max-w-[300px]">
          تم تعليق حسابك بشكل دائم لمخالفة إرشادات مجتمع Novii.
        </p>

        <div className="w-full space-y-3 mb-6">
          <div className="w-full rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/50">
              <span className="text-[13px] font-semibold text-gray-900">سبب التقييد</span>
            </div>
            <div className="px-4 py-3">
              <p className="text-[14px] text-gray-700 leading-relaxed">انتهاك متكرر لإرشادات المجتمع ونشر محتوى مسيء</p>
            </div>
          </div>

          <div className="w-full rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <span className="text-[13px] font-semibold text-gray-900">المخالفات</span>
              <span className="text-[12px] font-bold text-red-500">4/5</span>
            </div>
            <div className="px-4 py-3">
              <div className="flex gap-1.5">
                <div className="flex-1 h-[5px] rounded-full bg-red-500" />
                <div className="flex-1 h-[5px] rounded-full bg-red-500" />
                <div className="flex-1 h-[5px] rounded-full bg-red-500" />
                <div className="flex-1 h-[5px] rounded-full bg-red-500" />
                <div className="flex-1 h-[5px] rounded-full bg-gray-200" />
              </div>
            </div>
          </div>
        </div>

        <div className="w-full space-y-2.5">
          <a
            href="mailto:support@novii.app"
            className="flex items-center justify-center w-full py-3 rounded-xl text-[14px] font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 transition-colors border border-purple-200"
          >
            تقديم استئناف
          </a>

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
