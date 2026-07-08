import type { Metadata } from "next";
import { Inter, Exo_2, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";
import { BgFx } from "@/components/bg-fx";
import { Logo } from "@/components/logo";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
  display: "swap",
});

const exo2 = Exo_2({
  subsets: ["latin", "cyrillic"],
  variable: "--font-display",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "pressstart — трекер пройденных игр",
  description:
    "pressstart — красивый трекер пройденных игр. Собирай библиотеку, оценивай игры по критериям: атмосфера, сюжет, геймплей, графика, звук.",
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%2306b6d4'/%3E%3Cpath d='M13 10l9 6-9 6z' fill='%23030b12'/%3E%3C/svg%3E",
        type: "image/svg+xml",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ru"
      className={`${inter.variable} ${exo2.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-bg text-fg">
        <Providers>
          <BgFx />
          <Navbar />
          <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6">
            {children}
          </main>
          <footer className="relative border-t border-border/60 py-10 text-center">
            <div className="mx-auto flex flex-col items-center gap-3">
              <Logo size={28} />
              <p className="font-mono text-xs text-muted">
                твоя игровая библиотека · press start to play
              </p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
