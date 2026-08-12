interface SectionHeadingProps {
  title: string
  subtitle?: string
  /** Clases adicionales en el wrapper */
  className?: string
}

export function SectionHeading({ title, subtitle, className = '' }: SectionHeadingProps) {
  return (
    <div className={`text-center ${className}`}>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
          fontWeight: 600,
          lineHeight: 1.15,
          color: 'var(--color-bark)',
          marginBottom: subtitle ? '0.65rem' : 0,
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '1rem',
            lineHeight: 1.6,
            color: 'var(--color-bark-muted)',
            maxWidth: '58ch',
            margin: '0 auto',
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  )
}
