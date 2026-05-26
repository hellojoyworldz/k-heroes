import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/layout/providers";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = {
  title: "K-Heroes",
  description: "문화 빅데이터 기반 한국 역사·지역 문화 인터랙티브 시뮬레이션 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <Providers>
          <SiteHeader />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
