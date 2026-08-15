import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sin esto, Next.js bloquea los recursos de dev (chunks JS, HMR) para
  // cualquier origen que no sea localhost — la página carga pero nunca
  // hidrata cuando se accede por el túnel de ngrok, así que los onClick
  // (como abrir el selector de foto en PhotoUploader) no hacen nada.
  allowedDevOrigins: ["ducky-awning-reckless.ngrok-free.dev"],
};

export default nextConfig;
