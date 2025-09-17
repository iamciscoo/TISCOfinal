import type { Metadata, Viewport } from "next";
import { AuthProvider } from '@/hooks/use-auth'
import { CurrencyProvider } from '@/lib/currency-context'
import { Toaster } from '@/components/ui/toaster'
import AuthSync from '@/components/AuthSync'
import CartRealtime from '@/components/CartRealtime'
import { WhatsAppFloat } from '@/components/WhatsAppFloat'
import { Geist, Geist_Mono } from 'next/font/google'
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Note: Chango font will be loaded via CSS fallback since it's not available in next/font/google
// The CSS variables are maintained for compatibility

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
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link 
          href="https://fonts.googleapis.com/css2?family=Chango&display=swap" 
          rel="stylesheet"
        />
      </head>
      <body className={`antialiased overflow-x-hidden ${geistSans.variable} ${geistMono.variable}`}>
        <AuthProvider>
          <CurrencyProvider>
            <AuthSync />
            <CartRealtime />
            {children}
            <WhatsAppFloat />
          </CurrencyProvider>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
