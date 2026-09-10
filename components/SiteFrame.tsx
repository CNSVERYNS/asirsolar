"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function SiteFrame({ children, header, footer, notice }: { children: ReactNode; header: ReactNode; footer: ReactNode; notice: ReactNode }) {
  const pathname = usePathname();
  const admin = pathname === "/admin" || pathname.startsWith("/admin/");
  return <>{!admin && header}<main id="main">{children}</main>{!admin && footer}{!admin && notice}</>;
}
