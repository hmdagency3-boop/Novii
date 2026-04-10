import { cn } from "@/lib/utils";

interface OfficialNotificationToastProps {
  username: string;
  action: "like" | "comment" | "follow";
  isOfficial?: boolean;
}

const actionMessages = {
  like: "أعجب بمنشورك",
  comment: "علق على منشورك",
  follow: "بدأ يتابعك",
};

export function OfficialNotificationToast({
  username,
  action,
  isOfficial,
}: OfficialNotificationToastProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-4 rounded-lg backdrop-blur-lg border",
        isOfficial
          ? "bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-cyan-400/10 border-pink-500/30 shadow-lg shadow-pink-500/20"
          : "bg-blue-500/10 border-blue-500/30"
      )}
    >
      {isOfficial && (
        <div
          className="w-8 h-8 rounded-full bg-cover flex-shrink-0"
          style={{ backgroundImage: "url('/official-badge.png')" }}
        />
      )}
      <div className="flex-1">
        <div
          className={cn(
            "font-bold text-sm",
            isOfficial &&
              "bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent"
          )}
        >
          {username}
        </div>
        <div className="text-xs text-muted-foreground">
          {actionMessages[action]}
        </div>
      </div>
      {isOfficial && (
        <div className="text-xs px-2 py-1 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold">
          رسمي
        </div>
      )}
    </div>
  );
}
