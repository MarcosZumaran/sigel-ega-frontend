import { Injectable } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import type {
  Asistencia,
  AsistenciaFiltros,
  AsistenciaPayload,
  BatchAsistenciaItem,
  BatchAsistenciaResponse,
} from '../../../core/models/asistencia.model';
import type { Matricula } from '../../../core/models/matricula.model';

@Injectable({ providedIn: 'root' })
export class AsistenciaService {
  constructor(private api: ApiService) {}

  getAll(params?: AsistenciaFiltros): Observable<Asistencia[]> {
    return this.api.get<Asistencia[]>('/asistencias', params as Record<string, string | number> | undefined);
  }

  getById(id: number): Observable<Asistencia> {
    return this.api.get<Asistencia>(`/asistencias/${id}`);
  }

  create(data: AsistenciaPayload): Observable<Asistencia> {
    return this.api.post<Asistencia>('/asistencias', data);
  }

  update(id: number, data: Partial<AsistenciaPayload>): Observable<Asistencia> {
    return this.api.put<Asistencia>(`/asistencias/${id}`, data);
  }

  justificar(id: number, motivo: string): Observable<Asistencia> {
    return this.api.put<Asistencia>(`/asistencias/${id}`, { estado: 'justificado', motivo_justificacion: motivo });
  }

  delete(id: number): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/asistencias/${id}`);
  }

  getMatricial(
    seccionId: number,
    mes: string,
    getMatriculas: () => Observable<Matricula[]>,
  ): Observable<{ matriculas: Matricula[]; asistencias: Asistencia[] }> {
    const [y, m] = mes.split('-').map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    const desde = `${mes}-01`;
    const hasta = `${mes}-${String(lastDay).padStart(2, '0')}`;
    return forkJoin({
      todas: getMatriculas(),
      asistencias: this.getAll({ seccion_id: seccionId, desde, hasta }),
    }).pipe(
      map(({ todas, asistencias }) => ({
        matriculas: todas.filter((t) => t.seccion_id === seccionId),
        asistencias,
      })),
    );
  }

  guardarBatch(items: BatchAsistenciaItem[]): Observable<BatchAsistenciaResponse> {
    return this.api.post<BatchAsistenciaResponse>('/asistencias/batch', { items });
  }
}
