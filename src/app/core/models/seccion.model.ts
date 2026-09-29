import { Grado } from './grado.model';
import { Docente } from './catalogos.model';

export type Turno = 'manana' | 'tarde';

export interface Seccion {
  id: number;
  grado_id: number;
  nombre: string;
  turno: Turno;
  vacantes: number;
  docente_id: number | null;
  grado?: Grado;
  docente?: Docente | null;
}

export interface SeccionPayload {
  grado_id: number;
  nombre: string;
  turno: Turno;
  vacantes: number;
  docente_id?: number | null;
}
