import { Component, OnInit, signal } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { map, Observable, startWith } from 'rxjs';
import { MatStepperModule } from '@angular/material/stepper';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatriculaService, VacantesInfo } from './services/matricula.service';
import { EstudianteService } from '../estudiantes/services/estudiante.service';
import { PadreService } from '../padres/services/padre.service';
import { CatalogosService } from '../../core/services/catalogos.service';
import { Estudiante } from '../../core/models/estudiante.model';
import { Padre } from '../../core/models/padre.model';
import { Periodo } from '../../core/models/periodo.model';
import { Seccion } from '../../core/models/seccion.model';
import { Grado } from '../../core/models/grado.model';
import { Nivel } from '../../core/models/catalogos.model';
import { Matricula, TipoMatricula } from '../../core/models/matricula.model';
import { extractApiError } from '../../core/utils/api-error';
import { BackButtonComponent } from '../../shared/components/back-button.component';

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

@Component({
  selector: 'app-matriculas-wizard',
  standalone: true,
  imports: [BackButtonComponent, ReactiveFormsModule, RouterLink, AsyncPipe, MatStepperModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatAutocompleteModule, MatRadioModule, MatProgressSpinnerModule, MatSnackBarModule, MatIconModule],
  template: `
    <app-back-button />
    <h1>Nueva matricula</h1>
    <mat-stepper [linear]="true" #stepper>
      <mat-step [stepControl]="stepEstudiante" label="Estudiante">
        <form [formGroup]="stepEstudiante">
          <mat-radio-group formControlName="modo" (change)="onModoEstudianteChange()">
            <mat-radio-button value="existente">Estudiante existente</mat-radio-button>
            <mat-radio-button value="nuevo">Crear nuevo</mat-radio-button>
          </mat-radio-group>
          @if (stepEstudiante.controls['modo'].value === 'existente') {
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Buscar por DNI o apellidos</mat-label>
              <input matInput type="search" [formControl]="estSearch" [matAutocomplete]="autoEst" />
              <mat-autocomplete #autoEst="matAutocomplete" [displayWith]="displayEst" (optionSelected)="onEstSelected($event.option.value)">
                @for (e of estFiltrados$ | async; track e.id) {
                  <mat-option [value]="e">{{ e.nombres }} {{ e.apellidos }} (DNI {{ e.dni }})</mat-option>
                }
              </mat-autocomplete>
            </mat-form-field>
            @if (estSeleccionado()) {
              <p class="muted">Seleccionado: {{ estSeleccionado()?.nombres }} {{ estSeleccionado()?.apellidos }} — Apoderado #{{ estSeleccionado()?.apoderado_id ?? 'sin asignar' }}.</p>
            }
          } @else {
            <div class="grid">
              <mat-form-field appearance="outline">
                <mat-label>DNI</mat-label>
                <input matInput formControlName="dni" maxlength="8" inputmode="numeric" />
                @if (stepEstudiante.controls['dni'].invalid && stepEstudiante.controls['dni'].touched) {
                  <mat-error>DNI de 8 digitos</mat-error>
                }
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Nombres</mat-label>
                <input matInput formControlName="nombres" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Apellidos</mat-label>
                <input matInput formControlName="apellidos" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Fecha de nacimiento</mat-label>
                <input matInput type="date" formControlName="fecha_nacimiento" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Sexo</mat-label>
                <mat-select formControlName="sexo">
                  <mat-option value="M">Masculino</mat-option>
                  <mat-option value="F">Femenino</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Nivel</mat-label>
                <mat-select formControlName="nivel_id">
                  @for (n of niveles(); track n.id) {
                    <mat-option [value]="n.id">{{ n.nombre }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>
          }
          <div class="step-actions">
            <button mat-raised-button color="primary" matStepperNext [disabled]="!estudiantePasoValido()">Siguiente</button>
          </div>
        </form>
      </mat-step>
      <mat-step [stepControl]="stepPadre" label="Padre / Apoderado">
        <form [formGroup]="stepPadre">
          @if (estSeleccionado()?.apoderado_id) {
            <p class="muted">El estudiante ya tiene apoderado #{{ estSeleccionado()?.apoderado_id }} (solo lectura). Puede omitir este paso.</p>
          }
          <mat-radio-group formControlName="modo" (change)="onModoPadreChange()">
            <mat-radio-button value="existente">Padre existente</mat-radio-button>
            <mat-radio-button value="nuevo">Crear nuevo</mat-radio-button>
            <mat-radio-button value="ninguno" [disabled]="!estSeleccionado()?.apoderado_id">Sin padre (ya tiene apoderado)</mat-radio-button>
          </mat-radio-group>
          @if (stepPadre.controls['modo'].value === 'existente') {
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Buscar padre por DNI o apellidos</mat-label>
              <input matInput type="search" [formControl]="padreSearch" [matAutocomplete]="autoPadre" />
              <mat-autocomplete #autoPadre="matAutocomplete" [displayWith]="displayPadre" (optionSelected)="onPadreSelected($event.option.value)">
                @for (p of padresFiltrados$ | async; track p.id) {
                  <mat-option [value]="p">{{ p.nombres }} {{ p.apellidos }} (DNI {{ p.dni }})</mat-option>
                }
              </mat-autocomplete>
            </mat-form-field>
            @if (padreSeleccionado()) {
              <p class="muted">Padre: {{ padreSeleccionado()?.nombres }} {{ padreSeleccionado()?.apellidos }} — apoderado #{{ padreSeleccionado()?.apoderado_id }} (se crea automaticamente si no tiene).</p>
            }
          } @else if (stepPadre.controls['modo'].value === 'nuevo') {
            <div class="grid">
              <mat-form-field appearance="outline">
                <mat-label>DNI</mat-label>
                <input matInput formControlName="dni" maxlength="8" inputmode="numeric" />
                @if (stepPadre.controls['dni'].invalid && stepPadre.controls['dni'].touched) {
                  <mat-error>DNI de 8 digitos</mat-error>
                }
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Nombres</mat-label>
                <input matInput formControlName="nombres" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Apellidos</mat-label>
                <input matInput formControlName="apellidos" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Telefono</mat-label>
                <input matInput formControlName="telefono" maxlength="20" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Email</mat-label>
                <input matInput type="email" formControlName="email" />
              </mat-form-field>
            </div>
          }
          <div class="step-actions">
            <button mat-button matStepperPrevious>Atras</button>
            <button mat-raised-button color="primary" matStepperNext [disabled]="!padrePasoValido()">Siguiente</button>
          </div>
        </form>
      </mat-step>
      <mat-step [stepControl]="stepMatricula" label="Datos de matricula">
        <form [formGroup]="stepMatricula">
          <div class="grid">
            <mat-form-field appearance="outline">
              <mat-label>Periodo</mat-label>
              <mat-select formControlName="periodo_id" (selectionChange)="onPeriodoSeccionChange()">
                @for (p of periodos(); track p.id) {
                  <mat-option [value]="p.id">{{ p.nombre }} {{ p.activo ? '(activo)' : '' }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Tipo de matricula</mat-label>
              <mat-select formControlName="tipo_matricula_id">
                @for (t of tipos(); track t.id) {
                  <mat-option [value]="t.id">{{ t.nombre }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Nivel</mat-label>
              <mat-select formControlName="nivel_id">
                @for (n of niveles(); track n.id) {
                  <mat-option [value]="n.id">{{ n.nombre }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Grado</mat-label>
              <mat-select formControlName="grado_id">
                @for (g of gradosFiltradosMat(); track g.id) {
                  <mat-option [value]="g.id">{{ g.nombre }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Seccion</mat-label>
              <mat-select formControlName="seccion_id" (selectionChange)="onPeriodoSeccionChange()">
                @for (s of seccionesFiltradas(); track s.id) {
                  <mat-option [value]="s.id">{{ s.nombre }} ({{ s.turno }})</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Fecha</mat-label>
              <input matInput type="date" formControlName="fecha" />
              @if (stepMatricula.controls['fecha'].invalid && stepMatricula.controls['fecha'].touched) {
                <mat-error>Debe estar dentro del periodo</mat-error>
              }
            </mat-form-field>
          </div>
          @if (vacantesLoading()) {
            <p class="muted"><mat-spinner diameter="18"></mat-spinner> Consultando vacantes…</p>
          } @else if (vacantes()) {
            <p class="vacantes" [class.sin]="vacantes()?.disponibles === 0">
              <mat-icon>{{ (vacantes()?.disponibles ?? 0) > 0 ? 'event_available' : 'event_busy' }}</mat-icon>
              {{ vacantes()?.disponibles }} vacantes disponibles de {{ vacantes()?.vacantes }} ({{ vacantes()?.ocupadas }} ocupadas)
            </p>
          }
          @if (duplicada()) {
            <p class="error">El estudiante ya tiene matricula en este periodo.</p>
          }
          <div class="step-actions">
            <button mat-button matStepperPrevious>Atras</button>
            <button mat-raised-button color="primary" matStepperNext [disabled]="!matriculaPasoValida()">Siguiente</button>
          </div>
        </form>
      </mat-step>
      <mat-step label="Confirmacion">
        <mat-card>
          <mat-card-header><mat-card-title>Resumen</mat-card-title></mat-card-header>
          <mat-card-content>
            <dl>
              <dt>Estudiante</dt><dd>{{ resumenEstudiante() }}</dd>
              <dt>Padre</dt><dd>{{ resumenPadre() }}</dd>
              <dt>Periodo</dt><dd>{{ resumenPeriodo() }}</dd>
              <dt>Seccion</dt><dd>{{ resumenSeccion() }}</dd>
              <dt>Tipo</dt><dd>{{ resumenTipo() }}</dd>
              <dt>Fecha</dt><dd>{{ stepMatricula.controls['fecha'].value }}</dd>
            </dl>
          </mat-card-content>
        </mat-card>
        <div class="step-actions">
          <button mat-button matStepperPrevious>Atras</button>
          <a mat-button routerLink="/matriculas">Cancelar</a>
          <button mat-raised-button color="primary" (click)="onRegistrar()" [disabled]="saving()">
            @if (saving()) { <mat-spinner diameter="20"></mat-spinner> } @else { <span><mat-icon>save</mat-icon> Registrar matricula</span> }
          </button>
        </div>
      </mat-step>
    </mat-stepper>
  `,
  styles: [`
    h1 { color: #1E3A8A; }
    mat-radio-group { display: flex; gap: 1rem; margin: 1rem 0; flex-wrap: wrap; }
    .full-width { width: 100%; margin-top: 0.5rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; margin-top: 0.5rem; }
    .muted { color: #64748b; }
    .step-actions { display: flex; gap: 0.5rem; margin-top: 1rem; }
    .vacantes { display: flex; align-items: center; gap: 0.5rem; color: #15803d; font-weight: 500; }
    .vacantes.sin { color: #b91c1c; }
    .error { color: #b91c1c; font-weight: 500; }
    dl { display: grid; grid-template-columns: 130px 1fr; gap: 0.25rem 1rem; margin: 0; }
    dt { color: #64748b; }
    dd { margin: 0; }
  `],
})
export class MatriculasWizardComponent implements OnInit {
  saving = signal(false);
  niveles = signal<Nivel[]>([]);
  grados = signal<Grado[]>([]);
  gradosFiltradosMat = signal<Grado[]>([]);
  periodos = signal<Periodo[]>([]);
  secciones = signal<Seccion[]>([]);
  seccionesFiltradas = signal<Seccion[]>([]);
  tipos = signal<TipoMatricula[]>([]);
  vacantes = signal<VacantesInfo | null>(null);
  vacantesLoading = signal(false);
  duplicada = signal(false);
  matriculasExistentes: Matricula[] = [];

