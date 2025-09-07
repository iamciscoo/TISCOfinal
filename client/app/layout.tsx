import type { Metadata, Viewport } from "next";
import { ClerkProvider } from '@clerk/nextjs'
import { CurrencyProvider } from '@/lib/currency-context'
import { Toaster } from '@/components/ui/toaster'
import AuthSync from '@/components/AuthSync'
import CartRealtime from '@/components/CartRealtime'
import { WhatsAppFloat } from '@/components/WhatsAppFloat'
import "./globals.css";

// Using system fonts for now due to Google Fonts connectivity issues
const fontVariables = {
  '--font-geist-sans': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  '--font-geist-mono': 'ui-monospace, SFMono-Regular, "SF Mono", monospace',
  '--font-chango': 'Georgia, "Times New Roman", serif'
};

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
        <body
          className="antialiased overflow-x-hidden"
          style={fontVariables as React.CSSProperties}
        >
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
