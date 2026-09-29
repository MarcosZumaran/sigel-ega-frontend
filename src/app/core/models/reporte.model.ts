import type { Periodo } from './periodo.model';
import type { Seccion } from './seccion.model';

export type TipoReporte = 'auxiliar' | 'asistencia' | 'matriculas' | 'notas' | 'general';
export type FormatoReporte = 'pdf' | 'excel' | 'csv';
export type EstadoReporte = 'generado' | 'cacheado' | 'expirado';

export const TIPOS_REPORTE: TipoReporte[] = ['auxiliar', 'asistencia', 'matriculas', 'notas', 'general'];

export interface Reporte {
  id: number;
  tipo: TipoReporte;
  periodo_id?: number | null;
  seccion_id?: number | null;
  formato: FormatoReporte;
  estado: EstadoReporte;
  ruta_archivo?: string | null;
  hash?: string | null;
  generado_por?: number | null;
  expira_en?: string | null;
  created_at: string;
  periodo?: Periodo;
  seccion?: Seccion;
  autor?: { id: number; name: string };
}

export interface ReportePayload {
  tipo: TipoReporte;
  periodo_id?: number | null;
  seccion_id?: number | null;
  formato: FormatoReporte;
}

export interface PaginatedReportes {
  data: Reporte[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}
