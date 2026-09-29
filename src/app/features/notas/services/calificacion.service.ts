import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import type { Calificacion, CalificacionPayload, SiagieImportResult } from '../../../core/models/calificacion.model';

@Injectable({ providedIn: 'root' })
export class CalificacionService {
  constructor(private api: ApiService, private http: HttpClient, private auth: AuthService) {}

  getAll(params?: Record<string, string | number | boolean>): Observable<Calificacion[]> {
    return this.api.get<Calificacion[]>('/calificaciones', params);
  }

  getById(id: number): Observable<Calificacion> {
    return this.api.get<Calificacion>(`/calificaciones/${id}`);
  }

  getByMatricula(matriculaId: number): Observable<Calificacion[]> {
    return this.getAll().pipe(map((all) => all.filter((c) => c.matricula_id === matriculaId)));
  }

  create(data: CalificacionPayload): Observable<Calificacion> {
    return this.api.post<Calificacion>('/calificaciones', data);
  }

  update(id: number, data: Partial<CalificacionPayload>): Observable<Calificacion> {
    return this.api.put<Calificacion>(`/calificaciones/${id}`, data);
  }

  delete(id: number): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/calificaciones/${id}`);
  }

  importSiagie(file: File, periodoId: number, seccionId: number): Observable<SiagieImportResult> {
    const form = new FormData();
    form.append('archivo', file, file.name);
    form.append('periodo_id', String(periodoId));
    form.append('seccion_id', String(seccionId));
    return this.http.post<SiagieImportResult>(`${environment.apiUrl}/siagie/import`, form, {
      headers: { Authorization: `Bearer ${this.auth.getToken()}` },
    });
  }

  exportSiagie(seccionId: number, periodoId: number | null, formato: 'csv' | 'xlsx' | 'pdf' | 'json'): Observable<Blob> {
    const periodo = periodoId ?? '';
    return this.http.get(`${environment.apiUrl}/siagie/export/${seccionId}/${periodo}`, {
      params: { formato },
      responseType: 'blob',
      headers: { Authorization: `Bearer ${this.auth.getToken()}` },
    });
  }
}
