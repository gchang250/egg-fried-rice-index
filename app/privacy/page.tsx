import type { Metadata } from 'next'
import NavBar from '@/app/components/NavBar'
import Footer from '@/app/components/Footer'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How the CanPol Index handles data and privacy.',
}

const UPDATED = 'July 18, 2026'

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: 'The short version',
    body: [
      'CanPol Index is a free, informational website. You do not need an account, and we do not ask you for any personal information to use it. We do not use cookies, we do not sell or share data, and we do not run advertising or track you across other websites.',
    ],
  },
  {
    title: 'Analytics',
    body: [
      'We use Vercel Analytics and PostHog for one purpose only: to count how many people use the app and how many views each page gets. This is anonymous and aggregate. It does not use cookies, it does not identify you, and no personal or user information is stored.',
    ],
  },
  {
    title: 'What we do not collect',
    body: [
      'We do not create user accounts, and we do not require your name, email, or any login to view any part of the site. We do not use cookies. We do not run advertising, build profiles of visitors, or track you across other websites.',
    ],
  },
  {
    title: 'Service providers',
    body: [
      'We rely on a few third parties to run the site: Vercel (hosting and analytics), PostHog (analytics), and Supabase (the database that stores the public riding statistics). They process only what is needed to serve the site, and we do not share information about you with anyone for their own marketing.',
    ],
  },
  {
    title: 'The data shown on the site',
    body: [
      'The riding statistics displayed here (rents, incomes, climate, safety, and election results) are aggregate figures published by Canadian government sources: Statistics Canada, Canada Mortgage and Housing Corporation, Environment and Climate Change Canada, and Elections Canada. They describe geographic areas, not individuals, and are not personal information about you.',
    ],
  },
  {
    title: 'Your choices',
    body: [
      'You can use the entire site without providing any personal information. Because the site uses no cookies and no cross-site tracking, there is nothing you need to opt out of, though you can still block analytics with your browser settings or an extension if you prefer.',
    ],
  },
  {
    title: 'Changes and contact',
    body: [
      'We may update this policy as the site evolves. The "last updated" date above will always reflect the current version.',
      'Questions about this policy or the data can be raised through the project’s public repository at github.com/gchang250/egg-fried-rice-index.',
    ],
  },
]

export default function PrivacyPage() {
  return (
    <main style={{ fontFamily: 'var(--font-body)', background: 'var(--color-bg)', minHeight: '100vh', color: 'var(--color-text-1)' }}>
      <NavBar />
      <div style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(3rem,6vh,5rem) 24px' }}>
        <h1 style={{ fontSize: 'clamp(32px, 4.4vw, 52px)', fontWeight: 600, lineHeight: 1.1, letterSpacing: '-.03em', margin: '0 0 .75rem' }}>
          Privacy Policy
        </h1>
        <p style={{ fontSize: 14, color: 'var(--color-text-3)', marginBottom: '3rem' }}>Last updated {UPDATED}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.25rem', maxWidth: '64ch' }}>
          {SECTIONS.map(s => (
            <section key={s.title}>
              <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-.015em', margin: '0 0 .75rem' }}>{s.title}</h2>
              {s.body.map((p, i) => (
                <p key={i} style={{ fontSize: 15.5, color: 'var(--color-text-2)', lineHeight: 1.7, margin: i < s.body.length - 1 ? '0 0 .85rem' : 0 }}>{p}</p>
              ))}
            </section>
          ))}
        </div>
      </div>
      <Footer />
    </main>
  )
}
