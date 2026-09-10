"use client";
import { WhatsAppLink } from "@/components/WhatsAppLink";
import { whatsappContact } from "@/lib/whatsapp";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { company } from "@/data/company";
import { navLinks } from "@/lib/site";
import { MobileMenu } from "@/components/MobileMenu";
import { Mark } from "@/components/Mark";

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu on route change. Adjusted during render (per
  // https://react.dev/learn/you-might-not-need-an-effect) instead of an
  // effect, so it doesn't trigger a cascading re-render.
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMenuOpen(false);
  }

  return (
    <>
      <header className="site-header" data-scrolled={scrolled}>
        <div className="site-header__inner">
          <Link href="/" className="wordmark" aria-label="Asır Solar — Ana Sayfa">
            <Mark size={58} />
            <span className="wordmark__text">
              <span>ASIR SOLAR</span>
              <span>GÜNEŞ ENERJİ SİSTEMLERİ</span>
            </span>
          </Link>

          <nav className="main-nav" aria-label="Ana navigasyon">
            <ul className="main-nav__list">
              {navLinks.filter((link) => link.href !== "/" && link.href !== "/ekibimiz").map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="main-nav__link"
                    aria-current={pathname === link.href || pathname.startsWith(`${link.href}/`) ? "page" : undefined}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <button
              type="button"
              className="menu-toggle"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span className="menu-toggle__bars" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              {menuOpen ? "Kapat" : "Menü"}
            </button>
          </nav>

          <div className="header-actions">
            <a href={company.phoneHref} className="header-phone">
              {company.phoneDisplay}
            </a>
            <Link href="/iletisim" className="btn btn--primary">
              Ücretsiz Keşif
              <span className="btn__arrow" aria-hidden="true">
                ↗
              </span>
            </Link>
          </div>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={closeMenu} />
      <div className="desktop-whatsapp"><WhatsAppLink /></div>
      {(pathname !== "/iletisim" || whatsappContact) && <div className="mobile-contact-bar" data-whatsapp={!!whatsappContact}>
        <a href={company.phoneHref}>{whatsappContact ? "Ara" : "Bizi arayın"}<span aria-hidden="true">↗</span></a>
        <WhatsAppLink variant="mobile" />
        <Link href={pathname === "/iletisim" ? "#contact-form" : "/iletisim"}>{whatsappContact ? "Keşif" : "Ücretsiz keşif"} <span aria-hidden="true">↗</span></Link>
      </div>}
    </>
  );
}
