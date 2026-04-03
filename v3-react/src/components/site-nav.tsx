"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useLanguage } from "@/components/language-provider";

export function SiteNav() {
  const pathname = usePathname();
  const { m, toggleLang } = useLanguage();

  const links = [
    { href: "/", label: m.nav.home },
    { href: "/skills", label: m.nav.skills },
    { href: "/experience", label: m.nav.experience },
    { href: "/projects", label: m.nav.projects },
    { href: "/lab", label: m.nav.lab },
  ];

  return (
    <header className="site-nav-wrap">
      <nav className="site-nav">
        <Link href="/" className="brand">
          {m.nav.brand}
        </Link>
        <div className="nav-links">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={clsx("nav-link", pathname === link.href && "active")}
            >
              {link.label}
            </Link>
          ))}
          <button className="lang-switch-btn" onClick={toggleLang}>
            {m.nav.switch}
          </button>
        </div>
      </nav>
    </header>
  );
}
