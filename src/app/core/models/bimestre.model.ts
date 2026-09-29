export interface Bimestre {
  id: number;
  periodo_id: number;
  numero: number;
  nombre: string;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  activo: boolean;
}
