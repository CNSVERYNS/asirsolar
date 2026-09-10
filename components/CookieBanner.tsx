"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "asir-solar-cookie-consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let stored: string | null = null;
    try { stored = window.localStorage.getItem(STORAGE_KEY); } catch { /* Storage can be unavailable in private browsing. */ }
    if (!stored) {
      const t = setTimeout(() => setVisible(true), 4500);
      return () => clearTimeout(t);
    }
  }, []);

  function decide(value: "accepted" | "declined") {
    try {
      if (value === "accepted") window.localStorage.setItem(STORAGE_KEY, value);
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch { /* Dismiss for this page even when storage is blocked. */ }
    setVisible(false);
  }

  return (
    <div
      className="cookie-banner"
      data-visible={visible}
      inert={!visible}
      role="dialog"
      aria-live="polite"
      aria-label="Çerez bildirimi"
    >
      <p>
        Bu sitede reklam veya analiz takibi yapılmaz. Yalnızca bu bildirimdeki tercihiniz tarayıcınızda saklanır. Detaylar için{" "}
        <Link href="/cerez-politikasi" className="text-link">
          Çerez Politikası
        </Link>
        ’nı inceleyebilirsiniz.
      </p>
      <div className="cookie-banner__actions">
        <button type="button" className="btn btn--primary" onClick={() => decide("accepted")}>
          Anladım
        </button>
        <button type="button" className="btn btn--outline" onClick={() => decide("declined")}>
          Tercihi saklama
        </button>
      </div>
    </div>
  );
}
