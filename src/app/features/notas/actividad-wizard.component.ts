import { Component, OnInit, computed, signal } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatStepperModule } from '@angular/material/stepper';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ActividadService } from './services/actividad.service';
import { BimestreService } from './services/bimestre.service';
import { CatalogosService } from '../../core/services/catalogos.service';
import { MatriculaService } from '../matriculas/services/matricula.service';
import { BackButtonComponent } from '../../shared/components/back-button.component';
import type { Area, NivelLogro } from '../../core/models/calificacion.model';
import type { Bimestre } from '../../core/models/bimestre.model';
import type { Seccion } from '../../core/models/seccion.model';
import type { CalificacionActividadItem } from '../../core/models/actividad.model';

interface FilaAlumno {
  matricula_id: number;
  nombres: string;
  apellidos: string;
  dni?: string;
  nivel: NivelLogro | '';
}

const NIVELES: NivelLogro[] = ['AD', 'A', 'B', 'C'];

@Component({
  selector: 'app-actividad-wizard',
  standalone: true,
  imports: [BackButtonComponent, ReactiveFormsModule, RouterLink, AsyncPipe, MatStepperModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressSpinnerModule, MatSnackBarModule, MatIconModule],
  template: `
    <app-back-button [routerLink]="['../']" label="Volver" />
    <mat-card>
      <mat-card-header>
        <mat-card-title>Nueva actividad por competencia</mat-card-title>
        <mat-card-subtitle>Paso 1: datos · Paso 2: calificaciones iniciales (opcional) · Paso 3: revisión</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        @if (cargando()) {
          <div class="loading"><mat-spinner diameter="40" /></div>
        } @else if (error()) {
          <p class="error">{{ error() }}</p>
        } @else {
          <mat-stepper [linear]="true" #stepper>
            <mat-step [stepControl]="stepActividad" label="Actividad">
              <form [formGroup]="stepActividad">
                <mat-form-field appearance="outline">
                  <mat-label>Competencia</mat-label>
                  <mat-select formControlName="competencia_id" required>
                    @for (c of competencias(); track c.id) {
                      <mat-option [value]="c.id">{{ c.nombre }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Bimestre</mat-label>
                  <mat-select formControlName="bimestre_id" required>
                    @for (b of bimestres(); track b.id) {
                      <mat-option [value]="b.id">{{ b.nombre }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Sección</mat-label>
                  <mat-select formControlName="seccion_id" required (selectionChange)="onSeccionChange()">
                    @for (s of secciones(); track s.id) {
                      <mat-option [value]="s.id">{{ s.nombre }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline" class="full">
                  <mat-label>Título</mat-label>
                  <input matInput formControlName="titulo" maxlength="200" required />
                </mat-form-field>
                <mat-form-field appearance="outline" class="full">
                  <mat-label>Descripción</mat-label>
                  <textarea matInput formControlName="descripcion" rows="2"></textarea>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Fecha</mat-label>
                  <input matInput type="date" formControlName="fecha" required />
                </mat-form-field>
                <div class="actions">
                  <button mat-raised-button color="primary" matStepperNext [disabled]="!stepActividad.valid">Siguiente</button>
                </div>
              </form>
            </mat-step>
            <mat-step label="Calificaciones (opcional)">
              <p class="hint">Asignar nivel inicial por alumno. Las filas sin nivel se omiten.</p>
              @if (cargandoAlumnos()) {
                <div class="loading"><mat-spinner diameter="32" /></div>
              } @else if (filas().length === 0) {
                <p class="hint">No hay alumnos matriculados en la sección elegida.</p>
              } @else {
                <table class="tabla">
                  <thead><tr><th>DNI</th><th>Apellidos y nombres</th><th>Nivel</th></tr></thead>
                  <tbody>
                    @for (f of filas(); track f.matricula_id) {
                      <tr>
                        <td>{{ f.dni ?? '—' }}</td>
                        <td>{{ f.apellidos }}, {{ f.nombres }}</td>
                        <td>
                          <mat-form-field appearance="outline" subscriptSizing="dynamic">
                            <mat-select [value]="f.nivel" (selectionChange)="f.nivel = $event.value" placeholder="—">
                              <mat-option value="">—</mat-option>
                              @for (n of niveles; track n) {
                                <mat-option [value]="n">{{ n }}</mat-option>
                              }
                            </mat-select>
                          </mat-form-field>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              }
              <div class="actions">
                <button mat-button matStepperPrevious>Atrás</button>
                <button mat-raised-button color="primary" matStepperNext>Siguiente</button>
              </div>
            </mat-step>
            <mat-step label="Revisión">
              <dl class="resumen">
                <dt>Competencia</dt><dd>{{ nombreCompetencia() }}</dd>
                <dt>Bimestre</dt><dd>{{ nombreBimestre() }}</dd>
                <dt>Sección</dt><dd>{{ nombreSeccion() }}</dd>
                <dt>Título</dt><dd>{{ stepActividad.value.titulo }}</dd>
                <dt>Fecha</dt><dd>{{ stepActividad.value.fecha }}</dd>
                <dt>Calificaciones a registrar</dt><dd>{{ itemsCalificados().length }} de {{ filas().length }}</dd>
              </dl>
              <div class="actions">
                <button mat-button matStepperPrevious>Atrás</button>
                <button mat-raised-button color="primary" (click)="guardar()" [disabled]="guardando() || !stepActividad.valid">
                  @if (guardando()) { <mat-spinner diameter="20" /> } @else { Guardar }
                </button>
              </div>
              @if (error()) { <p class="error">{{ error() }}</p> }
            </mat-step>
          </mat-stepper>
        }
      </mat-card-content>
    </mat-card>
  `,
  styleUrl: './actividad-wizard.component.scss',
})
export class ActividadWizardComponent implements OnInit {
  cargando = signal(true);
  cargandoAlumnos = signal(false);
  guardando = signal(false);
  error = signal<string | null>(null);

