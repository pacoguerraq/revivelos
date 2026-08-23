import { createHash } from 'crypto'

const PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID
const CAPI_TOKEN = process.env.META_CAPI_TOKEN
// Opcional, solo para desarrollo: código de la pestaña "Eventos de prueba"
// de Events Manager (rota cada vez que se abre esa pestaña). Sin esto, un
// evento de CAPI es real y se procesa normal, pero NUNCA aparece en Eventos
// de prueba — solo en el resumen normal de Eventos/Diagnóstico, con
// retraso de minutos a horas. No dejar definida en producción: un
// test_event_code marca el evento como prueba y Meta lo excluye de la
// optimización de campañas.
const TEST_EVENT_CODE = process.env.META_CAPI_TEST_EVENT_CODE
const GRAPH_URL = 'https://graph.facebook.com/v21.0'

function sha256(value: string): string {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

// Dispara el evento Purchase server-side vía Conversions API. Sin esto el
// algoritmo de Meta optimiza a ciegas (solo ve tráfico, nunca compras) y el
// CPA nunca baja — ver AGENTS.md. `eventId` debe coincidir con el que se
// use en un futuro evento de navegador equivalente, para que Meta lo
// deduplique en vez de contar la misma compra dos veces.
export async function sendPurchaseCapiEvent(params: {
  eventId: string
  email: string
  valueMxn: number
  eventSourceUrl: string
}): Promise<void> {
  if (!PIXEL_ID || !CAPI_TOKEN) {
    console.log('Meta CAPI no configurado (falta NEXT_PUBLIC_FB_PIXEL_ID o META_CAPI_TOKEN) — se omite Purchase')
    return
  }

  try {
    const res = await fetch(`${GRAPH_URL}/${PIXEL_ID}/events?access_token=${CAPI_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: [
          {
            event_name: 'Purchase',
            event_time: Math.floor(Date.now() / 1000),
            event_id: params.eventId,
            event_source_url: params.eventSourceUrl,
            action_source: 'website',
            user_data: {
              em: [sha256(params.email)],
            },
            custom_data: {
              currency: 'MXN',
              value: params.valueMxn,
            },
          },
        ],
        ...(TEST_EVENT_CODE ? { test_event_code: TEST_EVENT_CODE } : {}),
      }),
    })
    if (!res.ok) {
      console.error('Meta CAPI Purchase respondió con error', res.status, await res.text())
    }
  } catch (error) {
    // Best-effort: un fallo aquí nunca debe afectar la acreditación de
    // créditos, que ya se confirmó antes de llamar a esta función.
    console.error('No se pudo enviar el evento Purchase a Meta CAPI', error)
  }
}
