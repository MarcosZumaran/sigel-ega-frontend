import type { Matricula } from './matricula.model';

export type EstadoAsistencia = 'presente' | 'ausente' | 'tardia' | 'justificado';

export const ESTADOS_ASISTENCIA: EstadoAsistencia[] = ['presente', 'ausente', 'tardia', 'justificado'];

export interface Asistencia {
  id: number;
  matricula_id: number;
  fecha: string;
  estado: EstadoAsistencia;
  motivo_justificacion?: string | null;
  archivo_justificacion?: string | null;
  matricula?: Matricula;
}

export interface AsistenciaPayload {
  matricula_id: number;
  fecha: string;
  estado: EstadoAsistencia;
  motivo_justificacion?: string | null;
  archivo_justificacion?: string | null;
}

export interface BatchAsistenciaItem {
  matricula_id: number;
  fecha: string;
  estado: EstadoAsistencia;
  motivo_justificacion?: string | null;
}

export interface BatchAsistenciaResponse {
  creados: number;
  actualizados: number;
  errores: string[];
}

export interface AsistenciaFiltros {
  matricula_id?: number;
  seccion_id?: number;
  periodo_id?: number;
  desde?: string;
  hasta?: string;
  estado?: EstadoAsistencia;
}
