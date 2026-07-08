import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "pressstart — трекер пройденных игр",
  description:
    "pressstart — красивый трекер пройденных игр. Собирай библиотеку, оценивай игры по критериям: атмосфера, сюжет, геймплей, графика, звук.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ru"
      className={`${inter.variable} ${spaceGrotesk.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-bg text-fg">
        <Providers>
          <Navbar />
          <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6">
            {children}
          </main>
          <footer className="border-t border-border py-8 text-center text-sm text-muted">
            <p>
              <span className="font-display font-semibold text-fg">
                press
              </span>
              <span className="font-display font-semibold text-accent">
                start
              </span>{" "}
              · твоя игровая библиотека
            </p>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
