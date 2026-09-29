export interface Nivel {
  id: number;
  nombre: string;
  descripcion?: string | null;
}

export interface Estado {
  id: number;
  nombre: string;
  tipo_aplica?: string | null;
}

export interface Docente {
  id: number;
  dni: string;
  nombres: string;
  apellidos: string;
  especialidad?: string | null;
}

export interface ApoderadoVinculado {
  id: number;
  uuid: string;
  padres_count?: number;
  estudiantes_count?: number;
  padres?: PadreVinculado[];
  estudiantes?: EstudianteVinculado[];
}

export interface PadreVinculado {
  id: number;
  dni: string;
  nombres: string;
  apellidos: string;
}

export interface EstudianteVinculado {
  id: number;
  dni: string;
  nombres: string;
  apellidos: string;
}
