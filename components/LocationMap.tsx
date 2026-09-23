"use client";
import { useState } from "react";
import { company } from "@/data/company";
export function LocationMap() {
  const [open, setOpen] = useState(false);
  return <div className="location-map">{open ? <iframe title="Asır Solar ofis konumu — Google Haritalar" src={`https://www.google.com/maps?q=${encodeURIComponent(company.address.full)}&output=embed`} loading="lazy" referrerPolicy="no-referrer" allowFullScreen /> : <><p>Haritayı açtığınızda Google Haritalar’a bağlanılır.</p><button type="button" className="btn btn--outline" aria-expanded={open} onClick={() => setOpen(true)}>Haritayı yükle</button></>}</div>;
}
