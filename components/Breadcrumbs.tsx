import Link from "next/link";
import { breadcrumbsFor } from "@/lib/seo-catalog";
import { breadcrumbSchema } from "@/lib/schema-builders";
import { JsonLd } from "./JsonLd";
export function Breadcrumbs({ path, title }: { path: string; title?: string }) {
  const items = breadcrumbsFor(path, title);
  return <><JsonLd data={breadcrumbSchema(items)} /><nav aria-label="Sayfa konumu" className="breadcrumbs"><ol>{items.map((item, index) => <li key={item.path}>{index === items.length - 1 ? <span aria-current="page">{item.name}</span> : <Link href={item.path}>{item.name}</Link>}</li>)}</ol></nav></>;
}
