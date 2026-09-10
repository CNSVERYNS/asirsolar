import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./admin.css";
export const metadata: Metadata = { title: "İş Takip Paneli", robots: { index: false, follow: false }, alternates: { canonical: null } };
export default function AdminLayout({ children }: {
    children: ReactNode;
}) { return <div className="crm">{children}</div>; }
