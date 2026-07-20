import type { Metadata } from 'next'
import NavBar from '@/app/components/NavBar'
import Footer from '@/app/components/Footer'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms governing use of the CanPol Index.',
}

const UPDATED = 'July 18, 2026'

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: 'Acceptance',
    body: [
      'CanPol Index is a free, informational website. By accessing or using it, you agree to these terms. If you do not agree, please do not use the site.',
    ],
  },
  {
    title: 'What the site is',
    body: [
      'CanPol Index compares cost-of-living and socio-economic indicators, such as one-bedroom rent, income, taxes, and rent burden, across Canadian federal electoral ridings. It is provided for general information and research only.',
      'Nothing on this site is financial, tax, legal, real-estate, or investment advice. Figures such as take-home pay and disposable income are simplified estimates that do not account for your individual circumstances. Do not rely on them for financial or relocation decisions; consult a qualified professional.',
    ],
  },
  {
    title: 'Accuracy and estimates',
    body: [
      'We work to base every figure on published government data and to label estimates clearly. Even so, the data may contain errors, be out of date, or rely on approximations and modelling. Rent figures reflect the average rent of occupied housing stock rather than current asking prices, and several fields (for example, tax estimates and some per-riding rents) are explicitly modelled.',
      'The site is provided "as is" and "as available", without warranties of any kind, express or implied, including accuracy, completeness, or fitness for a particular purpose.',
    ],
  },
  {
    title: 'Not affiliated with government',
    body: [
      'CanPol Index is an independent project. It is not affiliated with, endorsed by, or operated by the Government of Canada, Statistics Canada, Canada Mortgage and Housing Corporation (CMHC), Environment and Climate Change Canada, Elections Canada, or any political party.',
      'Underlying data is adapted from those public sources under their respective open data and licence terms. Such adaptations are not endorsed by, and do not imply any endorsement from, the original data providers.',
    ],
  },
  {
    title: 'Acceptable use',
    body: [
      'You may view, share, and reference the site for personal, educational, and research purposes. You agree not to misuse the site, for example by attempting to disrupt or overload it, gain unauthorized access, scrape it in a way that degrades service, or present its figures as official government statistics.',
    ],
  },
  {
    title: 'Limitation of liability',
    body: [
      'To the fullest extent permitted by law, CanPol Index and its operator are not liable for any loss or damage arising from your use of, or reliance on, the site or its data, including any decisions made based on the figures shown.',
    ],
  },
  {
    title: 'Changes, governing law, and contact',
    body: [
      'We may update the site and these terms at any time; the "last updated" date above reflects the current version, and continued use means you accept the changes.',
      'These terms are governed by the laws of Canada and the applicable province of the operator, without regard to conflict-of-law rules.',
      'Questions can be raised through the project’s public repository at github.com/gchang250/egg-fried-rice-index.',
    ],
  },
]

export default function TermsPage() {
  return (
    <main style={{ fontFamily: 'var(--font-body)', background: 'var(--color-bg)', minHeight: '100vh', color: 'var(--color-text-1)' }}>
      <NavBar />
      <div style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(3rem,6vh,5rem) 24px' }}>
        <h1 style={{ fontSize: 'clamp(32px, 4.4vw, 52px)', fontWeight: 600, lineHeight: 1.1, letterSpacing: '-.03em', margin: '0 0 .75rem' }}>
          Terms of Service
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
