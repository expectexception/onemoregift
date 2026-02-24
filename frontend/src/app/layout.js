import localFont from "next/font/local";
import "./globals.css";
import { Teko, Inter } from 'next/font/google'
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Toaster } from "@/components/ui/toaster"
import AppProviders from "./components/AppProviders";

// Display font for headings
const teko = Teko({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-teko',
})

// Body font for readability
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "OneMoreGift - Premium Giveaways, Real Winners",
  description: "Join curated giveaway contests, win real rewards, and track your entries in one premium experience.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${teko.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <AppProviders>
          {children}
          <Toaster />
        </AppProviders>
      </body>
    </html>
  );
}
