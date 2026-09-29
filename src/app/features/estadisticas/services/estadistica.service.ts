import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  AsistenciaMensual,
  DashboardEstadisticas,
  LogroCneb,
  MatriculasPorNivel,
  OcupacionSeccion,
} from '../../../core/models/estadistica.model';

@Injectable({ providedIn: 'root' })
export class EstadisticaService {
  constructor(private api: ApiService) {}

  getDashboard(): Observable<DashboardEstadisticas> {
    return this.api.get<DashboardEstadisticas>('/estadisticas/dashboard');
  }

  getMatriculasPorNivel(periodoId?: number): Observable<MatriculasPorNivel[]> {
    return this.api.get<MatriculasPorNivel[]>('/estadisticas/matriculas-por-nivel', {
      ...(periodoId ? { periodo_id: periodoId } : {}),
    });
  }

  getLogrosCneb(periodoId?: number, seccionId?: number): Observable<LogroCneb[]> {
    return this.api.get<LogroCneb[]>('/estadisticas/logros-cneb', {
      ...(periodoId ? { periodo_id: periodoId } : {}),
      ...(seccionId ? { seccion_id: seccionId } : {}),
    });
  }

  getAsistenciaMensual(periodoId: number, anio?: number): Observable<AsistenciaMensual[]> {
    return this.api.get<AsistenciaMensual[]>('/estadisticas/asistencia-mensual', {
      periodo_id: periodoId,
      ...(anio ? { anio } : {}),
    });
  }

  getOcupacionSecciones(periodoId: number): Observable<OcupacionSeccion[]> {
    return this.api.get<OcupacionSeccion[]>('/estadisticas/ocupacion-secciones', {
      periodo_id: periodoId,
    });
  }
}
