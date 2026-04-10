import Layout from "@/components/layout";
import { GoldMemberBadge } from "@/components/ui/gold-member-badge";
import { SilverMemberBadge } from "@/components/ui/silver-member-badge";
import { BronzeMemberBadge } from "@/components/ui/bronze-member-badge";
import { BetaTesterBadge } from "@/components/ui/beta-tester-badge";

export default function BadgesDemo() {
  return (
    <Layout>
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 gap-12">
        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-display font-bold">
            Novii Member Badges
          </h1>
          <p className="text-lg text-muted-foreground">
            Celebrate your achievements and contributions
          </p>
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-2xl w-full">
          {/* Gold Member */}
          <div className="flex flex-col items-center gap-4 p-8 rounded-lg border border-yellow-400/20 bg-yellow-400/5 hover:bg-yellow-400/10 transition-colors">
            <div className="flex gap-3 flex-wrap justify-center">
              <GoldMemberBadge size="sm" />
              <GoldMemberBadge size="md" />
              <GoldMemberBadge />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-xl font-bold text-yellow-400">Gold Early Member</h3>
              <p className="text-sm text-muted-foreground">
                🏆 Founding member of Novii platform
              </p>
            </div>
          </div>

          {/* Silver Member */}
          <div className="flex flex-col items-center gap-4 p-8 rounded-lg border border-slate-300/20 bg-slate-300/5 hover:bg-slate-300/10 transition-colors">
            <div className="flex gap-3 flex-wrap justify-center">
              <SilverMemberBadge size="sm" />
              <SilverMemberBadge size="md" />
              <SilverMemberBadge />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-xl font-bold text-slate-300">Silver Early Member</h3>
              <p className="text-sm text-muted-foreground">
                🏆 Early supporter of the community
              </p>
            </div>
          </div>

          {/* Bronze Member */}
          <div className="flex flex-col items-center gap-4 p-8 rounded-lg border border-orange-600/20 bg-orange-600/5 hover:bg-orange-600/10 transition-colors">
            <div className="flex gap-3 flex-wrap justify-center">
              <BronzeMemberBadge size="sm" />
              <BronzeMemberBadge size="md" />
              <BronzeMemberBadge />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-xl font-bold text-orange-600">Bronze Early Member</h3>
              <p className="text-sm text-muted-foreground">
                🏆 Trusted community contributor
              </p>
            </div>
          </div>

          {/* Beta Tester */}
          <div className="flex flex-col items-center gap-4 p-8 rounded-lg border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 transition-colors">
            <div className="flex gap-3 flex-wrap justify-center">
              <BetaTesterBadge size="sm" />
              <BetaTesterBadge size="md" />
              <BetaTesterBadge />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-xl font-bold text-purple-400">Beta Tester</h3>
              <p className="text-sm text-muted-foreground">
                ✨ Shaping the future of Novii
              </p>
            </div>
          </div>
        </div>

        {/* Features Showcase */}
        <div className="max-w-3xl w-full space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">✨ Premium Features</h2>
            <p className="text-muted-foreground">Beautiful gradients, smooth animations & professional design</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-background border border-primary/20 space-y-2">
              <h4 className="font-semibold">🎨 Gradient Effects</h4>
              <p className="text-sm text-muted-foreground">
                Each badge features stunning gradient backgrounds and metallic effects
              </p>
            </div>
            <div className="p-4 rounded-lg bg-background border border-primary/20 space-y-2">
              <h4 className="font-semibold">✨ Smooth Animations</h4>
              <p className="text-sm text-muted-foreground">
                Elegant glow effects and scale animations that catch the eye
              </p>
            </div>
            <div className="p-4 rounded-lg bg-background border border-primary/20 space-y-2">
              <h4 className="font-semibold">🌈 Rich Colors</h4>
              <p className="text-sm text-muted-foreground">
                Professional color schemes that represent each membership tier
              </p>
            </div>
            <div className="p-4 rounded-lg bg-background border border-primary/20 space-y-2">
              <h4 className="font-semibold">📱 Responsive Design</h4>
              <p className="text-sm text-muted-foreground">
                Perfect on all devices - from mobile to desktop screens
              </p>
            </div>
          </div>
        </div>

        {/* Floating Badges Animation */}
        <div className="relative w-full max-w-4xl h-48 rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent flex items-center justify-center gap-8 overflow-hidden">
          <style>{`
            @keyframes float {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-20px); }
            }
            .float-1 { animation: float 3s ease-in-out infinite; }
            .float-2 { animation: float 3s ease-in-out infinite 0.5s; }
            .float-3 { animation: float 3s ease-in-out infinite 1s; }
            .float-4 { animation: float 3s ease-in-out infinite 1.5s; }
          `}</style>
          <div className="float-1"><GoldMemberBadge size="lg" /></div>
          <div className="float-2"><SilverMemberBadge size="lg" /></div>
          <div className="float-3"><BronzeMemberBadge size="lg" /></div>
          <div className="float-4"><BetaTesterBadge size="lg" /></div>
        </div>
      </div>
    </Layout>
  );
}
