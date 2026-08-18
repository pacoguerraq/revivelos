import { NextResponse } from 'next/server'
import { SITE_URL as BASE_URL } from '@/lib/site'

const CONTENT = `# Revívelos

> Revívelos restaura, coloriza y anima fotos antiguas de familia usando inteligencia artificial. Es un servicio B2C mexicano de pago único por créditos, sin suscripciones. Operado por una sola persona.

Idioma del sitio: español de México. Público: personas de 45-70 años que quieren restaurar fotos familiares dañadas, muchas veces de parientes que ya fallecieron.

## Qué hace

- Restaura fotos dañadas (rasgaduras, manchas de humedad, decoloración, craquelado) y las coloriza si son en blanco y negro o sepia.
- Anima fotos ya restauradas en un video corto donde la persona parpadea, respira y sonríe suavemente. Funciona mejor con una o dos personas y rostros grandes y de frente.
- Ofrece una primera restauración gratis, en baja resolución y con marca de agua, sin necesidad de crear cuenta.

## Páginas principales

- [Inicio](${BASE_URL}/) — explicación general, ejemplos antes/después, precios y preguntas frecuentes.
- [Restaurar fotos antiguas](${BASE_URL}/restaurar-fotos-antiguas) — detalle del servicio de restauración y coloración.
- [Animar fotos en video](${BASE_URL}/animar-fotos-en-video) — detalle del servicio de animación, incluida su limitación con grupos grandes.
- [Sube tu foto](${BASE_URL}/crear) — donde empieza el proceso.
- [Acerca de](${BASE_URL}/acerca) — quién y por qué hizo este servicio.
- [Aviso de privacidad](${BASE_URL}/privacidad), [Términos y condiciones](${BASE_URL}/terminos), [Política de reembolsos](${BASE_URL}/reembolsos).

## Limitaciones honestas

- Donde el daño de una foto destruyó información por completo, el sistema reconstruye esa zona de forma conservadora a partir de lo que queda alrededor — puede no coincidir con la realidad exacta.
- El color de prendas u objetos en fotos originalmente en blanco y negro es una estimación creíble, no un hecho verificable.
- La animación en video pierde naturalidad con más de dos personas en la foto.

## Contacto

Correo: contacto.revivelos@gmail.com. No hay soporte por WhatsApp ni chat en vivo.
`

export function GET() {
  return new NextResponse(CONTENT, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
