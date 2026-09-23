"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
export default function ExitOffer({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current; const previous = document.activeElement; const overflow = document.body.style.overflow;
    element?.showModal(); document.body.style.overflow = "hidden";
    return () => { element?.close(); document.body.style.overflow = overflow; if (previous instanceof HTMLElement && previous.isConnected) previous.focus(); };
  }, []);
  return <dialog ref={dialog} className="exit-offer" aria-labelledby="exit-offer-title" aria-describedby="exit-offer-description" onCancel={event => { event.preventDefault(); onClose(); }}><button type="button" className="exit-offer-close" aria-label="Fizibilite teklifini kapat" onClick={onClose}>×</button><p className="eyebrow">PROJENİZİ BİRLİKTE NETLEŞTİRELİM</p><h2 id="exit-offer-title">Ücretsiz GES Fizibilite Raporu Alın</h2><p id="exit-offer-description">Çatı ve tüketim bilgilerinizi paylaşın; ön fizibilite kapsamını ekibimizle görüşün. Saha verileri incelenmeden kesin üretim veya yatırım getirisi sözü verilmez.</p><Link className="btn btn--primary" href={`/iletisim?${new URLSearchParams({ mesaj: "GES projem için ücretsiz ön fizibilite raporu hakkında görüşmek istiyorum." })}#contact-form`} onClick={onClose}>Ön fizibilite talep edin <span aria-hidden="true">↗</span></Link><button type="button" className="text-link" onClick={onClose}>İncelemeye devam et</button></dialog>;
}
