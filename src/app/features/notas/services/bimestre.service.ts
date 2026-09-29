import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import type { Bimestre } from '../../../core/models/bimestre.model';

@Injectable({ providedIn: 'root' })
export class BimestreService {
  constructor(private api: ApiService) {}

  getByPeriodo(periodoId?: number): Observable<Bimestre[]> {
    return this.api.get<Bimestre[]>('/bimestres', periodoId ? { periodo_id: periodoId } : undefined);
  }

  getActivo(periodoId?: number): Observable<Bimestre> {
    return this.api.get<Bimestre>('/bimestres/activo', periodoId ? { periodo_id: periodoId } : undefined);
  }

  activar(id: number): Observable<Bimestre> {
    return this.api.post<Bimestre>(`/bimestres/${id}/activar`, {});
  }

  update(id: number, data: Partial<Bimestre>): Observable<Bimestre> {
    return this.api.put<Bimestre>(`/bimestres/${id}`, data);
  }

  generar(periodoId: number, anio?: number, sobrescribir = false): Observable<{ message: string; bimestres: Bimestre[] }> {
    return this.api.post<{ message: string; bimestres: Bimestre[] }>(
      `/periodos/${periodoId}/bimestres/generar`,
      { anio, sobrescribir }
    );
  }
}
