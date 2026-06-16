import "./globals.css";
import type { Metadata } from "next";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Toko MF — Sistem Manajemen Stok",
  description: "Sistem manajemen stok barang Toko Musthofa Farras",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
