import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Egg Fried Rice Index',
    template: '%s | Egg Fried Rice Index',
  },
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