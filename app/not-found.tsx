import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { PrimaryButton } from "@/components/Button";

export const metadata: Metadata = {
  title: "Sayfa Bulunamadı",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <Container>
      <div className="not-found">
        <p className="label">404</p>
        <h1 style={{ marginTop: "var(--sp-3)", marginBottom: "var(--sp-5)" }}>
          Aradığınız sayfa burada değil.
        </h1>
        <PrimaryButton href="/">Ana Sayfaya Dön</PrimaryButton>
      </div>
    </Container>
  );
}
