"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { company } from "@/data/company";
import { navLinks } from "@/lib/site";
import { Mark } from "@/components/Mark";

export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!open) { if (dialog.open) dialog.close(); return; }
    dialog.showModal();
    const scrollY = window.scrollY;
    const { body } = document;
    const original = { position: body.style.position, top: body.style.top, left: body.style.left, right: body.style.right };
    Object.assign(body.style, { position: "fixed", top: `-${scrollY}px`, left: "0", right: "0" });
    return () => {
      if (dialog.open) dialog.close();
      Object.assign(body.style, original);
      window.scrollTo({ top: scrollY, behavior: "instant" });
    };
  }, [open]);

  return (
    <dialog ref={dialogRef} id="mobile-menu" className="mobile-menu" aria-label="Mobil navigasyon" onCancel={(event) => { event.preventDefault(); onClose(); }}>
      <div className="mobile-menu__top">
        <Link href="/" className="wordmark" aria-label="Asır Solar — Ana Sayfa" onClick={onClose}>
          <Mark size={49} /><span className="wordmark__text"><span>ASIR SOLAR</span><span>GÜNEŞ ENERJİ SİSTEMLERİ</span></span>
        </Link>
        <button type="button" className="menu-toggle" aria-label="Menüyü kapat" onClick={onClose}><span aria-hidden="true">✕</span> Kapat</button>
      </div>
      <nav className="mobile-menu__body" aria-label="Mobil ana navigasyon">
        <ul className="mobile-menu__list">{navLinks.map((link) => <li key={link.href}><Link href={link.href} className="mobile-menu__link" onClick={onClose}>{link.label}</Link></li>)}</ul>
      </nav>
      <div className="mobile-menu__footer">
        <a href={company.phoneHref} className="text-link">{company.phoneDisplay}</a>
        <a href={`mailto:${company.generalEmail}`} className="text-link">{company.generalEmail}</a>
        <p className="text-muted" style={{ marginTop: 8, fontSize: 13 }}>{company.address.full}</p>
      </div>
    </dialog>
  );
}
