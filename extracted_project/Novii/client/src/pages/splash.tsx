import { useEffect } from "react";
import { useRouter } from "wouter";

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (router && router[1]) {
        router[1]("/");
      }
    }, 3500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black via-purple-900 to-black flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-purple-500 to-pink-500 opacity-20 rounded-full blur-3xl animate-blob" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-cyan-500 to-purple-500 opacity-20 rounded-full blur-3xl animate-blob" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center gap-8">
        <div className="relative w-32 h-32 md:w-40 md:h-40 animate-in fade-in zoom-in duration-700">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 rounded-3xl blur-2xl opacity-75 animate-pulse" />
          <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 rounded-3xl p-1">
            <div className="bg-black rounded-2xl w-full h-full flex items-center justify-center">
              <span className="text-6xl md:text-7xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent animate-pulse">
                N
              </span>
            </div>
          </div>
        </div>

        <div className="text-center space-y-4 animate-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: "300ms" }}>
          <h1 className="text-6xl md:text-7xl font-black tracking-tighter bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
            Novii
          </h1>
          <p className="text-lg md:text-xl text-transparent bg-gradient-to-r from-purple-300 to-cyan-300 bg-clip-text font-semibold">
            Creative Platform
          </p>
        </div>

        <div className="flex items-center gap-2 mt-8 animate-in fade-in duration-700" style={{ animationDelay: "600ms" }}>
          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-bounce" />
          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-pink-500 to-cyan-500 animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>

        <div className="text-center mt-12 max-w-md px-4 animate-in fade-in duration-1000" style={{ animationDelay: "900ms" }}>
          <p className="text-sm md:text-base text-gray-400">
            Share special moments with your closest friends
          </p>
        </div>
      </div>
    </div>
  );
}
