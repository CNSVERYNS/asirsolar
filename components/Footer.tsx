import Link from "next/link";
import { Container } from "@/components/Container";
import { company } from "@/data/company";
import { navLinks } from "@/lib/site";
import { Mark } from "@/components/Mark";
import { PrivacySettingsButton } from "./CookieBanner";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <Container>
        <div className="site-footer__top">
          <div className="site-footer__brand">
            <Mark size={86} variant="on-dark" className="site-footer__mark" />
            <p className="site-footer__wordmark">
              ASIR
              <br />
              SOLAR
            </p>
            <p className="site-footer__tag">
              Güneş enerjisi sistemlerini projelendiriyor, kuruyor ve devreye
              alıyoruz.
            </p>
          </div>

          <div className="site-footer__cols">
            <div className="footer-col">
              <h2>Navigasyon</h2>
              <ul>
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
              <Link href="/hesaplayici">GES hesaplama</Link><br /><Link href="/catima-gunes-paneli-nasil-yaptiririm">Çatı GES kurulum rehberi</Link><br /><Link href="/bolgeler">Bölge ve OSB rehberi</Link>
            </div>

            <div className="footer-col">
              <h2>Hizmetler</h2>
              <ul>
                <li>
                  <Link href="/hizmetler/gunes-enerjisi">Güneş Enerjisi Sistemleri</Link>
                </li>
                <li>
                  <Link href="/hizmetler/muhendislik">Projelendirme ve Mühendislik</Link>
                </li>
                <li>
                  <Link href="/hizmetler/kurulum">Kurulum ve Devreye Alma</Link>
                </li>
                <li>
                  <Link href="/hizmetler/bakim">Bakım ve Teknik Destek</Link>
                </li>
              </ul>
            </div>

            <div className="footer-col">
              <h2>İletişim</h2>
              <ul>
                <li>
                  <a href={company.phoneHref}>{company.phoneDisplay}</a>
                </li>
                <li>{company.workingHours}</li>
                <li>
                  <a href={`mailto:${company.generalEmail}`}>
                    {company.generalEmail}
                  </a>
                </li>
                <li>
                  <a
                    href={company.address.mapsHref}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {company.address.full}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="site-footer__bottom">
          <p>
            © {year} {company.legalName}
          </p>
          <div className="site-footer__legal">
            <Link href="/kvkk">KVKK</Link>
            <Link href="/gizlilik">Gizlilik Politikası</Link>
            <Link href="/cerezler">Çerez Politikası</Link>
            <PrivacySettingsButton />
          </div>
        </div>
      </Container>
    </footer>
  );
}
