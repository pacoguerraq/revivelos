import { Resend } from 'resend'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} no está definida. Agrégala a .env.local antes de arrancar.`)
  }
  return value
}

let resendClient: Resend | null = null
function getResend(): Resend {
  if (!resendClient) {
    resendClient = new Resend(requireEnv('AUTH_RESEND_KEY'))
  }
  return resendClient
}

function magicLinkHtml(url: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
  <body style="margin:0; padding:0; background-color:#FAF6F0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF6F0; padding:40px 20px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#FDF9F4; border:1px solid #EDE0CC; border-radius:16px; max-width:480px; width:100%;">
            <tr>
              <td style="padding:36px 32px 24px 32px; text-align:center;">
                <div style="font-size:22px; font-weight:700; color:#3D2B1F; font-family:Georgia,'Times New Roman',serif;">
                  Revívelos
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 8px 32px;">
                <h1 style="margin:0 0 16px 0; font-size:20px; color:#3D2B1F; font-family:Georgia,'Times New Roman',serif; text-align:center;">
                  Entra a tu cuenta
                </h1>
                <p style="margin:0 0 24px 0; font-size:15px; line-height:1.6; color:#7A5C45; text-align:center;">
                  Toca el botón para entrar a Revívelos. Este enlace es válido por 24 horas y solo se puede usar una vez.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px 32px; text-align:center;">
                <a href="${url}" style="display:inline-block; background-color:#D4850A; color:#ffffff; text-decoration:none; font-weight:600; font-size:16px; padding:14px 32px; border-radius:9999px;">
                  Entrar a Revívelos
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px 32px; border-top:1px solid #EDE0CC; padding-top:20px;">
                <p style="margin:0; font-size:13px; line-height:1.5; color:#C9A87C; text-align:center;">
                  Si no revisas tu bandeja de entrada, busca en spam o correo no deseado. Si tú no pediste este correo, puedes ignorarlo con confianza.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim()
}

// Reemplaza el sendVerificationRequest por defecto del provider Email de
// Auth.js (plantilla en inglés) por un correo de marca en español.
export async function sendMagicLinkEmail(params: { identifier: string; url: string }): Promise<void> {
  const { identifier, url } = params
  const from = requireEnv('EMAIL_FROM')

  const { error } = await getResend().emails.send({
    from,
    to: identifier,
    subject: 'Tu enlace para entrar a Revívelos',
    html: magicLinkHtml(url),
  })

  if (error) {
    throw new Error(`No se pudo enviar el correo de acceso: ${error.message}`)
  }
}
