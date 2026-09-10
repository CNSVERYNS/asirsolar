import Image from "next/image";
import { GalleryImage } from "@/data/gallery";

// Saf CSS ile kayan görsel şeridi — JS gerekmez, prefers-reduced-motion'a
// ve klavye/dokunmatik ile manuel kaydırmaya saygılıdır.
export function Marquee({ images }: { images: GalleryImage[] }) {
  return (
    <div className="marquee">
      <div className="marquee__track">
        {[...images, ...images].map((img, i) => (
          <div
            className="marquee__item"
            key={`${img.src}-${i}`}
            aria-hidden={i >= images.length ? "true" : undefined}
          >
            <Image
              src={img.src}
              alt={i >= images.length ? "" : img.alt}
              fill
              sizes="420px"
              style={{ objectFit: "cover" }}
            />
            <span className="marquee__label">{img.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
