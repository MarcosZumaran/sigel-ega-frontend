import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from  '../../../core/services/api.service';
import { Grado, GradoPayload } from  '../../../core/models/grado.model';

@Injectable({ providedIn: 'root' })
export class GradoService {
  constructor(private api: ApiService) {}

  getAll(): Observable<Grado[]> {
    return this.api.get<Grado[]>('/grados');
  }

  getById(id: number): Observable<Grado> {
    return this.api.get<Grado>(`/grados/${id}`);
  }

  create(data: GradoPayload): Observable<Grado> {
    return this.api.post<Grado>('/grados', data);
  }

  update(id: number, data: GradoPayload): Observable<Grado> {
    return this.api.put<Grado>(`/grados/${id}`, data);
  }

  delete(id: number): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/grados/${id}`);
  }
}
