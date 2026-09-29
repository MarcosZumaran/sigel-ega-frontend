import { Nivel } from './catalogos.model';

export interface Grado {
  id: number;
  nivel_id: number;
  nombre: string;
  nivel?: Nivel;
}

export interface GradoPayload {
  nivel_id: number;
  nombre: string;
}
