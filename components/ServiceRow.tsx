import Link from "next/link";
import { Service } from "@/data/services";
import { serviceIcons } from "@/components/Icons";

export function ServiceRow({ service }: { service: Service }) {
  const Icon = serviceIcons[service.icon];
  return (
    <Link href={`/hizmetler/${service.slug}`} className="service-row">
      <span className="service-row__icon" aria-hidden="true">
        <Icon size={20} />
      </span>
      <span>
        <span className="service-row__title">{service.title}</span>
        <span className="service-row__summary">{service.summary}</span>
      </span>
      <span className="service-row__arrow" aria-hidden="true">
        ↗
      </span>
    </Link>
  );
}
