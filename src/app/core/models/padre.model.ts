import { ApoderadoVinculado } from './catalogos.model';

export interface Padre {
  id: number;
  dni: string;
  nombres: string;
  apellidos: string;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  ocupacion: string | null;
  estado_id: number | null;
  apoderado_id: number | null;
  apoderado?: ApoderadoVinculado | null;
}

export interface PadrePayload {
  dni: string;
  nombres: string;
  apellidos: string;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  ocupacion?: string | null;
  estado_id?: number | null;
}
