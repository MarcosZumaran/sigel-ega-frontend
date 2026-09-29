export type NivelLogro = 'AD' | 'A' | 'B' | 'C';
export type Escala = 'literal' | 'vigesimal';

export interface Area {
  id: number;
  area_padre_id?: number | null;
  tipo?: 'area' | 'competencia' | string;
  nombre: string;
  codigo_siagie?: string | null;
}

export interface TipoEvaluacion {
  id: number;
  nombre: string;
  descripcion?: string | null;
}

export interface Calificacion {
  id: number;
  matricula_id: number;
  area_id: number;
  tipo_evaluacion_id: number;
  nota?: number | null;
  nivel_logro?: NivelLogro | null;
  escala?: Escala | null;
  es_nota_c?: boolean;
  motivo_nota_c?: string | null;
  bimestre_id?: number | null;
  matricula?: import('./matricula.model').Matricula;
  area?: Area;
  tipoEvaluacion?: TipoEvaluacion;
}

export interface CalificacionPayload {
  matricula_id: number;
  area_id: number;
  tipo_evaluacion_id: number;
  nota?: number | null;
  nivel_logro?: NivelLogro | null;
  escala?: Escala | null;
  es_nota_c?: boolean;
  motivo_nota_c?: string | null;
  bimestre_id?: number | null;
}

export interface SiagieImportResult {
  message: string;
  archivo: string;
  ruta: string;
  periodo_id: number;
  seccion_id: number;
  importados: number;
  errores: string[];
}
