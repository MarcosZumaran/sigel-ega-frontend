import { Component, OnInit, signal } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map, Observable, startWith } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { EstudianteService } from './services/estudiante.service';
import { PadreService } from '../padres/services/padre.service';
import { CatalogosService } from '../../core/services/catalogos.service';
import { Nivel } from '../../core/models/catalogos.model';
import { Grado } from '../../core/models/grado.model';
import { Padre } from '../../core/models/padre.model';
import { extractApiError } from '../../core/utils/api-error';
import { BackButtonComponent } from '../../shared/components/back-button.component';

function edadValida(fecha: string): boolean {
  const n = new Date(fecha);
  if (isNaN(n.getTime())) return false;
  const hoy = new Date();
  let edad = hoy.getFullYear() - n.getFullYear();
  const m = hoy.getMonth() - n.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < n.getDate())) edad--;
  return edad >= 3 && edad <= 25;
}

@Component({
  selector: 'app-estudiantes-form',
  standalone: true,
  imports: [BackButtonComponent, ReactiveFormsModule, RouterLink, AsyncPipe, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatAutocompleteModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <app-back-button />
    <h1>{{ isEdit ? 'Editar estudiante' : 'Nuevo estudiante' }}</h1>
    @if (loading()) {
      <div class="loading"><mat-spinner diameter="40"></mat-spinner></div>
    } @else {
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <mat-card>
          <mat-card-header><mat-card-title>Datos personales</mat-card-title></mat-card-header>
          <mat-card-content class="grid">
            <mat-form-field appearance="outline">
              <mat-label>DNI</mat-label>
              <input matInput formControlName="dni" maxlength="8" inputmode="numeric" />
              @if (form.controls['dni'].invalid && form.controls['dni'].touched) {
                <mat-error>DNI de 8 digitos</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Codigo estudiante</mat-label>
              <input matInput formControlName="codigo_estudiante" maxlength="30" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Nombres</mat-label>
              <input matInput formControlName="nombres" />
              @if (form.controls['nombres'].invalid && form.controls['nombres'].touched) {
                <mat-error>Requerido (max 100)</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Apellidos</mat-label>
              <input matInput formControlName="apellidos" />
              @if (form.controls['apellidos'].invalid && form.controls['apellidos'].touched) {
                <mat-error>Requerido (max 100)</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Fecha de nacimiento</mat-label>
              <input matInput type="date" formControlName="fecha_nacimiento" />
              @if (form.controls['fecha_nacimiento'].invalid && form.controls['fecha_nacimiento'].touched) {
                <mat-error>Edad entre 3 y 25 años</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Sexo</mat-label>
              <mat-select formControlName="sexo">
                <mat-option value="M">Masculino</mat-option>
                <mat-option value="F">Femenino</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Direccion</mat-label>
              <input matInput formControlName="direccion" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Telefono</mat-label>
              <input matInput formControlName="telefono" maxlength="20" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" />
            </mat-form-field>
          </mat-card-content>
        </mat-card>
        <mat-card>
          <mat-card-header><mat-card-title>Datos academicos</mat-card-title></mat-card-header>
          <mat-card-content class="grid">
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
                @for (g of gradosFiltrados(); track g.id) {
                  <mat-option [value]="g.id">{{ g.nombre }}</mat-option>
                }
              </mat-select>
              @if (form.controls['grado_id'].invalid && form.controls['grado_id'].touched) {
                <mat-error>El grado debe corresponder al nivel</mat-error>
              }
            </mat-form-field>
          </mat-card-content>
        </mat-card>
        <mat-card>
          <mat-card-header><mat-card-title>Padre / Apoderado</mat-card-title></mat-card-header>
          <mat-card-content>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Buscar padre por DNI o apellidos</mat-label>
              <input matInput type="search" [formControl]="padreSearch" [matAutocomplete]="auto" />
              <mat-autocomplete #auto="matAutocomplete" [displayWith]="displayPadre" (optionSelected)="onPadreSelected($event.option.value)">
                @for (p of padresFiltrados$ | async; track p.id) {
                  <mat-option [value]="p">{{ p.nombres }} {{ p.apellidos }} (DNI {{ p.dni }})</mat-option>
                }
              </mat-autocomplete>
            </mat-form-field>
            @if (padreSeleccionado()) {
              <p class="muted">Padre: {{ padreSeleccionado()?.nombres }} {{ padreSeleccionado()?.apellidos }} — el estudiante heredara su apoderado #{{ padreSeleccionado()?.apoderado_id }}.</p>
            } @else {
              <p class="muted">Seleccione el padre para heredar su apoderado (se crea automaticamente si el padre aun no tiene).</p>
            }
          </mat-card-content>
        </mat-card>
        <div class="actions">
          <a mat-button routerLink="/estudiantes">Cancelar</a>
          <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || saving() || !padreSeleccionado()">
            @if (saving()) { <mat-spinner diameter="20"></mat-spinner> } @else { <span>Guardar</span> }
          </button>
        </div>
      </form>
    }
  `,
  styles: [`
    h1 { color: #1E3A8A; }
    mat-card { margin-bottom: 1rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; }
    .full-width { width: 100%; }
    .muted { color: #64748b; }
    .loading { display: flex; justify-content: center; padding: 2rem; }
    .actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin: 1rem 0 2rem; }
  `],
})
export class EstudiantesFormComponent implements OnInit {
  loading = signal(true);
  saving = signal(false);
  submitted = false;

  hasUnsavedChanges(): boolean {
    return !this.submitted && this.form.dirty;
  }
  isEdit = false;
  id = 0;
  niveles = signal<Nivel[]>([]);
  grados = signal<Grado[]>([]);
  gradosFiltrados = signal<Grado[]>([]);
  padres: Padre[] = [];
  padreSeleccionado = signal<Padre | null>(null);
  padreSearch = new FormControl('', { nonNullable: true });
  padresFiltrados$!: Observable<Padre[]>;

  form = new FormGroup({
    dni: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\d{8}$/)] }),
    codigo_estudiante: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(30)] }),
    nombres: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] }),
    apellidos: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] }),
    fecha_nacimiento: new FormControl('', { nonNullable: true }),
    sexo: new FormControl<'M' | 'F' | ''>('', { nonNullable: true }),
    direccion: new FormControl('', { nonNullable: true }),
    telefono: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(20)] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.email] }),
    nivel_id: new FormControl<number | null>(null),
    grado_id: new FormControl<number | null>(null),
  });

  constructor(
    private service: EstudianteService,
    private padresService: PadreService,
    private catalogos: CatalogosService,
    private route: ActivatedRoute,
    private router: Router,
    private snack: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id') ?? 0);
    this.isEdit = !!this.id;
    this.padresFiltrados$ = this.padreSearch.valueChanges.pipe(
      startWith(''),
      map((v) => this.filtrarPadres(typeof v === 'string' ? v : '')),
    );
    this.form.controls['nivel_id'].valueChanges.subscribe((nivelId) => {
      const nivelIdNum = nivelId ? Number(nivelId) : null;
      this.gradosFiltrados.set((this.grados() ?? []).filter((g) => !nivelIdNum || Number(g.nivel_id) === nivelIdNum));
      const gradoId = this.form.controls['grado_id'].value;
      if (gradoId && nivelIdNum) {
        const g = (this.grados() ?? []).find((x) => Number(x.id) === Number(gradoId));
        if (g && Number(g.nivel_id) !== nivelIdNum) this.form.controls['grado_id'].setValue(null);
      }
    });
    this.catalogos.getNiveles().subscribe({ next: (r) => this.niveles.set(Array.isArray(r) ? r : []) });
    this.catalogos.getGrados().subscribe({ next: (r) => this.grados.set(Array.isArray(r) ? r : []) });
    this.padresService.getAll().subscribe({ next: (r) => { this.padres = Array.isArray(r) ? r : []; } });
    if (this.isEdit) this.load();
    else this.loading.set(false);
  }

  private filtrarPadres(texto: string): Padre[] {
    const t = texto.trim().toLowerCase();
    if (!t) return this.padres.slice(0, 10);
    return this.padres.filter((p) => `${p.dni} ${p.nombres} ${p.apellidos}`.toLowerCase().includes(t)).slice(0, 10);
  }

  displayPadre = (p: Padre | string | null): string => {
    if (!p || typeof p === 'string') return typeof p === 'string' ? p : '';
    return `${p.nombres} ${p.apellidos} (DNI ${p.dni})`;
  };

  onPadreSelected(p: Padre): void {
    this.padreSeleccionado.set(p);
  }

  private load(): void {
    this.service.getById(this.id).subscribe({
      next: (e) => {
        this.form.patchValue({
          dni: e.dni ?? '',
          codigo_estudiante: e.codigo_estudiante ?? '',
          nombres: e.nombres,
          apellidos: e.apellidos,
          fecha_nacimiento: e.fecha_nacimiento ?? '',
          sexo: e.sexo ?? '',
          direccion: e.direccion ?? '',
          telefono: e.telefono ?? '',
          email: e.email ?? '',
          nivel_id: e.nivel_id ?? null,
          grado_id: e.grado_id ?? null,
        });
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.snack.open(extractApiError(err, 'No se pudo cargar el estudiante'), 'Cerrar', { duration: 4000 });
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid || !this.padreSeleccionado()) return;
    const fecha = this.form.controls['fecha_nacimiento'].value;
    if (fecha && !edadValida(fecha)) {
      this.snack.open('La edad debe estar entre 3 y 25 años', 'Cerrar', { duration: 4000 });
      return;
    }
    const nivelId = this.form.controls['nivel_id'].value ? Number(this.form.controls['nivel_id'].value) : null;
    const gradoId = this.form.controls['grado_id'].value ? Number(this.form.controls['grado_id'].value) : null;
    if (gradoId && nivelId) {
      const g = (this.grados() ?? []).find((x) => Number(x.id) === gradoId);
      if (g && Number(g.nivel_id) !== nivelId) {
        this.snack.open('El grado debe corresponder al nivel seleccionado', 'Cerrar', { duration: 4000 });
        return;
      }
    }
    const v = this.form.getRawValue();
    const payload: Record<string, unknown> = {
      dni: v.dni,
      codigo_estudiante: v.codigo_estudiante || null,
      nombres: v.nombres,
      apellidos: v.apellidos,
      fecha_nacimiento: v.fecha_nacimiento || null,
      sexo: v.sexo || null,
      direccion: v.direccion || null,
      telefono: v.telefono || null,
      email: v.email || null,
      nivel_id: nivelId,
      grado_id: gradoId,
      padre_id: this.padreSeleccionado()?.id,
    };
    this.saving.set(true);
    const req = this.isEdit ? this.service.update(this.id, payload) : this.service.create(payload);
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.snack.open('Estudiante guardado correctamente', 'Cerrar', { duration: 3000 });
        this.submitted = true; this.form.markAsPristine(); this.router.navigate(['/estudiantes']);
      },
      error: (err) => {
        this.saving.set(false);
        this.snack.open(extractApiError(err, 'No se pudo guardar el estudiante'), 'Cerrar', { duration: 5000 });
      },
    });
  }
}