  estudiantes: Estudiante[] = [];
  padres: Padre[] = [];
  estSeleccionado = signal<Estudiante | null>(null);
  padreSeleccionado = signal<Padre | null>(null);
  estSearch = new FormControl('', { nonNullable: true });
  padreSearch = new FormControl('', { nonNullable: true });
  estFiltrados$!: Observable<Estudiante[]>;
  padresFiltrados$!: Observable<Padre[]>;

  stepEstudiante = new FormGroup({
    modo: new FormControl<'existente' | 'nuevo'>('existente', { nonNullable: true, validators: [Validators.required] }),
    dni: new FormControl('', { nonNullable: true }),
    nombres: new FormControl('', { nonNullable: true }),
    apellidos: new FormControl('', { nonNullable: true }),
    fecha_nacimiento: new FormControl('', { nonNullable: true }),
    sexo: new FormControl<'M' | 'F' | ''>('', { nonNullable: true }),
    nivel_id: new FormControl<number | null>(null),
  });

  stepPadre = new FormGroup({
    modo: new FormControl<'existente' | 'nuevo' | 'ninguno'>('existente', { nonNullable: true, validators: [Validators.required] }),
    dni: new FormControl('', { nonNullable: true }),
    nombres: new FormControl('', { nonNullable: true }),
    apellidos: new FormControl('', { nonNullable: true }),
    telefono: new FormControl('', { nonNullable: true }),
    email: new FormControl('', { nonNullable: true }),
  });

