import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: 'Egg Fried Rice Index',
  description:
    'A purchasing power comparison index using the price of egg fried rice across cities.',
  keywords: [
    'Egg Fried Rice Index',
    'PPP rice index',
    'food price index',
    'cost of living',
    'purchasing power parity',
    'restaurant prices',
  ],
  openGraph: {
    title: 'Egg Fried Rice Index',
    description:
      'Compare the price of egg fried rice across cities as a simple purchasing power index.',
    url: 'https://efr-index.vercel.app',
    siteName: 'Egg Fried Rice Index',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Egg Fried Rice Index',
    description:
      'Compare the price of egg fried rice across cities as a simple purchasing power index.',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
