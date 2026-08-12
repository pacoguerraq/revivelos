'use client'

import { useState } from 'react'

interface AccordionItem {
  question: string
  answer: string
}

export function Accordion({ items }: { items: AccordionItem[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  return (
    <div
      style={{
        borderTop: '1px solid var(--color-sepia-100)',
        borderBottom: '1px solid var(--color-sepia-100)',
      }}
    >
      {items.map((item, i) => {
        const isOpen = openIdx === i
        const isHovered = hoverIdx === i

        return (
          <div
            key={item.question}
            style={{ borderBottom: i < items.length - 1 ? '1px solid var(--color-sepia-100)' : undefined }}
          >
            <button
              type="button"
              onClick={() => setOpenIdx(isOpen ? null : i)}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              className="w-full flex items-center justify-between gap-4 text-left"
              style={{
                padding: '20px 0',
                cursor: 'pointer',
                background: isHovered && !isOpen ? 'transparent' : 'transparent',
              }}
              aria-expanded={isOpen}
            >
              <span
                className="font-semibold text-base leading-snug transition-colors"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: isOpen
                    ? 'var(--color-amber-dark)'
                    : isHovered
                      ? 'var(--color-amber)'
                      : 'var(--color-bark)',
                  transition: 'color 150ms ease',
                }}
              >
                {item.question}
              </span>

              <span
                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
                style={{
                  background: isOpen
                    ? 'var(--color-amber)'
                    : isHovered
                      ? 'var(--color-sepia-200)'
                      : 'var(--color-sepia-100)',
                  color: isOpen ? '#fff' : 'var(--color-bark-muted)',
                  transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                  transition: 'background 150ms ease, transform 200ms ease',
                  fontSize: '1.2rem',
                  lineHeight: 1,
                }}
                aria-hidden
              >
                +
              </span>
            </button>

            <div
              style={{
                overflow: 'hidden',
                maxHeight: isOpen ? 400 : 0,
                opacity: isOpen ? 1 : 0,
                transition: 'max-height 250ms ease, opacity 200ms ease',
              }}
            >
              <p
                className="text-sm leading-relaxed"
                style={{ color: 'var(--color-bark-muted)', paddingBottom: 20, paddingRight: 40 }}
              >
                {item.answer}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
