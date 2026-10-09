import { Component, OnInit, computed, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ActividadService } from './services/actividad.service';
import { MatriculaService } from '../matriculas/services/matricula.service';
import { CatalogosService } from '../../core/services/catalogos.service';
import { BackButtonComponent } from '../../shared/components/back-button.component';
import { ActividadFormDialogComponent } from './actividad-form-dialog.component';
import { extractApiError } from '../../core/utils/api-error';
import type { Actividad, SugerenciaNivelItem } from '../../core/models/actividad.model';
import type { NivelLogro } from '../../core/models/calificacion.model';

interface FilaMatricial {
  matricula_id: number;
  nombres: string;
  apellidos: string;
  dni?: string;
}

const NIVELES: NivelLogro[] = ['AD', 'A', 'B', 'C'];

@Component({
  selector: 'app-actividad-matricial',
  standalone: true,
  imports: [BackButtonComponent, DatePipe, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule, MatDialogModule],
  template: `
    <app-back-button />
    <div class="flat-section-header">
      <mat-icon>assignment</mat-icon>
      <span>Actividades de {{ competenciaNombre() }}</span>
      <span class="spacer"></span>
      <button class="flat-btn-primary" (click)="agregarActividad()">
        <mat-icon>add</mat-icon> Nueva actividad
      </button>
    </div>

    @if (cargando()) {
      <div class="center"><mat-spinner diameter="40" /></div>
    } @else if (!actividades().length) {
      <div class="flat-empty">
        <div class="flat-empty-icon"><mat-icon>assignment</mat-icon></div>
        <h3>Sin actividades</h3>
        <p>Crea la primera actividad para esta competencia.</p>
        <button class="flat-btn-primary" (click)="agregarActividad()">
          <mat-icon>add</mat-icon> Crear actividad
        </button>
      </div>
    } @else {
      <div class="barra-guardar">
        <span class="contador">{{ cambiosPendientes() }} cambio(s) pendiente(s)</span>
        <span class="spacer"></span>
        <button class="flat-btn-primary" (click)="guardar()" [disabled]="guardando() || cambiosPendientes() === 0">
          @if (guardando()) { <mat-spinner diameter="18" /> } @else { <mat-icon>save</mat-icon> } Guardar cambios
        </button>
      </div>
      <div class="table-scroll">
        <table class="flat-table">
          <thead>
            <tr>
              <th class="sticky-col col-n">N°</th>
              <th class="sticky-col col-est">Estudiante</th>
              @for (a of actividades(); track a.id) {
                <th>
                  <div class="act-header">
                    <span>{{ a.titulo }}</span>
                    <small>{{ a.fecha | date:'dd/MM' }}</small>
                  </div>
                </th>
              }
              <th class="promedio-col">Nivel sugerido</th>
            </tr>
          </thead>
          <tbody>
            @for (est of filas(); track est.matricula_id; let i = $index) {
              <tr>
                <td class="sticky-col col-n">{{ i + 1 }}</td>
                <td class="sticky-col col-est">{{ est.apellidos }}, {{ est.nombres }}</td>
                @for (a of actividades(); track a.id) {
                  <td class="celda-nivel">
                    <select [value]="nivelDe(est.matricula_id, a.id) ?? ''"
                            (change)="onNivelChange(est.matricula_id, a.id, $any($event.target).value)"
                            [attr.aria-label]="'Nivel ' + est.nombres + ' en ' + a.titulo">
                      <option value="">—</option>
                      @for (n of niveles; track n) {
                        <option [value]="n">{{ n }}</option>
                      }
                    </select>
                  </td>
                }
                <td class="promedio-col">
                  @if (sugerenciaDe(est.matricula_id)?.nivel_sugerido; as ns) {
                    <span class="flat-badge-nivel niv-{{ ns }}">{{ ns }}</span>
                  } @else {
                    <span>—</span>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
  styles: [`
    .center { display: flex; justify-content: center; padding: 2rem; }
    .barra-guardar { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 0; }
    .barra-guardar .spacer { flex: 1; }
    .contador { font-size: 0.85rem; color: #64748B; font-weight: 600; }
    .table-scroll { overflow-x: auto; border: 2px solid #E2E8F0; border-top: 0; border-radius: 0 0 8px 8px; }
    .table-scroll .flat-table { border: 0; border-radius: 0; }
    .sticky-col { position: sticky; background: #fff; z-index: 1; }
    thead .sticky-col { background: #1E3A8A; z-index: 2; }
    tbody tr:hover .sticky-col { background: #F8FAFC; }
    .col-n { left: 0; min-width: 3rem; }
    .col-est { left: 3rem; min-width: 14rem; }
    .act-header { display: flex; flex-direction: column; gap: 2px; min-width: 9rem; }
    .act-header small { font-weight: 400; opacity: 0.8; }
    .promedio-col { text-align: center; }
    .celda-nivel select {
      border: 2px solid #E2E8F0; border-radius: 8px; padding: 0.35rem 0.5rem;
      font-weight: 700; background: #fff; cursor: pointer; min-width: 4.5rem;
    }
    .celda-nivel select:focus { border-color: #1E3A8A; outline: none; }
  `],
  providers: [DatePipe],
})
export class ActividadMatricialComponent implements OnInit {
  cargando = signal(true);
  guardando = signal(false);
  competenciaId = signal(0);
  bimestreId = signal(0);
  seccionId = signal(0);
  competenciaNombre = signal('…');

  actividades = signal<Actividad[]>([]);
  filas = signal<FilaMatricial[]>([]);
  sugerencias = signal<Record<number, SugerenciaNivelItem>>({});
  niveles = NIVELES;

  /** Niveles guardados en el servidor: [matricula_id][actividad_id] */
  private base = signal<Record<number, Record<number, NivelLogro | null>>>({});
  /** Copia de trabajo editable. */
  private trabajo = signal<Record<number, Record<number, NivelLogro | null>>>({});

  cambiosPendientes = computed(() => {
    const b = this.base();
    const t = this.trabajo();
    let n = 0;
    for (const mid of Object.keys(t)) {
      for (const aid of Object.keys(t[+mid] ?? {})) {
        if ((t[+mid]?.[+aid] ?? null) !== (b[+mid]?.[+aid] ?? null)) n++;
      }
    }
    return n;
  });

  constructor(
    private route: ActivatedRoute,
    private snack: MatSnackBar,
    private dialog: MatDialog,
    private actividadesSvc: ActividadService,
    private matriculas: MatriculaService,
    private catalogos: CatalogosService,
  ) {}

  ngOnInit(): void {
    const qp = this.route.snapshot.queryParamMap;
    this.competenciaId.set(Number(qp.get('competencia_id') ?? 0));
    this.bimestreId.set(Number(qp.get('bimestre_id') ?? 0));
    this.seccionId.set(Number(qp.get('seccion_id') ?? 0));
    if (!this.competenciaId() || !this.bimestreId() || !this.seccionId()) {
      this.snack.open('Falta el contexto (competencia, bimestre o sección).', 'Cerrar', { duration: 4000 });
      this.cargando.set(false);
      return;
    }
    this.cargarTodo();
  }

  nivelDe(matriculaId: number, actividadId: number): NivelLogro | null {
    return this.trabajo()[matriculaId]?.[actividadId] ?? null;
  }

  sugerenciaDe(matriculaId: number): SugerenciaNivelItem | null {
    return this.sugerencias()[matriculaId] ?? null;
  }

  onNivelChange(matriculaId: number, actividadId: number, valor: string): void {
    const nivel = (valor === '' ? null : valor) as NivelLogro | null;
    this.trabajo.update((t) => ({
      ...t,
      [matriculaId]: { ...(t[matriculaId] ?? {}), [actividadId]: nivel },
    }));
  }

  agregarActividad(): void {
    this.dialog
      .open(ActividadFormDialogComponent, {
        width: '520px',
        data: {
          competencia_id: this.competenciaId(),
          bimestre_id: this.bimestreId(),
          seccion_id: this.seccionId(),
        },
      })
      .afterClosed()
      .subscribe((creada) => {
        if (creada) {
          this.snack.open('Actividad creada.', 'Cerrar', { duration: 3000 });
          this.cargarTodo();
        }
      });
  }

  guardar(): void {
    if (this.guardando() || this.cambiosPendientes() === 0) return;
    const b = this.base();
    const t = this.trabajo();
    const porActividad = new Map<number, Array<{ matricula_id: number; nivel_logro: NivelLogro }>>();
    for (const mid of Object.keys(t)) {
      for (const aid of Object.keys(t[+mid] ?? {})) {
        const nuevo = t[+mid]?.[+aid] ?? null;
        if (nuevo !== (b[+mid]?.[+aid] ?? null) && nuevo !== null) {
          const arr = porActividad.get(+aid) ?? [];
          arr.push({ matricula_id: +mid, nivel_logro: nuevo });
          porActividad.set(+aid, arr);
        }
      }
    }
    if (porActividad.size === 0) {
      // Solo se limpiaron celdas: el backend no soporta borrado, se revierte.
      this.trabajo.set(structuredClone(b));
      this.snack.open('Las celdas vaciadas se revirtieron (el borrado no está soportado).', 'Cerrar', { duration: 4000 });
      return;
    }
    this.guardando.set(true);
    forkJoin(
      [...porActividad.entries()].map(([aid, items]) =>
        this.actividadesSvc.guardarCalificaciones(aid, items).pipe(catchError(() => of(null)))
      )
    ).subscribe((res) => {
      this.guardando.set(false);
      const ok = res.filter((r) => r !== null).length;
      this.snack.open(`Cambios guardados en ${ok} actividad(es).`, 'Cerrar', { duration: 3000 });
      this.cargarTodo();
    });
  }

  private cargarTodo(): void {
    this.cargando.set(true);
    const f = {
      competencia_id: this.competenciaId(),
      bimestre_id: this.bimestreId(),
      seccion_id: this.seccionId(),
    };
    forkJoin({
      acts: this.actividadesSvc.getAll(f).pipe(catchError(() => of([] as Actividad[]))),
      mats: this.matriculas.getAll().pipe(
        map((ms) => ms.filter((m) => m.seccion_id === this.seccionId())),
        catchError(() => of([])),
      ),
      sug: this.actividadesSvc.sugerirNivel(f.seccion_id, f.competencia_id, f.bimestre_id).pipe(
        map((r) => r.sugerencias),
        catchError(() => of({} as Record<number, SugerenciaNivelItem>)),
      ),
      areas: this.catalogos.getAreas().pipe(catchError(() => of([]))),
    }).subscribe(({ acts, mats, sug, areas }) => {
      this.actividades.set(acts);
      this.filas.set(
        mats.map((m) => ({
          matricula_id: m.id,
          nombres: m.estudiante?.nombres ?? '',
          apellidos: m.estudiante?.apellidos ?? '',
          dni: m.estudiante?.dni,
        }))
      );
      this.sugerencias.set(sug);
      const comp = areas.find((a) => a.id === this.competenciaId());
      this.competenciaNombre.set(comp?.nombre ?? acts[0]?.competencia?.nombre ?? 'la competencia');
      if (acts.length === 0) {
        this.base.set({});
        this.trabajo.set({});
        this.cargando.set(false);
        return;
      }
      forkJoin(
        acts.map((a) =>
          this.actividadesSvc.getCalificaciones(a.id).pipe(
            map((r) => r.calificaciones),
            catchError(() => of([])),
          )
        )
      ).subscribe((todas) => {
        const mapa: Record<number, Record<number, NivelLogro | null>> = {};
        acts.forEach((a, i) => {
          for (const c of todas[i] ?? []) {
            mapa[c.matricula_id] = { ...(mapa[c.matricula_id] ?? {}), [a.id]: c.nivel_logro };
          }
        });
        this.base.set(mapa);
        this.trabajo.set(structuredClone(mapa));
        this.cargando.set(false);
      });
    });
  }
}
