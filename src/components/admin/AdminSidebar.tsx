"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { useState } from "react";

const SECTIONS = [
  { href: "/admin/experiences", label: "Experiences", emoji: "📋" },
  { href: "/admin/projects",    label: "Projects",    emoji: "📁" },
  { href: "/admin/skills",      label: "Skills",      emoji: "⚡" },
  { href: "/admin/guestbook",   label: "Guestbook",   emoji: "📝" },
  { href: "/admin/visits",      label: "Visits",       emoji: "📊" },
  { href: "/admin/profile",     label: "Profile",      emoji: "👤" },
];

const linkBase = "flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-semibold transition-all duration-150";

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const logout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  const sidebar = (
    <>
      {/* Brand */}
      <div className="px-6 pt-8 pb-6 border-b border-gray-100">
        <Link href="/admin" className="inline-block text-[15px] font-bold text-gray-900 tracking-tight hover:text-blue-600 transition-colors">
          Admin
        </Link>
        <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-[0.1em] font-semibold">
          Portfolio CMS
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-5 space-y-1 overflow-y-auto">
        {SECTIONS.map((s) => {
          const active = pathname.startsWith(s.href);
          return (
            <Link
              key={s.href}
              href={s.href}
              onClick={() => setOpen(false)}
              className={clsx(
                linkBase,
                active
                  ? "bg-blue-50 text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
              )}
            >
              <span className="text-base leading-none">{s.emoji}</span>
              {s.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-100 space-y-1">
        <Link
          href="/"
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-[12px] font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to site
        </Link>
        <button
          onClick={logout}
          className="flex items-center gap-2.5 w-full px-4 py-2.5 rounded-xl text-[12px] font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-3 left-3 z-50 lg:hidden p-2.5 rounded-xl bg-white shadow-md border border-gray-200 text-gray-500 hover:text-gray-900 transition-colors"
        aria-label="Toggle menu"
      >
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" d={open ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
        </svg>
      </button>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-30 bg-black/25 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          "flex flex-col h-full bg-white border-r border-gray-100",
          "hidden lg:flex",
          "max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-40 max-lg:w-64 max-lg:shadow-2xl max-lg:transition-transform max-lg:duration-300",
          !open && "max-lg:-translate-x-full",
        )}
      >
        {sidebar}
      </aside>
    </>
  );
}
