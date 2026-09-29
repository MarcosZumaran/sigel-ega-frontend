import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Estudiante } from '../../../core/models/estudiante.model';

@Injectable({ providedIn: 'root' })
export class EstudianteService {
  constructor(private api: ApiService) {}

  getAll(): Observable<Estudiante[]> {
    return this.api.get<Estudiante[]>('/estudiantes');
  }

  getById(id: number): Observable<Estudiante> {
    return this.api.get<Estudiante>(`/estudiantes/${id}`);
  }

  create(payload: Record<string, unknown>): Observable<Estudiante> {
    return this.api.post<Estudiante>('/estudiantes', payload);
  }

  update(id: number, payload: Record<string, unknown>): Observable<Estudiante> {
    return this.api.put<Estudiante>(`/estudiantes/${id}`, payload);
  }

  delete(id: number): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/estudiantes/${id}`);
  }
}
