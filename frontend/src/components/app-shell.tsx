"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/workflow", label: "Studio" },
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Preferences" },
];

export function AppShell({
  title,
  subtitle,
  rightContent,
  children,
}: {
  title: string;
  subtitle: string;
  rightContent?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 md:px-8">
      <div className="hero-aurora pointer-events-none" />
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6">
        <header className="glass-panel neon-edge">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-cyan-200">AI Mutation Arena</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-white md:text-5xl">{title}</h1>
              <p className="mt-2 text-sm text-slate-200 md:text-base">{subtitle}</p>
            </div>
            {rightContent ? <div>{rightContent}</div> : null}
          </div>
          <nav className="mt-5 flex flex-wrap gap-2">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} className={active ? "chip-active" : "chip"}>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>
        {children}
      </div>
    </div>
  );
}
