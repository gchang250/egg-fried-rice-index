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
      'CanPol Index is a free, informational website. You do not need an account, and we do not ask you for personal information to browse it. We do not sell data, run advertising, or track you across other websites.',
    ],
  },
  {
    title: 'What we collect',
    body: [
      'Usage analytics. We use Vercel Analytics to understand aggregate traffic — which pages are visited and general, coarse information such as country and device type. This is collected in a privacy-preserving way: it does not use cookies to identify you and is not tied to your identity.',
      'Server logs. Our hosting provider (Vercel) automatically records standard request information, such as IP address and browser user-agent, for security and reliability. These logs are handled by Vercel and are retained only for a limited period.',
      'Information you choose to submit. If you use the "Submit" form to suggest a data correction or addition, we receive whatever you type into it. Please do not include sensitive personal information in that form.',
    ],
  },
  {
    title: 'What we do not collect',
    body: [
      'We do not create user accounts for visitors, and we do not require your name, email, or any login to view any part of the site. We do not use advertising or cross-site tracking cookies, and we do not build profiles of individual visitors.',
    ],
  },
  {
    title: 'Service providers',
    body: [
      'We rely on a small number of third parties to operate the site: Vercel (hosting and analytics) and Supabase (database). These providers process data on our behalf under their own privacy and security terms. We do not share your information with anyone for their own marketing.',
    ],
  },
  {
    title: 'The data shown on the site',
    body: [
      'The riding statistics displayed here — rents, incomes, climate, safety, and election results — are aggregate figures published by Canadian government sources (Statistics Canada, Canada Mortgage and Housing Corporation, Environment and Climate Change Canada, and Elections Canada). They describe geographic areas, not individuals, and are not personal information about you.',
    ],
  },
  {
    title: 'Your choices',
    body: [
      'You can browse the entire site without providing any personal information. You can block analytics and cookies using your browser settings or extensions without affecting how the site works.',
    ],
  },
  {
    title: 'Changes and contact',
    body: [
      'We may update this policy as the site evolves; the "last updated" date above will always reflect the current version.',
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
