import { useAuth } from "@/lib/auth-context";
import { useDeviceHeartbeat } from "@/hooks/use-data";

export function DeviceHeartbeat() {
  const { user } = useAuth();
  useDeviceHeartbeat(!!user);
  return null;
}
