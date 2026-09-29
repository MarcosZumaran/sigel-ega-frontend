export interface Rol {
  id: number;
  nombre: string;
}

export interface Estado {
  id: number;
  nombre: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  rol_id: number;
  estado_id: number;
  rol?: Rol;
  estado?: Estado;
}

export interface Apoderado {
  id: number;
  uuid: string;
  padres_count?: number;
  estudiantes_count?: number;
}