  competencias = signal<Area[]>([]);
  bimestres = signal<Bimestre[]>([]);
  secciones = signal<Seccion[]>([]);
  filas = signal<FilaAlumno[]>([]);
  niveles = NIVELES;

  itemsCalificados = computed(() => this.filas().filter((f) => f.nivel !== ''));
  nombreCompetencia = computed(() => this.competencias().find((c) => c.id === this.stepActividad.value.competencia_id)?.nombre ?? '—');
  nombreBimestre = computed(() => this.bimestres().find((b) => b.id === this.stepActividad.value.bimestre_id)?.nombre ?? '—');
  nombreSeccion = computed(() => this.secciones().find((s) => s.id === this.stepActividad.value.seccion_id)?.nombre ?? '—');

  stepActividad = new FormGroup({
    competencia_id: new FormControl<number | null>(null, Validators.required),
    bimestre_id: new FormControl<number | null>(null, Validators.required),
    seccion_id: new FormControl<number | null>(null, Validators.required),
    titulo: new FormControl('', [Validators.required, Validators.maxLength(200)]),
    descripcion: new FormControl<string | null>(null),
    fecha: new FormControl('', Validators.required),
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private snack: MatSnackBar,
    private actividades: ActividadService,
    private bimestresSvc: BimestreService,
    private catalogos: CatalogosService,
    private matriculas: MatriculaService,
  ) {}

  ngOnInit(): void {
    const qp = this.route.snapshot.queryParamMap;
    forkJoin({
      areas: this.catalogos.getAreas().pipe(catchError(() => of([] as Area[]))),
      bimestres: this.bimestresSvc.getByPeriodo().pipe(catchError(() => of([] as Bimestre[]))),
      secciones: this.catalogos.getSecciones().pipe(catchError(() => of([] as Seccion[]))),
    }).subscribe({
      next: ({ areas, bimestres, secciones }) => {
        this.competencias.set(areas.filter((a) => a.tipo === 'competencia'));
        this.bimestres.set(bimestres);
        this.secciones.set(secciones);
        this.stepActividad.patchValue({
          competencia_id: qp.has('competencia_id') ? Number(qp.get('competencia_id')) : null,
          bimestre_id: qp.has('bimestre_id') ? Number(qp.get('bimestre_id')) : null,
          seccion_id: qp.has('seccion_id') ? Number(qp.get('seccion_id')) : null,
        });
        this.cargando.set(false);
        if (this.stepActividad.value.seccion_id) this.onSeccionChange();
      },
      error: () => {
        this.error.set('No se pudieron cargar los catálogos.');
        this.cargando.set(false);
      },
    });
  }

  onSeccionChange(): void {
    const seccionId = this.stepActividad.value.seccion_id;
    this.filas.set([]);
    if (!seccionId) return;
    this.cargandoAlumnos.set(true);
    this.matriculas
      .getAll()
      .pipe(
        map((ms) => ms.filter((m) => m.seccion_id === seccionId)),
        catchError(() => of([])),
      )
      .subscribe((ms) => {
        this.filas.set(
          ms.map((m) => ({
            matricula_id: m.id,
            nombres: m.estudiante?.nombres ?? '',
            apellidos: m.estudiante?.apellidos ?? '',
            dni: m.estudiante?.dni,
            nivel: '' as const,
          })),
        );
        this.cargandoAlumnos.set(false);
      });
  }

  guardar(): void {
    if (!this.stepActividad.valid || this.guardando()) return;
    this.guardando.set(true);
    this.error.set(null);
    const v = this.stepActividad.value;
    this.actividades
      .create({
        competencia_id: v.competencia_id!,
        bimestre_id: v.bimestre_id!,
        seccion_id: v.seccion_id!,
        titulo: v.titulo!,
        descripcion: v.descripcion ?? null,
        fecha: v.fecha!,
      })
      .subscribe({
        next: (act) => {
          const items: CalificacionActividadItem[] = this.itemsCalificados().map((f) => ({
            matricula_id: f.matricula_id,
            nivel_logro: f.nivel as NivelLogro,
          }));
          if (items.length === 0) {
            this.snack.open('Actividad creada.', 'Cerrar', { duration: 3000 });
            this.router.navigate(['../'], { relativeTo: this.route });
            return;
          }
          this.actividades.guardarCalificaciones(act.id, items).subscribe({
            next: (r) => {
              this.snack.open(`Actividad creada con ${r.guardados} calificaciones.`, 'Cerrar', { duration: 3000 });
              this.router.navigate(['../'], { relativeTo: this.route });
            },
            error: () => {
              this.error.set('Actividad creada, pero falló el registro de calificaciones.');
              this.guardando.set(false);
            },
          });
        },
        error: () => {
          this.error.set('No se pudo crear la actividad.');
          this.guardando.set(false);
        },
      });
  }
}
