import type { Metadata, Viewport } from "next";
import { ClerkProvider } from '@clerk/nextjs'
import { CurrencyProvider } from '@/lib/currency-context'
import { Toaster } from '@/components/ui/toaster'
import AuthSync from '@/components/AuthSync'
import CartRealtime from '@/components/CartRealtime'
import { WhatsAppFloat } from '@/components/WhatsAppFloat'
import "./globals.css";

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
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          {/* Load Google Fonts via CSS - this won't block the build */}
          <link 
            href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&family=Chango&display=swap" 
            rel="stylesheet"
          />
        </head>
        <body className="antialiased overflow-x-hidden">
          <CurrencyProvider>
            <AuthSync />
            <CartRealtime />
            {children}
            <WhatsAppFloat />
          </CurrencyProvider>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
