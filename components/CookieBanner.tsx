"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { marketing, trackingConsentKey } from "@/lib/marketing-config";
const MarketingScripts = dynamic(() => import("./MarketingScripts"), { ssr: false });

const STORAGE_KEY = "asir-solar-cookie-consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    let stored: string | null = null;
    try { stored = window.localStorage.getItem(marketing.enabled ? trackingConsentKey : STORAGE_KEY); } catch { /* Consent remains denied when storage is unavailable. */ }
    const timer = setTimeout(() => { setAccepted(marketing.enabled && stored === "accepted"); setVisible(!stored); }, stored ? 0 : 4500);
    const open = () => setVisible(true);
    window.addEventListener("asir:privacy-settings", open);
    return () => { clearTimeout(timer); window.removeEventListener("asir:privacy-settings", open); };
  }, []);

  function decide(value: "accepted" | "declined") {
    try {
      window.localStorage.setItem(marketing.enabled ? trackingConsentKey : STORAGE_KEY, value);
    } catch { /* Dismiss for this page even when storage is blocked. */ }
    const withdrawing = accepted && value === "declined";
    setAccepted(marketing.enabled && value === "accepted"); setVisible(false);
    if (withdrawing) window.location.reload();
  }

  return (
    <>{accepted && <MarketingScripts />}<div
      className="cookie-banner"
      data-visible={visible}
      inert={!visible}
      role="dialog"
      aria-live="polite"
      aria-label="Çerez bildirimi"
    >
      <p>
        {marketing.enabled ? "İzninizle ziyaret ölçümü ve reklam araçları yüklenebilir. Reddettiğinizde bu araçlar yüklenmez; form ve site çalışmaya devam eder." : "Bu sitede reklam veya analiz takibi yapılmaz. Yalnızca bu bildirimdeki tercihiniz tarayıcınızda saklanır."} Detaylar için{" "}
        <Link href="/cerez-politikasi" className="text-link">
          Çerez Politikası
        </Link>
        ’nı inceleyebilirsiniz.
      </p>
      <div className="cookie-banner__actions">
        <button type="button" className="btn btn--primary" onClick={() => decide("accepted")}>
          {marketing.enabled ? "İzin ver" : "Anladım"}
        </button>
        <button type="button" className="btn btn--outline" onClick={() => decide("declined")}>
          {marketing.enabled ? "Reddet" : "Kapat"}
        </button>
      </div>
    </div></>
  );
}
export function PrivacySettingsButton() { return <button type="button" className="text-link" onClick={() => window.dispatchEvent(new Event("asir:privacy-settings"))}>Çerez tercihleri</button>; }
