import type { ReactNode } from "react";
import { SideRail } from "./SideRail";
import { Header } from "./Header";

interface AppShellProps {
  title: string;
  headerActions?: ReactNode;
  children: ReactNode;
}

export function AppShell({ title, headerActions, children }: AppShellProps) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-base text-fg">
      <SideRail />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header title={title} actions={headerActions} />
        <main className="min-h-0 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
