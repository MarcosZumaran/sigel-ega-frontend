import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Matricula } from '../../../core/models/matricula.model';

export interface VacantesInfo {
  vacantes: number;
  ocupadas: number;
  disponibles: number;
}

@Injectable({ providedIn: 'root' })
export class MatriculaService {
  constructor(private api: ApiService) {}

  getAll(): Observable<Matricula[]> {
    return this.api.get<Matricula[]>('/matriculas');
  }

  getById(id: number): Observable<Matricula> {
    return this.api.get<Matricula>(`/matriculas/${id}`);
  }

  create(payload: Record<string, unknown>): Observable<Matricula> {
    return this.api.post<Matricula>('/matriculas', payload);
  }

  registro(payload: Record<string, unknown>): Observable<Matricula> {
    return this.api.post<Matricula>('/matriculas/registro', payload);
  }

  update(id: number, payload: Record<string, unknown>): Observable<Matricula> {
    return this.api.put<Matricula>(`/matriculas/${id}`, payload);
  }

  delete(id: number): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/matriculas/${id}`);
  }

  getVacantes(seccionId: number): Observable<VacantesInfo> {
    return this.api.get<VacantesInfo>(`/secciones/${seccionId}/vacantes`);
  }
}