  stepMatricula = new FormGroup({
    periodo_id: new FormControl<number | null>(null, { validators: [Validators.required] }),
    tipo_matricula_id: new FormControl<number | null>(null, { validators: [Validators.required] }),
    nivel_id: new FormControl<number | null>(null, { validators: [Validators.required] }),
    grado_id: new FormControl<number | null>(null, { validators: [Validators.required] }),
    seccion_id: new FormControl<number | null>(null, { validators: [Validators.required] }),
    fecha: new FormControl(toISODate(new Date()), { nonNullable: true, validators: [Validators.required] }),
    observaciones: new FormControl('', { nonNullable: true }),
  });

  constructor(
    private matriculas: MatriculaService,
    private estudiantesService: EstudianteService,
    private padresService: PadreService,
    private catalogos: CatalogosService,
    private router: Router,
    private snack: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.estFiltrados$ = this.estSearch.valueChanges.pipe(startWith(''), map((v) => this.filtrarEst(typeof v === 'string' ? v : '')));
    this.padresFiltrados$ = this.padreSearch.valueChanges.pipe(startWith(''), map((v) => this.filtrarPadres(typeof v === 'string' ? v : '')));
    this.onModoEstudianteChange();
    this.onModoPadreChange();
    this.stepMatricula.controls['nivel_id'].valueChanges.subscribe((nivelId) => {
      const n = nivelId ? Number(nivelId) : null;
      this.gradosFiltradosMat.set((this.grados() ?? []).filter((g) => !n || Number(g.nivel_id) === n));
      this.stepMatricula.controls['grado_id'].setValue(null);
      this.stepMatricula.controls['seccion_id'].setValue(null);
      this.seccionesFiltradas.set([]);
      this.vacantes.set(null);
    });
    this.stepMatricula.controls['grado_id'].valueChanges.subscribe((gradoId) => {
      const g = gradoId ? Number(gradoId) : null;
      this.seccionesFiltradas.set((this.secciones() ?? []).filter((s) => !g || Number(s.grado_id) === g));
      this.stepMatricula.controls['seccion_id'].setValue(null);
      this.vacantes.set(null);
    });
    this.catalogos.getNiveles().subscribe({ next: (r) => this.niveles.set(Array.isArray(r) ? r : []) });
    this.catalogos.getGrados().subscribe({ next: (r) => this.grados.set(Array.isArray(r) ? r : []) });
    this.catalogos.getSecciones().subscribe({ next: (r) => this.secciones.set(Array.isArray(r) ? r : []) });
    this.catalogos.getTiposMatricula().subscribe({ next: (r) => this.tipos.set(Array.isArray(r) ? r : []) });
    this.catalogos.getPeriodos().subscribe({
      next: (r) => {
        const list = Array.isArray(r) ? r : [];
        this.periodos.set(list);
        const activo = list.find((p) => p.activo);
        if (activo) this.stepMatricula.controls['periodo_id'].setValue(activo.id);
      },
    });
    this.estudiantesService.getAll().subscribe({ next: (r) => { this.estudiantes = Array.isArray(r) ? r : []; } });
    this.padresService.getAll().subscribe({ next: (r) => { this.padres = Array.isArray(r) ? r : []; } });
    this.matriculas.getAll().subscribe({ next: (r) => { this.matriculasExistentes = Array.isArray(r) ? r : []; } });
  }

