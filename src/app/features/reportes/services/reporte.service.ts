import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { environment } from '../../../../environments/environment';
import type { Reporte, ReportePayload, PaginatedReportes } from '../../../core/models/reporte.model';

@Injectable({ providedIn: 'root' })
export class ReporteService {
  constructor(private api: ApiService, private http: HttpClient) {}

  getAll(params?: Record<string, string | number | boolean>): Observable<PaginatedReportes> {
    return this.api.get<PaginatedReportes>('/reportes', params);
  }

  getById(id: number): Observable<Reporte> {
    return this.api.get<Reporte>(`/reportes/${id}`);
  }

  generar(data: ReportePayload): Observable<Reporte> {
    return this.api.post<Reporte>('/reportes', data);
  }

  descargar(id: number): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/reportes/${id}/descargar`, { responseType: 'blob' });
  }

  descargarOficial(
    tipo: 'acta-evaluacion' | 'nomina-matricula' | 'orden-merito',
    params: Record<string, string | number | boolean>
  ): Observable<Blob> {
    const qs = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    ).toString();
    return this.http.get(`${environment.apiUrl}/reportes/${tipo}?${qs}`, { responseType: 'blob' });
  }

  delete(id: number): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/reportes/${id}`);
  }
}
