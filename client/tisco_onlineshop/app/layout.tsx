import type { Metadata } from "next";
import { Geist, Geist_Mono, Chango } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs'
import { CurrencyProvider } from '@/lib/currency-context'
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
});

const chango = Chango({
  variable: "--font-chango",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "TISCOマーケット - Online Shop",
  description: "Your trusted online marketplace for quality products",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} ${chango.variable} antialiased`}
        >
          <CurrencyProvider>
            {children}
          </CurrencyProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
