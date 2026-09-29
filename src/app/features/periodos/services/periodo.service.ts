import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from  '../../../core/services/api.service';
import { Periodo, PeriodoPayload } from  '../../../core/models/periodo.model';

@Injectable({ providedIn: 'root' })
export class PeriodoService {
  constructor(private api: ApiService) {}

  getAll(): Observable<Periodo[]> {
    return this.api.get<Periodo[]>('/periodos');
  }

  getById(id: number): Observable<Periodo> {
    return this.api.get<Periodo>(`/periodos/${id}`);
  }

  create(data: PeriodoPayload): Observable<Periodo> {
    return this.api.post<Periodo>('/periodos', data);
  }

  update(id: number, data: PeriodoPayload): Observable<Periodo> {
    return this.api.put<Periodo>(`/periodos/${id}`, data);
  }

  delete(id: number): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/periodos/${id}`);
  }
}
