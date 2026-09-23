"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ExitIntent } from "./ExitIntent";

export function SiteFrame({ children, header, footer, notice }: { children: ReactNode; header: ReactNode; footer: ReactNode; notice: ReactNode }) {
  const pathname = usePathname();
  const admin = pathname === "/admin" || pathname.startsWith("/admin/") || pathname.startsWith("/teklif/");
  return <>{!admin && header}<main id="main" tabIndex={-1}>{children}</main>{!admin && footer}{!admin && notice}{!admin && <ExitIntent key={pathname} />}</>;
}
