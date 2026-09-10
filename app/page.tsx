import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/Container";
import { PrimaryButton, TextLink } from "@/components/Button";
import { HeroVideo } from "@/components/HeroVideo";
import { SolutionFinder } from "@/components/SolutionFinder";
import { Reveal } from "@/components/Reveal";
import { FAQ } from "@/components/FAQ";
import { CTASection } from "@/components/CTASection";
import { CompassIcon, PanelIcon, PowerIcon, BoltIcon } from "@/components/Icons";
import { services } from "@/data/services";

const featuredServices = [services[0], services[2], services[3]];
const steps = [
  { title: "Sizi ve sahanızı tanıyoruz.", description: "Tüketiminizi, çatınızı ve elektrik altyapınızı yerinde değerlendiriyoruz.", detail: "Keşif & ihtiyaç analizi" },
  { title: "Doğru sistemi tasarlıyoruz.", description: "Panel yerleşimini, ekipman seçimini ve uygulama kapsamını netleştiriyoruz.", detail: "Projelendirme & teklif" },
  { title: "Projeyi sahaya taşıyoruz.", description: "Mekanik montajı ve elektrik bağlantılarını mühendislik planına göre uyguluyoruz.", detail: "Tedarik & kurulum" },
  { title: "Enerjinizi devreye alıyoruz.", description: "Ölçüm ve testleri tamamlıyor, sistemi kullanım bilgileriyle birlikte teslim ediyoruz.", detail: "Test & teknik destek" },
];

