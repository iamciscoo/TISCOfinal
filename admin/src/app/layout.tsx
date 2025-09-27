import type { Metadata } from "next";
import { Geist, Geist_Mono, Chango } from "next/font/google";
import "./globals.css";
import AppSidebar from "@/components/AppSidebar";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { cookies } from "next/headers";

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
  title: "TISCO マーケット • Admin",
  description: "Admin dashboard for TISCO Market management",
  icons: {
    icon: "/favicon.ico",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true"
  
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${chango.variable} antialiased flex`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <SidebarProvider defaultOpen={defaultOpen}>
            <AppSidebar />
            <SidebarInset>
              <Navbar />
              <main className="flex-1 overflow-y-auto">
                {children}
              </main>
            </SidebarInset>
          </SidebarProvider>
          <Toaster />
          <SonnerToaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
