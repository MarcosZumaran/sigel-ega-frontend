import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from  '../../../core/services/api.service';
import { Seccion, SeccionPayload } from  '../../../core/models/seccion.model';

@Injectable({ providedIn: 'root' })
export class SeccionService {
  constructor(private api: ApiService) {}

  getAll(): Observable<Seccion[]> {
    return this.api.get<Seccion[]>('/secciones');
  }

  getById(id: number): Observable<Seccion> {
    return this.api.get<Seccion>(`/secciones/${id}`);
  }

  create(data: SeccionPayload): Observable<Seccion> {
    return this.api.post<Seccion>('/secciones', data);
  }

  update(id: number, data: SeccionPayload): Observable<Seccion> {
    return this.api.put<Seccion>(`/secciones/${id}`, data);
  }

  delete(id: number): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/secciones/${id}`);
  }
}
