import type { NivelLogro } from '../models/calificacion.model';

export function notaANivel(nota: number): NivelLogro {
  if (nota >= 18) return 'AD';
  if (nota >= 14) return 'A';
  if (nota >= 11) return 'B';
  return 'C';
}

export function nivelDescripcion(nivel: string): string {
  const map: Record<string, string> = {
    AD: 'Logro Destacado (18-20)',
    A: 'Logro Esperado (14-17)',
    B: 'En Proceso (11-13)',
    C: 'En Inicio (0-10)',
  };
  return map[nivel] ?? '';
}

export function nivelEsperado(nota: number | null | undefined): NivelLogro | null {
  if (nota === null || nota === undefined || isNaN(Number(nota))) return null;
  return notaANivel(Number(nota));
}

export function esCoherente(nota: number | null | undefined, nivel: NivelLogro | null | undefined): boolean {
  const esperado = nivelEsperado(nota);
  if (!esperado || !nivel) return true;
  return esperado === nivel;
}
