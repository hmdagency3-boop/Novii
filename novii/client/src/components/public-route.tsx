import { useAuth } from "@/lib/auth-context";
import ProtectedLayout from "@/components/protected-layout";
import GuestLayout from "@/components/guest-layout";

export default function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <GuestLayout>{children}</GuestLayout>;
  }

  return <ProtectedLayout>{children}</ProtectedLayout>;
}
