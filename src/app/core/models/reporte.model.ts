import type { Periodo } from './periodo.model';
import type { Seccion } from './seccion.model';

export type TipoReporte = 'auxiliar' | 'asistencia' | 'matriculas' | 'notas' | 'general';
export type FormatoReporte = 'pdf' | 'excel' | 'csv';
export type EstadoReporte = 'generado' | 'cacheado' | 'expirado';

export const TIPOS_REPORTE: TipoReporte[] = ['auxiliar', 'asistencia', 'matriculas', 'notas', 'general'];

export type TipoReporteOficial = 'acta-evaluacion' | 'nomina-matricula' | 'orden-merito';

export interface ItemCategoriaReporte {
  tipo: TipoReporte | TipoReporteOficial;
  titulo: string;
  descripcion: string;
  icono: string;
  flujo: 'generar' | 'directo';
}

export interface CategoriaReporte {
  titulo: string;
  items: ItemCategoriaReporte[];
}

export const CATEGORIAS_REPORTES: CategoriaReporte[] = [
  {
    titulo: 'Oficiales',
    items: [
      { tipo: 'acta-evaluacion', titulo: 'Acta de Evaluación', descripcion: 'Niveles de logro por estudiante y competencia', icono: 'verified', flujo: 'directo' },
      { tipo: 'nomina-matricula', titulo: 'Nómina de Matrícula', descripcion: 'Estudiantes matriculados por sección', icono: 'list_alt', flujo: 'directo' },
      { tipo: 'orden-merito', titulo: 'Orden de Mérito', descripcion: 'Ranking por promedio en el grado', icono: 'emoji_events', flujo: 'directo' },
    ],
  },
  {
    titulo: 'Académicos',
    items: [
      { tipo: 'auxiliar', titulo: 'Registro Auxiliar', descripcion: 'Evaluaciones del docente por sección', icono: 'assignment', flujo: 'generar' },
      { tipo: 'notas', titulo: 'Reporte de Notas', descripcion: 'Calificaciones por período y sección', icono: 'grade', flujo: 'generar' },
      { tipo: 'matriculas', titulo: 'Reporte de Matrículas', descripcion: 'Matrículas por período', icono: 'app_registration', flujo: 'generar' },
    ],
  },
  {
    titulo: 'Asistencia',
    items: [
      { tipo: 'asistencia', titulo: 'Reporte de Asistencia', descripcion: 'Asistencias por fecha y sección', icono: 'fact_check', flujo: 'generar' },
      { tipo: 'general', titulo: 'Reporte General', descripcion: 'Resumen institucional del período', icono: 'description', flujo: 'generar' },
    ],
  },
];

export interface Reporte {
  id: number;
  tipo: TipoReporte;
  periodo_id?: number | null;
  seccion_id?: number | null;
  formato: FormatoReporte;
  estado: EstadoReporte;
  ruta_archivo?: string | null;
  hash?: string | null;
  generado_por?: number | null;
  expira_en?: string | null;
  created_at: string;
  periodo?: Periodo;
  seccion?: Seccion;
  autor?: { id: number; name: string };
}

export interface ReportePayload {
  tipo: TipoReporte;
  periodo_id?: number | null;
  seccion_id?: number | null;
  formato: FormatoReporte;
}

export interface PaginatedReportes {
  data: Reporte[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}
