"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
const SolarEstimator = dynamic(() => import("./SolarEstimator"), { loading: () => <p role="status">Hesaplayıcı hazırlanıyor…</p> });
export function LazySolarEstimator() {
  const [open, setOpen] = useState(false);
  return <div className="estimator-shell" id="ges-hesaplayici">{open ? <SolarEstimator /> : <div className="estimator-intro"><p className="eyebrow">FATURADAN İLK SENARYOYA</p><h2>Çatınız ne kadar enerji üretebilir?</h2><p>Aylık fatura, çatı alanı ve bölge örneğiyle kapasiteyi değerlendirin. Yatırım ve elektrik maliyetini değiştirerek amortisman senaryonuzu görün.</p><button type="button" className="btn btn--primary" aria-expanded={open} onClick={() => setOpen(true)}>Hesaplayıcıyı aç <span aria-hidden="true">↗</span></button><noscript><p>Etkileşimli hesap için JavaScript gerekir. Hesap yöntemi ve keşif bağlantıları aşağıda kullanılabilir.</p></noscript></div>}</div>;
}
