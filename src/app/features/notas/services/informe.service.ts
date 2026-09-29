import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface InformeCompetencia {
  id: number;
  nombre: string;
  bimestres: Record<string, { nivel: string | null; conclusion: string | null }>;
  nivel_final: string | null;
}

export interface InformeArea {
  id: number;
  nombre: string;
  nivel_logro_area: string | null;
  competencias: InformeCompetencia[];
}

export interface InformeProgreso {
  estudiante: { id: number; nombres: string; apellidos: string; dni: string };
  periodo: { id: number; nombre: string };
  areas: InformeArea[];
}

@Injectable({ providedIn: 'root' })
export class InformeService {
  constructor(private http: HttpClient) {}

  getInforme(estudianteId: number, periodoId?: number): Observable<InformeProgreso> {
    const params = periodoId ? `?periodo_id=${periodoId}` : '';
    return this.http.get<InformeProgreso>(`${environment.apiUrl}/estudiantes/${estudianteId}/informe-progreso${params}`);
  }

  descargarPdf(estudianteId: number, periodoId?: number): Observable<Blob> {
    const params = periodoId ? `?periodo_id=${periodoId}` : '';
    return this.http.get(`${environment.apiUrl}/estudiantes/${estudianteId}/informe-progreso.pdf${params}`, { responseType: 'blob' });
  }
}
