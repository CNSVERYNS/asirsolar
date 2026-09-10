"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, type KeyboardEvent } from "react";

const applications = [
  { label: "Ev & Villa", tag: "YAŞAM ALANLARI İÇİN", title: "Çatınız, evinizin enerji kaynağı olsun.", text: "Çatınızın yapısına ve evinizin tüketimine uygun bir sistem planlayalım. Kullanmadığınız alanı, sizin için çalışan bir enerji kaynağına dönüştürelim.", image: "/images/stock/house-rooftop.jpg", points: ["Çatı yapısına uygun panel yerleşimi", "Tüketiminize göre sistem tasarımı", "Elektrik altyapısıyla uyumlu kurulum"], project: "Konut / Villa" },
  { label: "İşletme & Fabrika", tag: "İŞİNİZİN ENERJİSİ İÇİN", title: "Üreten çatılar. Daha güçlü işletmeler.", text: "İşletmenizin enerji ihtiyacını üretim düzeninizle birlikte ele alalım. Çatı alanınızı, tüketim profilinizi ve pano altyapınızı aynı mühendislik planında buluşturalım.", image: "/images/stock/industrial-roof.jpg", points: ["İşletmeye özel tüketim analizi", "Pano ve elektrik altyapısı planlaması", "Kurulumdan sonra teknik destek"], project: "İşletme / Fabrika" },
  { label: "Arazi", tag: "ARAZİNİZİN POTANSİYELİ İÇİN", title: "Açık alanlar, yeni enerji olanakları.", text: "Arazinizin güneş enerjisi için uygunluğunu birlikte değerlendirelim. Yerleşim, bağlantı olanakları ve proje ihtiyaçlarına göre bir yol haritası oluşturalım.", image: "/images/stock/field-array.jpg", points: ["Saha ve yerleşim değerlendirmesi", "Ekipman ve taşıyıcı sistem seçimi", "Şebeke bağlantı sürecinin planlanması"], project: "Arazi Tipi" },
];

export function SolutionFinder() {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const application = applications[active];
  function navigateTabs(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number;
    if (event.key === "ArrowRight") next = (index + 1) % applications.length;
    else if (event.key === "ArrowLeft") next = (index + applications.length - 1) % applications.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = applications.length - 1;
    else return;
    event.preventDefault();
    setActive(next);
    tabs.current[next]?.focus();
  }
  return (
    <div className="application-finder">
      <div className="application-tabs" role="tablist" aria-label="Uygulama alanı">
        {applications.map((item, index) => <button key={item.label} ref={(node) => { tabs.current[index] = node; }} type="button" role="tab" id={`application-tab-${index}`} aria-selected={active === index} aria-controls="application-panel" tabIndex={active === index ? 0 : -1} onClick={() => setActive(index)} onKeyDown={(event) => navigateTabs(event, index)}><span className="tab-number">0{index + 1}</span>{item.label}<span aria-hidden="true">↗</span></button>)}
      </div>
      <div className="application-panel" role="tabpanel" id="application-panel" aria-labelledby={`application-tab-${active}`} tabIndex={0}>
        <div className="application-panel__image"><Image key={application.image} src={application.image} alt={`${application.label} için temsili güneş enerjisi uygulaması`} fill sizes="(max-width: 800px) 100vw, 50vw" /><span>GÜNEŞ ENERJİSİ UYGULAMA ALANLARI</span></div>
        <div className="application-panel__content"><p className="eyebrow">{application.tag}</p><h3>{application.title}</h3><p className="text-muted">{application.text}</p><ul>{application.points.map((point) => <li key={point}><span aria-hidden="true">✓</span>{point}</li>)}</ul><Link href={`/iletisim?proje=${encodeURIComponent(application.project)}`} className="btn btn--primary">Projenizi birlikte değerlendirelim <span className="btn__arrow" aria-hidden="true">↗</span></Link></div>
      </div>
    </div>
  );
}
