import Link from "next/link";
import { Container } from "@/components/Container";
import { company } from "@/data/company";
import { navLinks } from "@/lib/site";
import { Mark } from "@/components/Mark";

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
              <h4>Navigasyon</h4>
              <ul>
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="footer-col">
              <h4>Hizmetler</h4>
              <ul>
                <li>
                  <Link href="/hizmetler/gunes-enerjisi-sistemleri">Güneş Enerjisi Sistemleri</Link>
                </li>
                <li>
                  <Link href="/hizmetler/projelendirme-ve-muhendislik">Projelendirme ve Mühendislik</Link>
                </li>
                <li>
                  <Link href="/hizmetler/kurulum-ve-devreye-alma">Kurulum ve Devreye Alma</Link>
                </li>
                <li>
                  <Link href="/hizmetler/bakim-ve-teknik-destek">Bakım ve Teknik Destek</Link>
                </li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>İletişim</h4>
              <ul>
                <li>
                  <a href={company.phoneHref}>{company.phoneDisplay}</a>
                </li>
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
            <Link href="/gizlilik-politikasi">Gizlilik Politikası</Link>
            <Link href="/cerez-politikasi">Çerez Politikası</Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