  private filtrarEst(texto: string): Estudiante[] {
    const t = texto.trim().toLowerCase();
    if (!t) return this.estudiantes.slice(0, 10);
    return this.estudiantes.filter((e) => `${e.dni} ${e.nombres} ${e.apellidos}`.toLowerCase().includes(t)).slice(0, 10);
  }

  private filtrarPadres(texto: string): Padre[] {
    const t = texto.trim().toLowerCase();
    if (!t) return this.padres.slice(0, 10);
    return this.padres.filter((p) => `${p.dni} ${p.nombres} ${p.apellidos}`.toLowerCase().includes(t)).slice(0, 10);
  }

  displayEst = (e: Estudiante | string | null): string => {
    if (!e || typeof e === 'string') return typeof e === 'string' ? e : '';
    return `${e.nombres} ${e.apellidos} (DNI ${e.dni})`;
  };

  displayPadre = (p: Padre | string | null): string => {
    if (!p || typeof p === 'string') return typeof p === 'string' ? p : '';
    return `${p.nombres} ${p.apellidos} (DNI ${p.dni})`;
  };

  onEstSelected(e: Estudiante): void {
    this.estSeleccionado.set(e);
    this.verificarDuplicada();
  }

  onPadreSelected(p: Padre): void {
    this.padreSeleccionado.set(p);
  }

