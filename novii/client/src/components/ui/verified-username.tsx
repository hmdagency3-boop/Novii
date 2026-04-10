import { cn } from "@/lib/utils";

interface VerifiedUsernameProps {
  username: string;
  isVerified?: boolean;
  className?: string;
}

export function VerifiedUsername({
  username,
  isVerified = false,
  className,
}: VerifiedUsernameProps) {
  return (
    <>
      <style>{`
        @keyframes gradient-shift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        
        .verified-username-glow {
          background: linear-gradient(
            -45deg,
            #a855f7,
            #d946ef,
            #ec4899,
            #a855f7
          );
          background-size: 300% 300%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradient-shift 4s ease infinite;
          font-weight: bold;
        }
      `}</style>
      <span
        className={cn(
          isVerified ? "verified-username-glow" : "",
          className
        )}
      >
        {username}
      </span>
    </>
  );
}
