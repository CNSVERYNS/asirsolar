"use client";
export default function AdminError({ reset }: {
    reset: () => void;
}) { return <div className="crm crm-error-page"><h1>Panel şu anda yüklenemedi.</h1><p>Bağlantıyı kontrol edip tekrar deneyin. Kayıtlarınız silinmedi.</p><button className="crm-button" onClick={reset}>Tekrar dene</button></div>; }
