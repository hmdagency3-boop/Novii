import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Phone, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/language-context";

declare global {
  interface Navigator {
    contacts?: {
      select: (
        properties: string[],
        options?: { multiple?: boolean }
      ) => Promise<Array<{ name?: string[]; tel?: string[]; email?: string[] }>>;
      getProperties: () => Promise<string[]>;
    };
  }
}

interface Props {
  variant?: "inline" | "sidebar";
}

export default function ContactsSyncBanner({ variant = "inline" }: Props) {
  const { direction } = useLanguage();
  const isRTL = direction === "rtl";
  const queryClient = useQueryClient();

  const { data: currentProfile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => api.getCurrentProfile(),
  });

  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem("contacts_sync_dismissed") === "1"
  );
  const [syncing, setSyncing] = useState(false);

  if (dismissed || !currentProfile || currentProfile.contacts_synced_at) return null;

  const handleSync = async () => {
    const supported =
      typeof navigator !== "undefined" &&
      "contacts" in navigator &&
      typeof navigator.contacts?.select === "function";

    if (!supported) {
      toast.info(
        isRTL
          ? "هذه الميزة مدعومة على متصفح Chrome في Android فقط"
          : "This feature is only supported on Chrome for Android"
      );
      return;
    }

    try {
      setSyncing(true);
      const picked = await navigator.contacts!.select(["name", "tel"], {
        multiple: true,
      });

      const contacts = picked
        .flatMap((c) =>
          (c.tel || []).map((phone) => ({
            phone: String(phone).replace(/\s+/g, ""),
            name: (c.name && c.name[0]) || "",
          }))
        )
        .filter((c) => c.phone.length >= 6);

      if (contacts.length === 0) {
        toast.info(isRTL ? "لم يتم اختيار أي جهة اتصال" : "No contacts selected");
        return;
      }

      const result = await api.syncContacts(contacts);
      toast.success(
        isRTL
          ? `تمت مزامنة ${result.total} جهة اتصال - وجدنا ${result.matched} من أصدقائك!`
          : `Synced ${result.total} contacts - found ${result.matched} of your friends!`
      );
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["suggestedUsers"] });
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        toast.error(
          isRTL ? "تعذّر الوصول لجهات الاتصال" : "Could not access contacts"
        );
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("contacts_sync_dismissed", "1");
  };

  const wrapperClass =
    variant === "sidebar"
      ? "mb-4 p-3 rounded-xl bg-primary/5 border border-primary/10"
      : "mx-3 my-3 p-3 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/15";

  return (
    <div className={wrapperClass}>
      <div className="flex items-start gap-2">
        <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
          <Phone className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="text-sm font-semibold text-foreground">
              {isRTL ? "اكتشف أصدقاءك على نوفي" : "Find your friends on Novii"}
            </p>
            <button
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground -mt-1 -mr-1 p-1"
              aria-label="dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground mb-2 leading-relaxed">
            {isRTL
              ? "اسمح بالوصول لجهات الاتصال علشان نساعدك تلاقي أصحابك المسجلين على نوفي"
              : "Allow contacts access so we can help you find friends already on Novii"}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="px-3 py-1.5 text-[11px] font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {syncing
                ? isRTL
                  ? "جاري المزامنة..."
                  : "Syncing..."
                : isRTL
                  ? "السماح بالوصول"
                  : "Allow Access"}
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 text-[11px] font-medium rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            >
              {isRTL ? "لاحقاً" : "Later"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
