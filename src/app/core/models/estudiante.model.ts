import { ApoderadoVinculado, Estado, Nivel } from './catalogos.model';
import { Grado } from './grado.model';
import { Matricula } from './matricula.model';

export interface Estudiante {
  id: number;
  codigo_estudiante?: string;
  dni: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento?: string;
  sexo?: 'M' | 'F';
  direccion?: string;
  telefono?: string;
  email?: string;
  nivel_id?: number;
  grado_id?: number;
  estado_id?: number;
  apoderado_id?: number;
  nivel?: Nivel;
  grado?: Grado;
  estado?: Estado;
  apoderado?: ApoderadoVinculado;
  matriculas?: Matricula[];
  matricula_activa?: Matricula;
}
