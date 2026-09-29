import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from  '../../../core/services/api.service';
import { Apoderado } from  '../../../core/models/apoderado.model';
import { EstudianteVinculado, PadreVinculado } from  '../../../core/models/catalogos.model';

@Injectable({ providedIn: 'root' })
export class ApoderadoService {
  constructor(private api: ApiService) {}

  getAll(): Observable<Apoderado[]> {
    return this.api.get<Apoderado[]>('/apoderados');
  }

  getById(id: number): Observable<Apoderado> {
    return this.api.get<Apoderado>(`/apoderados/${id}`);
  }

  getPadres(id: number): Observable<PadreVinculado[]> {
    return this.api.get<PadreVinculado[]>(`/apoderados/${id}/padres`);
  }

  getEstudiantes(id: number): Observable<EstudianteVinculado[]> {
    return this.api.get<EstudianteVinculado[]>(`/apoderados/${id}/estudiantes`);
  }

  attachPadre(id: number, padreId: number): Observable<PadreVinculado> {
    return this.api.post<PadreVinculado>(`/apoderados/${id}/padres`, { padre_id: padreId });
  }

  detachPadre(id: number, padreId: number): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/apoderados/${id}/padres/${padreId}`);
  }

  attachEstudiante(id: number, estudianteId: number): Observable<EstudianteVinculado> {
    return this.api.post<EstudianteVinculado>(`/apoderados/${id}/estudiantes`, { estudiante_id: estudianteId });
  }

  detachEstudiante(id: number, estudianteId: number): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/apoderados/${id}/estudiantes/${estudianteId}`);
  }
}
