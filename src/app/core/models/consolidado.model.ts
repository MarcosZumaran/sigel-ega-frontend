import { Area } from './calificacion.model';

export interface NivelConsolidado {
  competencia_id: number;
  propuesto: 'AD' | 'A' | 'B' | 'C' | null;
  guardado: 'AD' | 'A' | 'B' | 'C' | null;
  conclusion: string | null;
}

export interface EstudianteConsolidado {
  estudiante: {
    id: number;
    dni: string;
    nombres: string;
    apellidos: string;
  };
  matricula_id: number;
  niveles: NivelConsolidado[];
}

export interface AreaConsolidado extends Area {
  areas_hijas: Area[];
}

export interface ConsolidadoResponse {
  areas: AreaConsolidado[];
  bimestre: {
    id: number;
    numero: number;
    nombre: string;
    activo: boolean;
  };
  estudiantes: EstudianteConsolidado[];
}

export interface ConsolidadoItem {
  matricula_id: number;
  competencia_id: number;
  bimestre_id?: number | null;
  nivel: 'AD' | 'A' | 'B' | 'C';
  conclusion?: string | null;
}

export interface ConsolidadoBatchResponse {
  guardados: number;
}
