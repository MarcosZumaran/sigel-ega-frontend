import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Estado, Nivel, Docente } from '../models/catalogos.model';
import { Grado } from '../models/grado.model';
import { TipoMatricula } from '../models/matricula.model';
import { Periodo } from '../models/periodo.model';
import { Seccion } from '../models/seccion.model';
import { Area, TipoEvaluacion } from '../models/calificacion.model';

@Injectable({ providedIn: 'root' })
export class CatalogosService {
  constructor(private api: ApiService) {}

  getNiveles(): Observable<Nivel[]> {
    return this.api.get<Nivel[]>('/niveles');
  }

  getGrados(): Observable<Grado[]> {
    return this.api.get<Grado[]>('/grados');
  }

  getDocentes(): Observable<Docente[]> {
    return this.api.get<Docente[]>('/docentes');
  }

  getPeriodos(): Observable<Periodo[]> {
    return this.api.get<Periodo[]>('/periodos');
  }

  getSecciones(): Observable<Seccion[]> {
    return this.api.get<Seccion[]>('/secciones');
  }

  getTiposMatricula(): Observable<TipoMatricula[]> {
    return this.api.get<TipoMatricula[]>('/tipos-matricula');
  }

  getEstados(): Observable<Estado[]> {
    return this.api.get<Estado[]>('/estados');
  }

  getAreas(): Observable<Area[]> {
    return this.api.get<Area[]>('/areas');
  }

  getTiposEvaluacion(): Observable<TipoEvaluacion[]> {
    return this.api.get<TipoEvaluacion[]>('/tipos-evaluacion');
  }
}
