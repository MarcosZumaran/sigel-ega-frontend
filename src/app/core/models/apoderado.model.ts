import { EstudianteVinculado, PadreVinculado } from './catalogos.model';

export interface Apoderado {
  id: number;
  uuid: string;
  padres?: PadreVinculado[];
  estudiantes?: EstudianteVinculado[];
  padres_count?: number;
  estudiantes_count?: number;
  created_at: string;
  updated_at: string;
}
