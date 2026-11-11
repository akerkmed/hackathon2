import { SessionProvider } from "@/components/providers/session-provider";
import { AppShell } from "@/components/app-shell";

export default function CitizenLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AppShell>{children}</AppShell>
    </SessionProvider>
  );
}
