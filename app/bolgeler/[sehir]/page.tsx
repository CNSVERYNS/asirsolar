import { notFound } from "next/navigation";
import Link from "next/link";
import { localAreas, localAreaPath } from "@/data/local-areas";
import { Container } from "@/components/Container";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { pageMetadata } from "@/lib/site";
export const dynamicParams = false;
export function generateStaticParams() { return [...new Set(localAreas.map(area => area.citySlug))].map(sehir => ({ sehir })); }
type Props = { params: Promise<{ sehir: string }> };
export async function generateMetadata({ params }: Props) {
  const { sehir } = await params; const area = localAreas.find(area => area.citySlug === sehir); if (!area) notFound();
  return pageMetadata({ title: `${area.city} GES Kurulum Planlaması`, description: `${area.city} sanayi tesisleri için çatı uygunluğu, tüketim analizi ve OSB bağlantı hazırlığı. Bölgeye özel rehber ve Asır Solar mühendislik ekibi.`, path: `/bolgeler/${sehir}` });
}
export default async function CityPage({ params }: Props) {
  const { sehir } = await params; const areas = localAreas.filter(area => area.citySlug === sehir); if (!areas.length) notFound();
  return <><section className="page-hero"><Container><Breadcrumbs path={`/bolgeler/${sehir}`} /><h1>{areas[0].city} için GES planlaması</h1><p className="text-lg">Gebze merkezli ekibimizle fabrika çatısını, tüketim profilini ve elektrik altyapısını birlikte değerlendirin. OSB sınırındaki bir tesisin bağlantı süreci, bölge dışındaki bir aboneliğe göre farklı belgeler gerektirebilir.</p></Container></section><section className="section section--tight"><Container><h2>Bölgenize özel hazırlık</h2>{areas.map(area => <article className="local-area-card" key={area.slug}><h3><Link href={localAreaPath(area)}>{area.name}</Link></h3><p>{area.summary}</p><Link className="text-link" href={localAreaPath(area)}>Bölge rehberini inceleyin</Link></article>)}<div className="prose"><h2>İlk görüşmede neyi netleştiriyoruz?</h2><p>Tesisin adresi ve bağlantı kuruluşu, kullanılabilir çatı alanı, son 12 aylık tüketimi ve yatırım hedefi ilk değerlendirmeyi oluşturur. Kocaeli’nin tamamına tek bir üretim veya amortisman değeri uygulamıyoruz; kıyı koşulları, çatı yönü ve gölgelenme saha hesabına girer.</p><Link className="btn btn--primary" href="/iletisim">Sahanızı ekibimizle paylaşın</Link></div></Container></section></>;
}
