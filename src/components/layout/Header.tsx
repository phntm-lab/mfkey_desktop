import type { ReactNode } from "react";

interface HeaderProps {
  title: string;
  actions?: ReactNode;
}

export function Header({ title, actions }: HeaderProps) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-line bg-surface px-4">
      <h1 className="text-sm font-medium text-fg">{title}</h1>
      <div className="flex items-center gap-2">{actions}</div>
    </header>
  );
}
