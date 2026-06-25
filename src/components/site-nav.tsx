"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useLanguage } from "@/components/language-provider";

export function SiteNav() {
  const pathname = usePathname();
  const { m, toggleLang } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { href: "/", label: m.nav.home },
    { href: "/skills", label: m.nav.skills },
    { href: "/experience", label: m.nav.experience },
    { href: "/projects", label: m.nav.projects },
    { href: "/lab", label: m.nav.lab },
  ];

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  // Close menu on route change
  useEffect(() => { closeMenu(); }, [pathname, closeMenu]);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <header className="site-nav-wrap">
      <nav className={clsx("site-nav", menuOpen && "menu-open")}>
        <Link href="/" className="brand" onClick={closeMenu}>
          {m.nav.brand}
        </Link>

        {/* Desktop links */}
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

        {/* Mobile right group: lang switch + hamburger */}
        <div className="nav-mobile-right">
          <button
            className="lang-switch-btn lang-switch-btn--mobile"
            onClick={toggleLang}
            aria-label="Switch language"
          >
            {m.nav.switch}
          </button>
          <button
            className="nav-hamburger"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            <span className={clsx("hamburger-line", menuOpen && "open")} />
            <span className={clsx("hamburger-line", menuOpen && "open")} />
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <div className={clsx("nav-mobile-menu", menuOpen && "visible")}>
        {/* Close button */}
        <button
          className="nav-mobile-close"
          onClick={closeMenu}
          aria-label="Close menu"
        >
          ✕
        </button>

        <nav className="nav-mobile-links">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={clsx("nav-mobile-link", pathname === link.href && "active")}
              onClick={closeMenu}
            >
              {link.label}
            </Link>
          ))}
          <button
            className="nav-mobile-lang"
            onClick={() => { toggleLang(); closeMenu(); }}
          >
            {m.nav.switch}
          </button>
        </nav>
      </div>
    </header>
  );
}
