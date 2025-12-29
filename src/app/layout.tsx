import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { VignetteOverlay } from "@/components/ui/VignetteOverlay";

const inter = Inter({ subsets: ["latin"] });


export const metadata: Metadata = {
  title: "Crypto Intelligence - KI-gestützte Marktanalyse",
  description: "Kostenlose Crypto News Intelligence Platform mit KI-Analyse, Market Data und mehr.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body
        className={`${inter.className} antialiased`}
      >
        <Providers>
          <VignetteOverlay />
          {children}
        </Providers>
      </body>
    </html>
  );
}
