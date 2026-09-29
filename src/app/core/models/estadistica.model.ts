export interface AsistenciaHoy {
  presentes: number;
  tardanzas: number;
  ausentes: number;
  justificados: number;
  total: number;
}

export interface PeriodoActivo {
  id: number;
  nombre: string;
}

export interface DashboardEstadisticas {
  total_estudiantes: number;
  total_matriculas: number;
  total_secciones: number;
  periodo_activo: PeriodoActivo | null;
  asistencia_hoy: AsistenciaHoy;
}

export interface MatriculasPorNivel {
  nivel: string;
  total: number;
}

export interface LogroCneb {
  nivel: 'AD' | 'A' | 'B' | 'C';
  total: number;
}

export interface AsistenciaMensual {
  mes: string;
  presentes: number;
  ausentes: number;
  tardanzas: number;
  justificados: number;
}

export interface OcupacionSeccion {
  seccion: string;
  grado: string | null;
  ocupadas: number;
  vacantes: number;
  capacidad: number;
}
