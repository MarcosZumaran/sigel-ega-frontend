import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Area } from '../models/calificacion.model';

export interface AreaPayload {
  nombre: string;
  codigo_siagie?: string | null;
  area_padre_id?: number | null;
  tipo?: string;
}

@Injectable({ providedIn: 'root' })
export class AreaService {
  constructor(private api: ApiService) {}

  getAll(): Observable<Area[]> {
    return this.api.get<Area[]>('/areas');
  }

  create(data: AreaPayload): Observable<Area> {
    return this.api.post<Area>('/areas', data);
  }

  update(id: number, data: AreaPayload): Observable<Area> {
    return this.api.put<Area>(`/areas/${id}`, data);
  }
}
