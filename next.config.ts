import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// CSP sin nonces a propósito: el modo con nonce (recomendado por Next.js
// para CSP estricta) exige que TODA página se renderice de forma dinámica
// — desactiva la generación estática de la landing, que es justo la página
// que más importa que cargue rápido (tráfico de Meta ads, Core Web
// Vitals). 'unsafe-inline' en script/style es el trade-off: sigue
// bloqueando inyección de <script src> externo y fetch/conexiones a
// dominios no permitidos, que es el riesgo real de XSS en este sitio (no
// hay contenido de usuario que se renderice como HTML en ningún lado).
// style-src necesita 'unsafe-inline' de todos modos porque el sistema de
// diseño usa `style={{...}}` en vez de clases para casi todo.
// img-src incluye blob: porque PhotoUploader.tsx muestra la vista previa
// local con URL.createObjectURL() antes de subir la foto a ningún lado —
// sin blob: esa <img> nunca pinta. El navegador no lo reporta como un
// error visible en consola; solo se ve en que naturalWidth se queda en 0.
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://connect.facebook.net;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https://www.facebook.com;
  font-src 'self' data:;
  connect-src 'self' https://www.facebook.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`;

const nextConfig: NextConfig = {
  // Sin esto, Next.js bloquea los recursos de dev (chunks JS, HMR) para
  // cualquier origen que no sea localhost — la página carga pero nunca
  // hidrata cuando se accede por el túnel de ngrok, así que los onClick
  // (como abrir el selector de foto en PhotoUploader) no hacen nada.
  allowedDevOrigins: ["ducky-awning-reckless.ngrok-free.dev"],

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader.replace(/\s{2,}/g, " ").trim(),
          },
          // HSTS solo tiene efecto real servido sobre https (producción) —
          // inofensivo en dev sobre http, el navegador lo ignora ahí.
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Redundante con frame-ancestors 'none' de la CSP, pero cubre
          // navegadores viejos que no soportan esa directiva.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