export default function HomePage() {
  return (
    <>
      <section className="solar-hero" aria-labelledby="hero-title">
        <HeroVideo />
        <Container>
          <div className="solar-hero__content">
            <p className="eyebrow eyebrow--light"><span className="status-dot" /> GÜNEŞTEN GELEN GÜÇ, MÜHENDİSLİKLE.</p>
            <h1 id="hero-title">Geleceğin enerjisi.<br /><span>Bugünün kararı.</span></h1>
            <p className="solar-hero__description">Çatınızın potansiyelini enerjiye dönüştürüyoruz. Güneş enerjisi ve elektrik sistemlerinde, keşiften devreye almaya yanınızdayız.</p>
            <div className="solar-hero__actions">
              <PrimaryButton href="/iletisim">Ücretsiz keşif talep edin</PrimaryButton>
              <Link href="#cozumler" className="hero-text-link">Çözümlerimizi keşfedin <span aria-hidden="true">↗</span></Link>
            </div>
          </div>
          <div className="solar-hero__bottom">
            <span><span className="status-dot" /> GEBZE, KOCAELİ <span className="hero-meta-divider">/</span> ASIR SOLAR</span>
            <a href="#yaklasim" className="scroll-cue">DAHA YAKINDAN TANIYIN <span aria-hidden="true">↓</span></a>
          </div>
        </Container>
      </section>

      <section className="capability-band" aria-label="Uçtan uca hizmet">
        <Container>
          <p className="capability-band__intro">Tek ekip.<br /><strong>Uçtan uca çözüm.</strong></p>
          {[{ title: "Projelendirme", Icon: CompassIcon }, { title: "Doğru ekipman", Icon: PanelIcon }, { title: "Uzman uygulama", Icon: PowerIcon }, { title: "Devreye alma", Icon: BoltIcon }].map(({ title, Icon }) => (
            <div className="capability-band__item" key={title}><Icon size={25} /><span>{title}</span></div>
          ))}
        </Container>
      </section>

      <section className="section brand-intro" id="yaklasim">
        <Container>
          <Reveal><p className="eyebrow"><span className="section-index">01 /</span> ASIR SOLAR İLE TANIŞIN</p></Reveal>
          <div className="brand-intro__grid">
            <Reveal><h2>Güneşin gücü.<br /><span className="text-soft">Doğru mühendisliğin<br />güvencesi.</span></h2></Reveal>
            <Reveal delay={80} className="brand-intro__copy">
              <p className="text-lg">Bir güneş enerjisi sistemi, yalnızca panellerden oluşmaz. Doğru analiz, iyi bir proje ve özenli bir uygulama gerektirir.</p>
              <p className="text-muted">Gebze merkezli mühendislik ve saha ekibimizle; tüketim profilinizi, saha koşullarını ve elektrik altyapınızı birlikte ele alıyoruz. İlk keşiften sistemin devreye alınmasına kadar her aşamada aynı ekiple ilerliyorsunuz.</p>
              <TextLink href="/kurumsal">Bizi daha yakından tanıyın</TextLink>
            </Reveal>
          </div>
        </Container>
      </section>

      <section className="section solutions-section" id="cozumler">
        <Container>
          <div className="editorial-heading">
            <Reveal><p className="eyebrow"><span className="section-index">02 /</span> HİZMETLERİMİZ</p><h2>İhtiyacınıza göre tasarlanır.<br /><span className="text-soft">Güvenle hayata geçirilir.</span></h2></Reveal>
            <TextLink href="/hizmetler">Tüm hizmetlerimiz</TextLink>
          </div>
          <div className="solution-cards">
            {featuredServices.map((service, i) => (
              <Reveal key={service.slug} delay={i * 70}>
                <Link href={`/hizmetler/${service.slug}`} className="solution-card">
                  <div className="solution-card__image"><Image src={service.image} alt={service.title} fill sizes="(max-width: 680px) 100vw, 33vw" /><span className="solution-card__number">0{i + 1}</span><span className="round-arrow" aria-hidden="true">↗</span></div>
                  <h3>{service.title}</h3><p>{service.summary}</p>
                </Link>
              </Reveal>
            ))}
          </div>
          <div className="additional-services">
            {[services[1], services[4], services[5]].map((service) => <Link key={service.slug} href={`/hizmetler/${service.slug}`}>{service.title}<span aria-hidden="true">↗</span></Link>)}
          </div>
        </Container>
      </section>

      <section className="section application-section" id="size-ozel">
        <Container>
          <Reveal><p className="eyebrow"><span className="section-index">03 /</span> SİZE ÖZEL ÇÖZÜMLER</p><h2>Her alanın<br /><span className="text-soft">bir enerji potansiyeli var.</span></h2></Reveal>
          <SolutionFinder />
        </Container>
      </section>

      <section className="engineering-story">
        <div className="engineering-story__photo"><Image src="/images/stock/worker-install.jpg" alt="Güneş panellerinin montaj aşamasını gösteren temsili uygulama görseli" fill sizes="(max-width: 800px) 100vw, 50vw" /><span>PROJEDEN UYGULAMAYA.</span></div>
        <div className="engineering-story__content">
          <Reveal><p className="eyebrow eyebrow--light">MÜHENDİSLİK YAKLAŞIMIMIZ</p><h2>İyi bir kurulum,<br /><span>doğru sorularla başlar.</span></h2><p>Ne kadar enerjiye ihtiyacınız var? Çatınız neye uygun? Mevcut altyapınız hazır mı? Önce bunları netleştiriyor, sonra sisteminizi tasarlıyoruz.</p></Reveal>
          <ul className="engineering-checks"><li><span>01</span>Tüketim ve saha analizi</li><li><span>02</span>Panel yerleşimi ve gölgeleme değerlendirmesi</li><li><span>03</span>Pano, koruma ve topraklama planlaması</li></ul>
          <TextLink href="/ekibimiz">Mühendislik ekibimizle tanışın</TextLink>
        </div>
      </section>

      <section className="section journey-section">
        <Container>
          <div className="editorial-heading"><Reveal><p className="eyebrow"><span className="section-index">04 /</span> NASIL ÇALIŞIYORUZ?</p><h2>İlk görüşmeden<br /><span className="text-soft">ilk üretime.</span></h2></Reveal><p className="text-muted">Her aşaması planlı.<br />Her adımında yanınızdayız.</p></div>
          <ol className="journey-grid">{steps.map((step, i) => <li key={step.title}><span className="journey-number">0{i + 1}<span aria-hidden="true">↗</span></span><p className="eyebrow">{step.detail}</p><h3>{step.title}</h3><p className="text-muted">{step.description}</p></li>)}</ol>
        </Container>
      </section>
      <FAQ index="05" />
      <CTASection />
    </>
  );
}
