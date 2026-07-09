import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'CanPol Index',
    template: '%s | CanPol Index',
  },
  description:
    'Cost of living, housing rent burdens, and socio-economic metrics across Canadian federal electoral ridings.',
  keywords: [
    'CanPol Index', 'Canadian Political Index', 'cost of living Canada', 'electoral ridings',
    'community affordability', 'purchasing power Canada', 'housing index',
    'macroeconomics', 'CMHC rent', 'Statistics Canada',
  ],
  openGraph: {
    title: 'CanPol Index',
    description:
      'Compare cost of living, monthly salaries, and housing rent burdens across Canadian federal electoral ridings.',
    url: 'https://canpolindex.vercel.app',
    siteName: 'CanPol Index',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'CanPol Index',
    description:
      'Compare cost of living, monthly salaries, and housing rent burdens across Canadian federal electoral ridings.',
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
