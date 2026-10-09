import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import type {
  Actividad,
  ActividadCalificacionesResponse,
  ActividadPayload,
  CalificacionActividadBatchResponse,
  CalificacionActividadItem,
  SugerenciaNivelResponse,
} from '../../../core/models/actividad.model';

@Injectable({ providedIn: 'root' })
export class ActividadService {
  constructor(private api: ApiService) {}

  /** Lista actividades con filtros opcionales. */
  getAll(filters?: {
    competencia_id?: number;
    bimestre_id?: number;
    seccion_id?: number;
  }): Observable<Actividad[]> {
    const params: Record<string, string | number | boolean> = {};
    if (filters?.competencia_id) params['competencia_id'] = filters.competencia_id;
    if (filters?.bimestre_id) params['bimestre_id'] = filters.bimestre_id;
    if (filters?.seccion_id) params['seccion_id'] = filters.seccion_id;
    return this.api.get<Actividad[]>('/actividades', params);
  }

  getById(id: number): Observable<Actividad> {
    return this.api.get<Actividad>(`/actividades/${id}`);
  }

  create(data: ActividadPayload): Observable<Actividad> {
    return this.api.post<Actividad>('/actividades', data);
  }

  update(id: number, data: Partial<ActividadPayload>): Observable<Actividad> {
    return this.api.put<Actividad>(`/actividades/${id}`, data);
  }

  delete(id: number): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/actividades/${id}`);
  }

  restore(id: number): Observable<Actividad> {
    return this.api.post<Actividad>(`/actividades/${id}/restore`, {});
  }

  /** Lista las calificaciones de todos los alumnos en una actividad. */
  getCalificaciones(actividadId: number): Observable<ActividadCalificacionesResponse> {
    return this.api.get<ActividadCalificacionesResponse>(`/actividades/${actividadId}/calificaciones`);
  }

  /** Guarda en lote las calificaciones de una actividad. */
  guardarCalificaciones(
    actividadId: number,
    items: CalificacionActividadItem[]
  ): Observable<CalificacionActividadBatchResponse> {
    return this.api.post<CalificacionActividadBatchResponse>(
      `/actividades/${actividadId}/calificaciones`,
      { items }
    );
  }

  /** Calcula el nivel sugerido de una competencia para todos los alumnos de una sección. */
  sugerirNivel(
    seccionId: number,
    competenciaId: number,
    bimestreId: number
  ): Observable<SugerenciaNivelResponse> {
    return this.api.get<SugerenciaNivelResponse>('/competencias/sugerir-nivel', {
      seccion_id: seccionId,
      competencia_id: competenciaId,
      bimestre_id: bimestreId,
    });
  }
}
