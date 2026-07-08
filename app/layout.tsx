import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Canadian Poutine Index',
    template: '%s | Canadian Poutine Index',
  },
  description:
    'A food-based affordability index comparing classic poutine prices, rent burdens, and local purchasing power across Canadian communities.',
  keywords: [
    'Canadian Poutine Index', 'Poutine Index', 'food price index', 'cost of living Canada',
    'community affordability', 'purchasing power Canada', 'restaurant prices',
    'macroeconomics', 'food economics', 'CMHC rent', 'Statistics Canada',
  ],
  openGraph: {
    title: 'Canadian Poutine Index',
    description:
      'Compare classic poutine prices across Canadian communities and explore what restaurant pricing reveals about affordability, housing, and purchasing power.',
    url: 'https://efr-index.vercel.app',
    siteName: 'Canadian Poutine Index',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Canadian Poutine Index',
    description:
      'Compare classic poutine prices across Canadian communities and explore what restaurant pricing reveals about affordability, housing, and purchasing power.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Fraunces (serif for titles) and Plus Jakarta Sans (sans-serif for body) */}
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,100..900;1,9..144,100..900&family=Plus+Jakarta+Sans:wght@200..800&family=JetBrains+Mono:wght@300..500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
