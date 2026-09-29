import { Estado } from './catalogos.model';
import { Estudiante } from './estudiante.model';
import { Periodo } from './periodo.model';
import { Seccion } from './seccion.model';

export interface TipoMatricula {
  id: number;
  nombre: string;
}

export interface Matricula {
  id: number;
  estudiante_id: number;
  seccion_id: number;
  periodo_id: number;
  tipo_matricula_id: number;
  fecha: string;
  estado_id?: number;
  observaciones?: string;
  estudiante?: Estudiante;
  seccion?: Seccion;
  periodo?: Periodo;
  tipo_matricula?: TipoMatricula;
  estado?: Estado;
}
