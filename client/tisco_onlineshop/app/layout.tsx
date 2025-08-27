import type { Metadata } from "next";
import { Geist, Geist_Mono, Chango } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs'
import { currentUser } from '@clerk/nextjs/server'
import { CurrencyProvider } from '@/lib/currency-context'
import { Toaster } from '@/components/ui/toaster'
import AuthSync from '@/components/AuthSync'
import CartRealtime from '@/components/CartRealtime'
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await currentUser()
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          data-signed-in={user ? 'true' : 'false'}
          className={`${geistSans.variable} ${geistMono.variable} ${chango.variable} antialiased`}
        >
          <CurrencyProvider>
            <AuthSync />
            <CartRealtime />
            {children}
          </CurrencyProvider>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
