"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function CursorScript() {
  const pathname = usePathname();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const observedRef = useRef<Set<Element>>(new Set());

  // ── Setup reveal observer (re-runs on route change) ──
  useEffect(() => {
    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("visible");
            }
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
      );
    }

    const observer = observerRef.current;
    const observed = observedRef.current;

    // Give React time to render new page content
    const timer = setTimeout(() => {
      const revealEls = document.querySelectorAll<HTMLElement>(
        "[data-reveal]",
      );

      revealEls.forEach((el) => {
        if (observed.has(el)) return;
        observed.add(el);
        observer.observe(el);

        // Immediately reveal elements already in viewport
        if (el.getBoundingClientRect().top < window.innerHeight) {
          el.classList.add("visible");
        }
      });
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [pathname]);

  // ── Cursor, parallax, scroll effects (runs once on mount) ──
  useEffect(() => {
    const cursor = document.getElementById("cursor");
    const cursorDot = document.getElementById("cursor-dot");
    if (!cursor || !cursorDot) return;

    let mouseX = 0, mouseY = 0, dotX = 0, dotY = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX; mouseY = e.clientY;
      cursor.style.left = mouseX + "px";
      cursor.style.top = mouseY + "px";
    };

    const animateDot = () => {
      dotX += (mouseX - dotX) * 0.15;
      dotY += (mouseY - dotY) * 0.15;
      cursorDot.style.left = dotX + "px";
      cursorDot.style.top = dotY + "px";
      requestAnimationFrame(animateDot);
    };
    document.addEventListener("mousemove", onMouseMove);
    animateDot();

    // Cursor hover states
    const hoverSelector = "a, button, input, textarea, .skill-card, .proj-row, .exp-item, .guest-note, .explore-link, .lab-input";
    const onEnter = () => cursor.classList.add("hover");
    const onLeave = () => cursor.classList.remove("hover");
    const updateHoverTargets = () => {
      document.querySelectorAll(hoverSelector).forEach((el) => {
        el.addEventListener("mouseenter", onEnter);
        el.addEventListener("mouseleave", onLeave);
      });
    };
    updateHoverTargets();

    // Parallax for hero background word
    const heroBgWord = document.getElementById("hero-bg-word");
    const onParallax = (e: MouseEvent) => {
      if (heroBgWord) {
        const px = (e.clientX / window.innerWidth - 0.5) * 20;
        const py = (e.clientY / window.innerHeight - 0.5) * 20;
        heroBgWord.style.transform = "translateY(-50%) translate(" + px * 0.6 + "px," + py * 0.3 + "px)";
      }
    };
    document.addEventListener("mousemove", onParallax);

    // Nav scroll state + scroll indicator
    const nav = document.querySelector(".site-nav");
    const scrollIndicator = document.getElementById("scroll-indicator");
    const onScroll = () => {
      if (nav) {
        nav.classList.toggle("scrolled", window.scrollY > 60);
      }
      if (scrollIndicator) {
        scrollIndicator.classList.toggle("hidden", window.scrollY > 60);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // Re-attach hover listeners periodically for SPA navigation
    const hoverInterval = setInterval(updateHoverTargets, 2000);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mousemove", onParallax);
      window.removeEventListener("scroll", onScroll);
      clearInterval(hoverInterval);
    };
  }, []);

  // ── Cleanup observer on unmount ──
  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
      observedRef.current.clear();
    };
  }, []);

  return null;
}
