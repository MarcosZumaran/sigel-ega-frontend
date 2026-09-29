import { Component, OnInit, computed, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { CalificacionService } from './services/calificacion.service';
import { MatriculaService } from '../matriculas/services/matricula.service';
import { CatalogosService } from '../../core/services/catalogos.service';
import { extractApiError } from '../../core/utils/api-error';
import { notaANivel } from '../../core/utils/ministerio-equivalencia';
import { BackButtonComponent } from '../../shared/components/back-button.component';
import { ModuleHomeComponent } from '../../shared/components/module-home.component';
import { Calificacion, Area, NivelLogro } from '../../core/models/calificacion.model';
import { Matricula } from '../../core/models/matricula.model';
import { Periodo } from '../../core/models/periodo.model';
import { Nivel } from '../../core/models/catalogos.model';
import { Grado } from '../../core/models/grado.model';
import { Seccion } from '../../core/models/seccion.model';

const PUNTOS: Record<string, number> = { AD: 4, A: 3, B: 2, C: 1 };

export interface FilaSabana {
  matricula: Matricula;
}

export interface ResumenArea {
  nota: number;
  nivel: NivelLogro;
  n: number;
}

@Component({
  selector: 'app-notas-listado',
  standalone: true,
  imports: [
    ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule,
    MatSelectModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatSnackBarModule, BackButtonComponent, ModuleHomeComponent,
  ],
  template: `
    <div class="page-head">
      <app-back-button />
      <div>
        <h1>Sábana de notas</h1>
        <p class="subtitle">Resumen por estudiante y área</p>
      </div>
    </div>
    <app-module-home moduleName="Notas"
      [actions]="[{label: 'Consolidado', icon: 'grid_on', link: '/notas/consolidado'}]"
      recentTitle="Últimas matrículas" [items]="recentItems()" />

    <mat-card class="filters">
      <mat-card-content class="compact-content">
        <mat-form-field appearance="outline">
          <mat-label>Periodo</mat-label>
          <mat-select [formControl]="fPeriodo">
            @for (p of periodos(); track p.id) {
              <mat-option [value]="p.id">{{ p.nombre }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Nivel</mat-label>
          <mat-select [formControl]="fNivel">
            <mat-option [value]="0">Todos</mat-option>
            @for (n of niveles(); track n.id) {
              <mat-option [value]="n.id">{{ n.nombre }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Grado</mat-label>
          <mat-select [formControl]="fGrado">
            <mat-option [value]="0">Todos</mat-option>
            @for (g of gradosVisibles(); track g.id) {
              <mat-option [value]="g.id">{{ g.nombre }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Sección</mat-label>
          <mat-select [formControl]="fSeccion">
            <mat-option [value]="0">Todas</mat-option>
            @for (s of seccionesVisibles(); track s.id) {
              <mat-option [value]="s.id">{{ s.grado?.nombre }} {{ s.nombre }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <button mat-stroked-button type="button" (click)="clearFilters()">
          <mat-icon>filter_alt_off</mat-icon> Limpiar
        </button>
      </mat-card-content>
    </mat-card>

    <div class="table-wrap">
      @if (loading()) {
        <div class="loading"><mat-spinner diameter="40"></mat-spinner></div>
      } @else if (filas().length === 0) {
        <div class="empty-state">
          <mat-icon>assignment</mat-icon>
          <h2>Sin estudiantes</h2>
          <p>Selecciona una sección con matrículas en este periodo.</p>
        </div>
      } @else if (areas().length === 0) {
        <div class="empty-state">
          <mat-icon>library_books</mat-icon>
          <h2>No hay áreas configuradas</h2>
          <p>Registra áreas para ver la sábana.</p>
        </div>
      } @else {
        <div class="scroll-x">
          <table class="sabana">
            <thead>
              <tr>
                <th class="sticky-col c-num">N°</th>
                <th class="sticky-col c-dni">DNI</th>
                <th class="sticky-col c-est">Estudiante</th>
                @for (a of areas(); track a.id) {
                  <th class="c-area">{{ a.nombre }}</th>
                }
                <th class="c-acc">Detalles</th>
              </tr>
            </thead>
            <tbody>
              @for (f of filas(); track f.matricula.id; let i = $index) {
                <tr>
                  <td class="sticky-col c-num">{{ i + 1 }}</td>
                  <td class="sticky-col c-dni">{{ f.matricula.estudiante?.dni ?? '—' }}</td>
                  <td class="sticky-col c-est">{{ nombreEst(f.matricula) }}</td>
                  @for (a of areas(); track a.id) {
                    @let r = resumenDe(f.matricula.id, a.id);
                    <td class="c-area">
                      @if (r) {
                        <span class="nota">{{ fmtNota(r.nota) }}</span>
                        <span class="badge niv-{{ r.nivel }}">{{ r.nivel }}</span>
                      } @else {
                        <span class="vacio">—</span>
                      }
                    </td>
                  }
                  <td class="c-acc">
                    <a mat-stroked-button [routerLink]="['/notas/estudiante', f.matricula.estudiante_id]">
                      Ver detalles
                    </a>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styleUrl: './notas-listado.component.scss',
})
export class NotasListadoComponent implements OnInit {
  loading = signal(true);
  periodos = signal<Periodo[]>([]);
  niveles = signal<Nivel[]>([]);
  grados = signal<Grado[]>([]);
  secciones = signal<Seccion[]>([]);
  areas = signal<Area[]>([]);
  filas = signal<FilaSabana[]>([]);

  fPeriodo = new FormControl<number>(0, { nonNullable: true });
  fNivel = new FormControl<number>(0, { nonNullable: true });
  fGrado = new FormControl<number>(0, { nonNullable: true });
  fSeccion = new FormControl<number>(0, { nonNullable: true });

  gradosVisibles = computed(() => {
    const n = this.fNivel.value;
    return n ? this.grados().filter((g) => g.nivel_id === n) : this.grados();
  });

  seccionesVisibles = computed(() => {
    const g = this.fGrado.value;
    if (g) return this.secciones().filter((s) => s.grado_id === g);
    const n = this.fNivel.value;
    if (n) {
      const ids = new Set(this.grados().filter((x) => x.nivel_id === n).map((x) => x.id));
      return this.secciones().filter((s) => ids.has(s.grado_id));
    }
    return this.secciones();
  });

  private califs: Calificacion[] = [];

  constructor(
    private califSvc: CalificacionService,
    private matriculasSvc: MatriculaService,
    private catalogos: CatalogosService,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    forkJoin({
      periodos: this.catalogos.getPeriodos(),
      niveles: this.catalogos.getNiveles(),
      grados: this.catalogos.getGrados(),
      secciones: this.catalogos.getSecciones(),
      areas: this.catalogos.getAreas(),
    }).subscribe({
      next: (r) => {
        this.periodos.set(r.periodos);
        this.niveles.set(r.niveles);
        this.grados.set(r.grados);
        this.secciones.set(r.secciones);
        this.areas.set(r.areas.filter((a) => !a.area_padre_id));
        const activo = r.periodos.find((p) => p.activo);
        this.fPeriodo.setValue(activo?.id ?? r.periodos[0]?.id ?? 0, { emitEvent: false });
        this.fPeriodo.valueChanges.subscribe(() => this.load());
        this.fNivel.valueChanges.subscribe(() => {
          this.fGrado.setValue(0, { emitEvent: false });
          this.fSeccion.setValue(0, { emitEvent: false });
          this.load();
        });
        this.fGrado.valueChanges.subscribe(() => {
          this.fSeccion.setValue(0, { emitEvent: false });
          this.load();
        });
        this.fSeccion.valueChanges.subscribe(() => this.load());
        this.load();
      },
      error: (err) => {
        this.loading.set(false);
        this.snack.open(extractApiError(err, 'No se pudieron cargar los catálogos'), 'Cerrar', { duration: 4000 });
      },
    });
  }

  load(): void {
    const periodoId = this.fPeriodo.value;
    const seccionId = this.fSeccion.value;
    this.loading.set(true);
    forkJoin({
      matriculas: this.matriculasSvc.getAll(),
      califs: this.califSvc.getAll({
        ...(periodoId ? { periodo_id: periodoId } : {}),
        ...(seccionId ? { seccion_id: seccionId } : {}),
      }),
    }).subscribe({
      next: (r) => {
        let mats = r.matriculas.filter(
          (m) =>
            (!periodoId || m.periodo_id === periodoId) &&
            (!seccionId || m.seccion_id === seccionId)
        );
        const g = this.fGrado.value;
        if (g) {
          const secIds = new Set(this.secciones().filter((s) => s.grado_id === g).map((s) => s.id));
          mats = mats.filter((m) => secIds.has(m.seccion_id));
        } else {
          const n = this.fNivel.value;
          if (n) {
            const gIds = new Set(this.grados().filter((x) => x.nivel_id === n).map((x) => x.id));
            const secIds = new Set(this.secciones().filter((s) => gIds.has(s.grado_id)).map((s) => s.id));
            mats = mats.filter((m) => secIds.has(m.seccion_id));
          }
        }
        this.califs = r.califs;
        this.filas.set(mats.map((matricula) => ({ matricula })));
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.snack.open(extractApiError(err, 'No se pudo cargar la sábana'), 'Cerrar', { duration: 4000 });
      },
    });
  }

  resumenDe(matriculaId: number, areaId: number): ResumenArea | null {
    const rel = this.califs.filter(
      (c) =>
        c.matricula_id === matriculaId &&
        (c.area_id === areaId || c.area?.area_padre_id === areaId) &&
        c.nivel_logro
    );
    if (rel.length === 0) return null;
    const suma = rel.reduce((acc, c) => acc + (PUNTOS[c.nivel_logro as string] ?? 0), 0);
    const nota = Math.round(((suma / (rel.length * 4)) * 20) * 10) / 10;
    return { nota, nivel: notaANivel(nota), n: rel.length };
  }

  recentItems(): { title: string; subtitle?: string; link?: string[] }[] {
    return [...this.filas()].sort((a, b) => b.matricula.id - a.matricula.id).slice(0, 5).map((f) => ({
      title: `${f.matricula.estudiante?.nombres ?? ''} ${f.matricula.estudiante?.apellidos ?? ''}`.trim() || `Matrícula #${f.matricula.id}`,
      subtitle: `Matrícula #${f.matricula.id}`,
      link: ['/notas/estudiante', String(f.matricula.estudiante_id)],
    }));
  }

  fmtNota(n: number): string {
    return Number.isInteger(n) ? String(n) : n.toFixed(1);
  }

  nombreEst(m: Matricula): string {
    const e = m.estudiante;
    return e ? `${e.nombres} ${e.apellidos}` : '—';
  }

  clearFilters(): void {
    const activo = this.periodos().find((p) => p.activo);
    this.fNivel.setValue(0, { emitEvent: false });
    this.fGrado.setValue(0, { emitEvent: false });
    this.fSeccion.setValue(0, { emitEvent: false });
    this.fPeriodo.setValue(activo?.id ?? this.periodos()[0]?.id ?? 0, { emitEvent: false });
    this.load();
  }
}
