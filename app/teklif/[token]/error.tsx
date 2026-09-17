"use client";
export default function QuoteError({ reset }: { reset: () => void }) { return <div className="quote-page"><section className="quote-response"><h1>Teklif şu anda açılamıyor.</h1><p>Lütfen biraz sonra tekrar deneyin veya ekibimizle iletişime geçin.</p><button className="quote-button" onClick={reset}>Tekrar dene</button></section></div>; }
