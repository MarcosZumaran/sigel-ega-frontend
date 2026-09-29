import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from  '../../../core/services/api.service';
import { Padre, PadrePayload } from  '../../../core/models/padre.model';

@Injectable({ providedIn: 'root' })
export class PadreService {
  constructor(private api: ApiService) {}

  getAll(): Observable<Padre[]> {
    return this.api.get<Padre[]>('/padres');
  }

  getById(id: number): Observable<Padre> {
    return this.api.get<Padre>(`/padres/${id}`);
  }

  create(data: PadrePayload): Observable<Padre> {
    return this.api.post<Padre>('/padres', data);
  }

  update(id: number, data: PadrePayload): Observable<Padre> {
    return this.api.put<Padre>(`/padres/${id}`, data);
  }

  delete(id: number): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/padres/${id}`);
  }
}
