export interface Periodo {
  id: number;
  nombre: string;
  anio: number;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  activo: boolean;
}

export interface PeriodoPayload {
  nombre: string;
  anio: number;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  activo?: boolean;
}
