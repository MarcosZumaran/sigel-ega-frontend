import type { Area, NivelLogro } from './calificacion.model';
import type { Bimestre } from './bimestre.model';
import type { Seccion } from './seccion.model';

/** Actividad pedagógica dentro de una competencia. */
export interface Actividad {
  id: number;
  competencia_id: number;
  bimestre_id: number;
  seccion_id: number;
  titulo: string;
  descripcion?: string | null;
  fecha: string; // ISO date
  creado_por?: number | null;
  creador?: { id: number; name: string } | null;
  competencia?: Area;
  bimestre?: Bimestre;
  seccion?: Seccion;
  created_at?: string;
  updated_at?: string;
}

/** Payload para crear/editar una actividad. */
export interface ActividadPayload {
  competencia_id: number;
  bimestre_id: number;
  seccion_id: number;
  titulo: string;
  descripcion?: string | null;
  fecha: string; // YYYY-MM-DD
}

/** Fila de la grilla de calificaciones por actividad. */
export interface CalificacionActividadFila {
  matricula_id: number;
  estudiante: {
    id: number;
    dni?: string;
    nombres: string;
    apellidos: string;
  };
  nivel_logro: NivelLogro | null;
}

/** Respuesta de GET /actividades/{id}/calificaciones */
export interface ActividadCalificacionesResponse {
  actividad: Actividad;
  calificaciones: CalificacionActividadFila[];
}

/** Payload de batch (POST /actividades/{id}/calificaciones) */
export interface CalificacionActividadItem {
  matricula_id: number;
  nivel_logro: NivelLogro;
}

/** Respuesta del batch */
export interface CalificacionActividadBatchResponse {
  guardados: number;
  errores: string[];
}

/** Respuesta de GET /competencias/sugerir-nivel */
export interface SugerenciaNivelItem {
  nivel_sugerido: NivelLogro | null;
  promedio: number | null;
  total_actividades: number;
  actividades_evaluadas?: number;
  detalle: Array<{
    actividad_id: number;
    nivel: NivelLogro;
    valor_numerico: number;
  }>;
}

export interface SugerenciaNivelResponse {
  sugerencias: Record<number, SugerenciaNivelItem>; // keyed by matricula_id
}
