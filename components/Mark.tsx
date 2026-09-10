import Image from "next/image";

export function Mark({ size = 58, variant = "on-light", className = "" }: {
  size?: number;
  variant?: "on-light" | "on-dark";
  className?: string;
}) {
  return <Image src="/images/brand/asir-logo.jpeg" alt="" aria-hidden="true" width={size} height={size} sizes={`${size}px`} className={`brand-mark ${className}`} data-variant={variant} />;
}
