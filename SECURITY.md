# Vulnerabilidades conocidas y plan de remediación

Auditoría `npm audit` (2026-10-02): **4 vulnerabilidades**. `npm audit fix`
(sin `--force`) **no pudo aplicar ningún fix**: el único fix "no-force"
(@angular/router) intenta subir a Angular 22 (major, breaking) y rompe el
peer de `@swimlane/ngx-charts`. No se modificó ninguna dependencia.

## @angular/router@21.2.23 (high)

- **CVE**: SSR DoS vía matrix parameters numéricos (GHSA-ff3f-86qr-9cv3)
- **Impacto**: NULO en la práctica — el proyecto es CSR puro, sin SSR
  (nadie ejecuta el router en servidor)
- **Plan**: Se corrige solo con la actualización a Angular 22 (Fase 2)

## xlsx@0.18.5 → exceljs@4.4.0 (resuelto, Fase 2.5 — 2026-10-03)

- **CVE**: Prototype pollution + ReDoS (GHSA-4r6h-8v6p-xvw6, GHSA-5pgg-2g8v-p4x9)
- **Razón**: xlsx 0.18.5 tiene 2 vulnerabilidades sin fix disponible en su rama.
- **Reemplazo**: `exceljs` (mantenida activamente, sin vulnerabilidades conocidas).
- **Impacto**: reducción de superficie de ataque al procesar archivos de usuario.
- **Notas**: `npm install` requirió `--legacy-peer-deps` por conflicto preexistente
  de peers (`@swimlane/ngx-charts` vs Angular 21/22), no relacionado con exceljs.
  `npm audit` post-migración: 0 referencias a xlsx.

## piscina@5.x (critical)

- **CVE**: Prototype pollution → RCE (GHSA-67c8-pqhq-4rmx)
- **Impacto**: Solo en build (dev/CI), NO en runtime del navegador
- **Plan**: Actualizar a @angular/build@22 en Fase 2 (breaking change)
- **Mitigación temporal**: No exponer el build a inputs no confiables

## Optimización de bundle (Fase 2)

- `exceljs` y `jspdf` usan `await import()` dinámico en
  `asistencias-matricial.component.ts` — fuera del bundle inicial, sin acción.
- `ngx-charts` se importa eager en `estadisticas-dashboard.component.ts`
  (~191 kB), pero esa ruta es lazy-loaded (chunk propio). Evaluar reemplazo
  por librería más ligera solo si el dashboard pesa en conexiones lentas.
