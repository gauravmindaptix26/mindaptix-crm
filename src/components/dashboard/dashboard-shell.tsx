"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutUser } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import type { AuthenticatedSession } from "@/lib/auth/auth-session";
import {
  getDashboardNavItemsForRole,
  getDisplayRoleLabel,
  type DashboardNavItem,
  type DashboardNavKey,
} from "@/lib/dashboard/config";

type DashboardShellProps = {
  children: ReactNode;
  session: AuthenticatedSession;
};

export function DashboardShell({ children, session }: DashboardShellProps) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navItems = useMemo(() => getDashboardNavItemsForRole(session.user.role), [session.user.role]);

  return (
    <main className="h-screen overflow-hidden bg-[linear-gradient(180deg,#eff6ff_0%,#f8fbff_48%,#eef4ff_100%)] text-slate-900">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl" />
        <div className="absolute right-0 top-20 h-80 w-80 rounded-full bg-cyan-100/60 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-sky-100/60 blur-3xl" />
      </div>

      <div className="relative mx-auto flex h-screen max-w-[1680px]">
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex h-screen w-[308px] flex-col overflow-y-auto border-r border-white/10 bg-[linear-gradient(180deg,#061227_0%,#0b1730_30%,#0b2040_68%,#0a4e87_100%)] px-4 py-4 text-white shadow-[28px_0_80px_rgba(2,6,23,0.3)] transition duration-300 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden lg:sticky lg:top-0 lg:translate-x-0 ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(11,28,53,0.96)_0%,rgba(10,54,94,0.92)_100%)] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <div className="flex items-center gap-3">
              <div className="overflow-hidden rounded-[1rem] shadow-[0_16px_32px_rgba(16,185,129,0.28)]">
                <Image alt="Dashboard icon" className="h-12 w-12 object-cover" height={48} src="/3.png" width={48} />
              </div>
              <div className="min-w-0">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.32em] text-cyan-100/68">Workspace</p>
                <h2 className="truncate text-xl font-semibold text-white">Mindaptix CRM</h2>
              </div>
            </div>
          </div>

          <nav className="mt-5 flex-1 space-y-2">
            {navItems.map((item) => {
              const active = isItemActive(pathname, item);

              return (
                <Link
                  className={`flex w-full items-center gap-3 rounded-[1.25rem] px-3 py-3 transition ${
                    active
                      ? "bg-white text-slate-900 shadow-[0_20px_50px_rgba(255,255,255,0.14)]"
                      : "text-slate-200/92 hover:bg-white/8"
                  }`}
                  href={item.href}
                  key={item.key}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <span
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-[1rem] border ${
                      active ? "border-blue-100 bg-blue-50 text-blue-600" : "border-white/10 bg-white/6 text-white/90"
                    }`}
                  >
                    {getMenuIcon(item.key)}
                  </span>
                  <span className={`truncate text-[1rem] font-semibold ${active ? "text-slate-900" : "text-slate-100"}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-white/8 p-4">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-blue-100/68">Signed In</p>
            <p className="mt-2 text-base font-semibold text-white">{session.user.fullName}</p>
            <p className="mt-1 text-sm text-blue-100/80">{getDisplayRoleLabel(session.user.role)}</p>
            <p className="mt-1 break-all text-xs text-blue-100/72">{session.user.email}</p>

            <form action={logoutUser} className="mt-4">
              <Button className="w-full bg-white text-slate-900 hover:bg-blue-50" type="submit">
                Log out
              </Button>
            </form>
          </div>
        </aside>

        {isSidebarOpen ? (
          <button
            aria-label="Close sidebar"
            className="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-[2px] lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
            type="button"
          />
        ) : null}

        <section className="flex min-w-0 flex-1 flex-col overflow-y-auto px-4 py-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden lg:h-screen lg:px-7 lg:py-3">
          <div className="rounded-[2rem] border border-white/60 bg-white/78 shadow-[0_30px_90px_rgba(59,130,246,0.12)] backdrop-blur-xl">
            <header className="px-5 pb-0 pt-3 sm:px-7">
              <div className="flex items-start gap-3">
                <button
                  aria-label="Open sidebar"
                  className="grid h-12 w-12 place-items-center rounded-[1rem] border border-slate-200 bg-white text-slate-700 shadow-[0_14px_30px_rgba(15,23,42,0.08)] lg:hidden"
                  onClick={() => setIsSidebarOpen(true)}
                  type="button"
                >
                  <HamburgerIcon />
                </button>
              </div>
            </header>

            {children}
          </div>
        </section>
      </div>
    </main>
  );
}

function isItemActive(pathname: string, item: DashboardNavItem) {
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function getMenuIcon(key: DashboardNavKey) {
  switch (key) {
    case "dashboard":
      return <GridIcon />;
    case "employees":
      return <UsersIcon />;
    case "attendance":
      return <CalendarIcon />;
    case "leaves":
      return <DocumentIcon />;
    case "tasks":
      return <BriefcaseIcon />;
    case "dsr":
      return <ReportIcon />;
    case "reports":
      return <ChartIcon />;
    case "settings":
      return <SettingsIcon />;
  }
}

function HamburgerIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="22" viewBox="0 0 24 24" width="22">
      <rect height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1.7" width="6.5" x="3.5" y="3.5" />
      <rect height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1.7" width="6.5" x="14" y="3.5" />
      <rect height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1.7" width="6.5" x="3.5" y="14" />
      <rect height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1.7" width="6.5" x="14" y="14" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20">
      <circle cx="8" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="16" cy="8" r="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M4.2 18c.8-2.1 2.5-3.3 4.7-3.3 2.1 0 4 1.1 4.9 3.3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
      <path d="M14.2 17.5c.5-1.4 1.6-2.2 3-2.2 1.2 0 2.1.5 2.8 1.6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20">
      <rect height="15" rx="2.2" stroke="currentColor" strokeWidth="1.7" width="18" x="3" y="5.5" />
      <path d="M7.5 3.5v4M16.5 3.5v4M3 10h18" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
      <path d="m9.5 15 1.5 1.5 3.5-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20">
      <path d="M8 3.5h6l4 4V20a.5.5 0 0 1-.5.5h-9A3.5 3.5 0 0 1 5 17V7A3.5 3.5 0 0 1 8.5 3.5H8Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
      <path d="M10 11.5h6M10 15.5h6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20">
      <path d="M8 6.5V5a1.5 1.5 0 0 1 1.5-1.5h5A1.5 1.5 0 0 1 16 5v1.5" stroke="currentColor" strokeWidth="1.7" />
      <rect height="13" rx="2.2" stroke="currentColor" strokeWidth="1.7" width="18" x="3" y="6.5" />
      <path d="M3 11.5h18" stroke="currentColor" strokeWidth="1.7" />
      <path d="M10 11.5v2h4v-2" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

function ReportIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20">
      <path d="M7 4.5h10A1.5 1.5 0 0 1 18.5 6v12A1.5 1.5 0 0 1 17 19.5H7A1.5 1.5 0 0 1 5.5 18V6A1.5 1.5 0 0 1 7 4.5Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8.5 9.5h7M8.5 13h7M8.5 16.5H13" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20">
      <path d="M5 18.5V10.5M10 18.5V6.5M15 18.5V12.5M20 18.5V4.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="m4.5 8.5 4-3 4 2.5 6-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20">
      <path
        d="M12 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Zm7.2 3.5.8 1.4-1.8 3.1-1.7-.2a6.8 6.8 0 0 1-1.2.7l-.7 1.6H9.4l-.7-1.6a6.8 6.8 0 0 1-1.2-.7l-1.7.2L4 13.4l.8-1.4a7.4 7.4 0 0 1 0-1.9L4 8.6l1.8-3.1 1.7.2a6.8 6.8 0 0 1 1.2-.7l.7-1.6h5.2l.7 1.6a6.8 6.8 0 0 1 1.2.7l1.7-.2L20 8.6l-.8 1.5a7.4 7.4 0 0 1 0 1.9Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}
