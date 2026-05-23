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
    'Fried Rice Index',
    'food price index',
    'cost of living',
    'urban affordability',
    'purchasing power',
    'restaurant prices',
    'macroeconomics',
    'food economics',
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}