  onModoEstudianteChange(): void {
    const modo = this.stepEstudiante.controls['modo'].value;
    const nuevo = modo === 'nuevo';
    const req = [Validators.required];
    this.stepEstudiante.controls['dni'].setValidators(nuevo ? [Validators.required, Validators.pattern(/^\d{8}$/)] : []);
    this.stepEstudiante.controls['nombres'].setValidators(nuevo ? [...req, Validators.maxLength(100)] : []);
    this.stepEstudiante.controls['apellidos'].setValidators(nuevo ? [...req, Validators.maxLength(100)] : []);
    this.stepEstudiante.controls['nivel_id'].setValidators(nuevo ? req : []);
    Object.values(this.stepEstudiante.controls).forEach((c) => c.updateValueAndValidity());
    if (!nuevo) this.estSeleccionado.set(null);
    this.verificarDuplicada();
  }

  onModoPadreChange(): void {
    const modo = this.stepPadre.controls['modo'].value;
    const nuevo = modo === 'nuevo';
    const req = [Validators.required];
    this.stepPadre.controls['dni'].setValidators(nuevo ? [Validators.required, Validators.pattern(/^\d{8}$/)] : []);
    this.stepPadre.controls['nombres'].setValidators(nuevo ? [...req, Validators.maxLength(100)] : []);
    this.stepPadre.controls['apellidos'].setValidators(nuevo ? [...req, Validators.maxLength(100)] : []);
    Object.values(this.stepPadre.controls).forEach((c) => c.updateValueAndValidity());
    if (modo !== 'existente') this.padreSeleccionado.set(null);
  }

  estudiantePasoValido(): boolean {
    if (this.stepEstudiante.controls['modo'].value === 'existente') return !!this.estSeleccionado();
    return this.stepEstudiante.valid;
  }

  padrePasoValido(): boolean {
    const modo = this.stepPadre.controls['modo'].value;
    if (modo === 'ninguno') return !!this.estSeleccionado()?.apoderado_id;
    if (modo === 'existente') return !!this.padreSeleccionado();
    return this.stepPadre.valid;
  }

  onPeriodoSeccionChange(): void {
    this.verificarDuplicada();
    const seccionId = this.stepMatricula.controls['seccion_id'].value;
    if (!seccionId) {
      this.vacantes.set(null);
      return;
    }
    this.vacantesLoading.set(true);
    this.matriculas.getVacantes(Number(seccionId)).subscribe({
      next: (v) => {
        this.vacantes.set(v);
        this.vacantesLoading.set(false);
      },
      error: () => {
        this.vacantes.set(null);
        this.vacantesLoading.set(false);
      },
    });
  }

  private verificarDuplicada(): void {
    const periodoId = this.stepMatricula.controls['periodo_id'].value;
    const estId = this.estSeleccionado()?.id;
    this.duplicada.set(!!(estId && periodoId && this.matriculasExistentes.some(
      (m) => Number(m.estudiante_id) === Number(estId) && Number(m.periodo_id) === Number(periodoId),
    )));
  }

  private fechaEnPeriodo(): boolean {
    const periodoId = this.stepMatricula.controls['periodo_id'].value;
    const fecha = this.stepMatricula.controls['fecha'].value;
    if (!periodoId || !fecha) return false;
    const p = (this.periodos() ?? []).find((x) => Number(x.id) === Number(periodoId));
    if (!p?.fecha_inicio || !p?.fecha_fin) return true;
    return fecha >= p.fecha_inicio && fecha <= p.fecha_fin;
  }

