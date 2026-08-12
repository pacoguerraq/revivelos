'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { Job, JobType } from '@/lib/types'

interface Stage {
  label: string
  sublabel: string
}

const STAGES: Record<JobType, Stage[]> = {
  restore: [
    { label: 'Analizando tu foto', sublabel: 'Leyendo cada detalle con cuidado…' },
    { label: 'Reparando daños', sublabel: 'Eliminando rasgaduras y manchas del tiempo…' },
    { label: 'Agregando color', sublabel: 'Devolviendo la vida a cada tono de piel…' },
  ],
  animate: [
    { label: 'Analizando tu foto', sublabel: 'Identificando rostros y siluetas…' },
    { label: 'Calculando movimiento', sublabel: 'Diseñando animaciones naturales…' },
    { label: 'Generando el video', sublabel: 'Dando vida a tus recuerdos…' },
  ],
}

const WARM_MESSAGES = [
  'Cada foto guarda una historia que merece ser contada.',
  'Estamos tratando tu foto con el cuidado que merece.',
  'Pronto podrás ver a tus seres queridos como nunca antes.',
  'La magia está pasando, solo toma un momento.',
  'Trabajamos con respeto y cariño en cada imagen.',
]

const POLL_INTERVAL_MS = 2_000

export function ProgressStages({ jobId, type }: { jobId: string; type: JobType }) {
  const router = useRouter()
  const stages = STAGES[type]
  const [currentStage, setCurrentStage] = useState(0)
  const [messageIdx, setMessageIdx] = useState(0)
  const [dots, setDots] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stageTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const dotsTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Polling del estado del job
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}`)
        if (!res.ok) return
        const job: Job = await res.json()

        if (job.status === 'completed') {
          clearInterval(intervalRef.current ?? undefined)
          // Pequeña pausa para que el usuario vea la etapa final
          setTimeout(() => router.push(`/resultado/${jobId}`), 800)
        } else if (job.status === 'failed') {
          clearInterval(intervalRef.current ?? undefined)
          router.push(`/resultado/${jobId}`)
        } else if (job.status === 'processing' && currentStage === 0) {
          setCurrentStage(1)
        }
      } catch {
        // silencioso, reintentará en el siguiente tick
      }
    }

    poll()
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS)

    return () => { clearInterval(intervalRef.current ?? undefined) }
  }, [jobId, router, currentStage])

  // Avance simulado de etapas (puramente visual)
  useEffect(() => {
    stageTimerRef.current = setInterval(() => {
      setCurrentStage((s) => (s < stages.length - 1 ? s + 1 : s))
    }, 3_500)
    return () => { clearInterval(stageTimerRef.current ?? undefined) }
  }, [stages.length])

  // Rotación de mensajes cálidos
  useEffect(() => {
    const t = setInterval(() => {
      setMessageIdx((i) => (i + 1) % WARM_MESSAGES.length)
    }, 4_000)
    return () => clearInterval(t)
  }, [])

  // Animación de puntos
  useEffect(() => {
    dotsTimerRef.current = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'))
    }, 500)
    return () => { clearInterval(dotsTimerRef.current ?? undefined) }
  }, [])

  return (
    <div className="w-full max-w-md mx-auto text-center">
      {/* Spinner decorativo */}
      <div className="flex items-center justify-center mb-8">
        <div className="relative w-20 h-20">
          <div
            className="absolute inset-0 rounded-full border-4 animate-spin"
            style={{
              borderColor: 'var(--color-sepia-100)',
              borderTopColor: 'var(--color-amber)',
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-3xl">
            {type === 'restore' ? '🎨' : '🎬'}
          </div>
        </div>
      </div>

      {/* Etapas */}
      <div className="space-y-3 mb-8">
        {stages.map((stage, i) => (
          <StageRow
            key={stage.label}
            stage={stage}
            status={
              i < currentStage ? 'done' : i === currentStage ? 'active' : 'waiting'
            }
            dots={dots}
          />
        ))}
      </div>

      {/* Mensaje cálido rotativo */}
      <p
        className="text-sm italic px-4 transition-opacity duration-500"
        style={{ color: 'var(--color-bark-muted)', minHeight: '2.5rem' }}
      >
        "{WARM_MESSAGES[messageIdx]}"
      </p>
    </div>
  )
}

function StageRow({
  stage,
  status,
  dots,
}: {
  stage: Stage
  status: 'done' | 'active' | 'waiting'
  dots: string
}) {
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg text-left transition-all"
      style={{
        background:
          status === 'active'
            ? 'var(--color-amber-50)'
            : status === 'done'
              ? 'transparent'
              : 'transparent',
        border:
          status === 'active'
            ? '1px solid var(--color-sepia-200)'
            : '1px solid transparent',
        opacity: status === 'waiting' ? 0.4 : 1,
      }}
    >
      {/* Icono de estado */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm"
        style={{
          background:
            status === 'done'
              ? 'var(--color-success)'
              : status === 'active'
                ? 'var(--color-amber)'
                : 'var(--color-sepia-100)',
          color: status === 'waiting' ? 'var(--color-sepia-300)' : '#fff',
        }}
        aria-hidden
      >
        {status === 'done' ? '✓' : status === 'active' ? '●' : '○'}
      </div>

      <div>
        <p
          className="font-semibold text-sm leading-tight"
          style={{ color: status === 'waiting' ? 'var(--color-bark-muted)' : 'var(--color-bark)' }}
        >
          {stage.label}
          {status === 'active' && dots}
        </p>
        {status === 'active' && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-bark-muted)' }}>
            {stage.sublabel}
          </p>
        )}
      </div>
    </div>
  )
}
