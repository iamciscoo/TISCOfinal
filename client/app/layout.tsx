import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Chango } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs'
import { CurrencyProvider } from '@/lib/currency-context'
import { Toaster } from '@/components/ui/toaster'
import AuthSync from '@/components/AuthSync'
import CartRealtime from '@/components/CartRealtime'
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
  display: 'swap',
});

const chango = Chango({
  variable: "--font-chango",
  subsets: ["latin"],
  weight: "400",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "TISCOマーケット - Online Shop",
  description: "Your trusted online marketplace for quality products",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  const isValidKey = publishableKey && !publishableKey.includes('placeholder')
  
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${chango.variable} antialiased overflow-x-hidden`}
      >
        {isValidKey ? (
          <ClerkProvider>
            <CurrencyProvider>
              <AuthSync />
              <CartRealtime />
              {children}
            </CurrencyProvider>
            <Toaster />
          </ClerkProvider>
        ) : (
          <CurrencyProvider>
            {children}
          </CurrencyProvider>
        )}
      </body>
    </html>
  );
}
