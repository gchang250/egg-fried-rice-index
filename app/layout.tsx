import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'The Fried Rice Index',
    template: '%s | The Fried Rice Index',
  },
  description:
    'A food-based affordability index comparing fried rice prices, variety, and restaurant market patterns across cities.',
  keywords: [
    'Fried Rice Index', 'food price index', 'cost of living',
    'urban affordability', 'purchasing power', 'restaurant prices',
    'macroeconomics', 'food economics',
  ],
  openGraph: {
    title: 'The Fried Rice Index',
    description:
      'Compare fried rice prices across cities and explore what restaurant pricing reveals about affordability, variety, and urban economies.',
    url: 'https://efr-index.vercel.app',
    siteName: 'The Fried Rice Index',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'The Fried Rice Index',
    description:
      'Compare fried rice prices across cities and explore what restaurant pricing reveals about affordability, variety, and urban economies.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Instrument Serif — elegant display serif */}
        {/* Bricolage Grotesque — humanist variable grotesque */}
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Bricolage+Grotesque:opsz,wght@12..96,300;12..96,400;12..96,500;12..96,700&display=swap"
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
