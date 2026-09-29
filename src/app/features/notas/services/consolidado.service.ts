import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  ConsolidadoBatchResponse,
  ConsolidadoItem,
  ConsolidadoResponse,
} from '../../../core/models/consolidado.model';

@Injectable({ providedIn: 'root' })
export class ConsolidadoService {
  constructor(private api: ApiService) {}

  getConsolidado(seccionId: number, bimestreId: number, periodoId?: number): Observable<ConsolidadoResponse> {
    const params: Record<string, string | number | boolean> = {
      seccion_id: seccionId,
      bimestre_id: bimestreId,
    };
    if (periodoId) params['periodo_id'] = periodoId;
    return this.api.get<ConsolidadoResponse>('/consolidado', params);
  }

  guardarBatch(bimestreId: number, items: ConsolidadoItem[]): Observable<ConsolidadoBatchResponse> {
    return this.api.post<ConsolidadoBatchResponse>('/consolidado/batch', {
      bimestre_id: bimestreId,
      items,
    });
  }
}
