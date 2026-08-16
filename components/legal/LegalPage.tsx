import type { ReactNode } from 'react'

const ulStyle: React.CSSProperties = {
  listStyle: 'disc',
  paddingLeft: '1.25rem',
  marginTop: '0.5rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.4rem',
}

export function LegalList({ children }: { children: ReactNode }) {
  return <ul style={ulStyle}>{children}</ul>
}

interface LegalSection {
  heading: string
  body: ReactNode
}

export function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string
  updated: string
  intro?: ReactNode
  sections: LegalSection[]
}) {
  return (
    <div className="py-14 sm:py-20">
      <div className="section-wrap" style={{ maxWidth: 720, margin: '0 auto' }}>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.8rem, 4vw, 2.4rem)',
            fontWeight: 600,
            color: 'var(--color-bark)',
            marginBottom: '0.5rem',
          }}
        >
          {title}
        </h1>
        <p className="text-sm mb-10" style={{ color: 'var(--color-bark-muted)' }}>
          Última actualización: {updated}
        </p>

        {intro && (
          <p className="mb-10" style={{ color: 'var(--color-bark)', lineHeight: 1.75 }}>
            {intro}
          </p>
        )}

        <div className="flex flex-col gap-9">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: 'var(--color-bark)',
                  marginBottom: '0.75rem',
                }}
              >
                {section.heading}
              </h2>
              <div style={{ color: 'var(--color-bark)', lineHeight: 1.75, fontSize: '0.95rem' }}>
                {section.body}
              </div>
            </section>
          ))}
        </div>

        <p className="text-sm mt-12" style={{ color: 'var(--color-bark-muted)' }}>
          ¿Dudas sobre este documento? Escríbenos a{' '}
          <a href="mailto:franciscoguerraquintanilla@gmail.com" style={{ color: 'var(--color-amber-dark)', fontWeight: 600 }}>
            franciscoguerraquintanilla@gmail.com
          </a>
          .
        </p>
      </div>
    </div>
  )
}
