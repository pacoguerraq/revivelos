-- Se evaluó access: 'private' + URL firmada para servir el video (ver
-- AGENTS.md, "Entrega de video") pero el store de Blob de este proyecto
-- está configurado como 'public' a nivel de store y rechaza objetos
-- 'private'. Columna revertida: no llegó a usarse en ningún job real.
ALTER TABLE "Job" DROP COLUMN IF EXISTS "outputPathname";