  matriculaPasoValida(): boolean {
    if (!this.stepMatricula.valid) return false;
    if (!this.fechaEnPeriodo()) return false;
    if (this.duplicada()) return false;
    const v = this.vacantes();
    if (v && v.disponibles <= 0) return false;
    return true;
  }

  resumenEstudiante(): string {
    if (this.stepEstudiante.controls['modo'].value === 'existente') {
      const e = this.estSeleccionado();
      return e ? `${e.nombres} ${e.apellidos} (DNI ${e.dni})` : '—';
    }
    const v = this.stepEstudiante.getRawValue();
    return `${v.nombres} ${v.apellidos} (DNI ${v.dni}) [nuevo]`;
  }

  resumenPadre(): string {
    const modo = this.stepPadre.controls['modo'].value;
    if (modo === 'ninguno') return 'Sin padre (usa apoderado del estudiante)';
    if (modo === 'existente') {
      const p = this.padreSeleccionado();
      return p ? `${p.nombres} ${p.apellidos} (DNI ${p.dni})` : '—';
    }
    const v = this.stepPadre.getRawValue();
    return `${v.nombres} ${v.apellidos} (DNI ${v.dni}) [nuevo]`;
  }

  resumenPeriodo(): string {
    const id = this.stepMatricula.controls['periodo_id'].value;
    return (this.periodos() ?? []).find((p) => Number(p.id) === Number(id))?.nombre ?? '—';
  }

  resumenSeccion(): string {
    const id = this.stepMatricula.controls['seccion_id'].value;
    const s = (this.secciones() ?? []).find((x) => Number(x.id) === Number(id));
    return s ? `${s.grado?.nombre ?? ''} ${s.nombre} (${s.turno})` : '—';
  }

  resumenTipo(): string {
    const id = this.stepMatricula.controls['tipo_matricula_id'].value;
    return (this.tipos() ?? []).find((t) => Number(t.id) === Number(id))?.nombre ?? '—';
  }

  onRegistrar(): void {
    if (!this.estudiantePasoValido() || !this.padrePasoValido() || !this.matriculaPasoValida()) {
      this.snack.open('Complete todos los pasos antes de registrar', 'Cerrar', { duration: 4000 });
      return;
    }
    const modoEst = this.stepEstudiante.controls['modo'].value;
    const modoPadre = this.stepPadre.controls['modo'].value;
    const ve = this.stepEstudiante.getRawValue();
    const vp = this.stepPadre.getRawValue();
    const vm = this.stepMatricula.getRawValue();

    const estudiante: Record<string, unknown> = modoEst === 'existente'
      ? { modo: 'existente', id: this.estSeleccionado()?.id }
      : {
          modo: 'nuevo', dni: ve.dni, nombres: ve.nombres, apellidos: ve.apellidos,
          fecha_nacimiento: ve.fecha_nacimiento || null, sexo: ve.sexo || null,
          nivel_id: ve.nivel_id ? Number(ve.nivel_id) : null,
        };

    let padre: Record<string, unknown> | null = null;
    if (modoPadre === 'existente') padre = { modo: 'existente', id: this.padreSeleccionado()?.id };
    else if (modoPadre === 'nuevo') padre = { modo: 'nuevo', dni: vp.dni, nombres: vp.nombres, apellidos: vp.apellidos, telefono: vp.telefono || null, email: vp.email || null };

    const payload: Record<string, unknown> = {
      estudiante,
      padre,
      matricula: {
        seccion_id: Number(vm.seccion_id),
        periodo_id: Number(vm.periodo_id),
        tipo_matricula_id: Number(vm.tipo_matricula_id),
        fecha: vm.fecha,
        observaciones: vm.observaciones || null,
      },
    };

    this.saving.set(true);
    this.matriculas.registro(payload).subscribe({
      next: (m) => {
        this.saving.set(false);
        this.snack.open('Matricula registrada correctamente', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/matriculas', m.id]);
      },
      error: (err) => {
        this.saving.set(false);
        this.snack.open(extractApiError(err, 'No se pudo registrar la matricula'), 'Cerrar', { duration: 5000 });
      },
    });
  }
}
