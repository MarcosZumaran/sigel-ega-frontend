import { Component, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatriculaService, VacantesInfo } from './services/matricula.service';
import { CatalogosService } from '../../core/services/catalogos.service';
import { Periodo } from '../../core/models/periodo.model';
import { Seccion } from '../../core/models/seccion.model';
import { Grado } from '../../core/models/grado.model';
import { Nivel } from '../../core/models/catalogos.model';
import { TipoMatricula } from '../../core/models/matricula.model';
import { extractApiError } from '../../core/utils/api-error';
import { BackButtonComponent } from '../../shared/components/back-button.component';

@Component({
  selector: 'app-matriculas-form',
  standalone: true,
  imports: [BackButtonComponent, ReactiveFormsModule, RouterLink, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <app-back-button />
    <h1>Editar matricula #{{ id }}</h1>
    @if (loading()) {
      <div class="loading"><mat-spinner diameter="40"></mat-spinner></div>
    } @else {
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <mat-card>
          <mat-card-content class="grid">
            <mat-form-field appearance="outline">
              <mat-label>Periodo</mat-label>
              <mat-select formControlName="periodo_id">
                @for (p of periodos(); track p.id) {
                  <mat-option [value]="p.id">{{ p.nombre }}</mat-option>
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
                @for (g of gradosFiltrados(); track g.id) {
                  <mat-option [value]="g.id">{{ g.nombre }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Seccion</mat-label>
              <mat-select formControlName="seccion_id" (selectionChange)="onSeccionChange()">
                @for (s of seccionesFiltradas(); track s.id) {
                  <mat-option [value]="s.id">{{ s.nombre }} ({{ s.turno }})</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Fecha</mat-label>
              <input matInput type="date" formControlName="fecha" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-row">
              <mat-label>Observaciones</mat-label>
              <textarea matInput formControlName="observaciones" rows="2"></textarea>
            </mat-form-field>
          @if (vacantes()) {
            <p class="vacantes">{{ vacantes()?.disponibles }} vacantes disponibles de {{ vacantes()?.vacantes }}</p>
          }
        </mat-card-content>
        </mat-card>
        <div class="actions">
          <a mat-button [routerLink]="['/matriculas', id]">Cancelar</a>
          <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || saving()">
            @if (saving()) { <mat-spinner diameter="20"></mat-spinner> } @else { <span>Guardar</span> }
          </button>
        </div>
      </form>
    }
  `,
  styles: [`
    h1 { color: #1E3A8A; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; }
    .full-row { grid-column: 1 / -1; }
    .vacantes { color: #15803d; font-weight: 500; }
    .loading { display: flex; justify-content: center; padding: 2rem; }
    .actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin: 1rem 0 2rem; }
  `],
})
export class MatriculasFormComponent implements OnInit {
  loading = signal(true);
  saving = signal(false);
  submitted = false;

  hasUnsavedChanges(): boolean {
    return !this.submitted && this.form.dirty;
  }
  id = 0;
  periodos = signal<Periodo[]>([]);
  tipos = signal<TipoMatricula[]>([]);
  niveles = signal<Nivel[]>([]);
  grados = signal<Grado[]>([]);
  gradosFiltrados = signal<Grado[]>([]);
  secciones = signal<Seccion[]>([]);
  seccionesFiltradas = signal<Seccion[]>([]);
  vacantes = signal<VacantesInfo | null>(null);

  form = new FormGroup({
    periodo_id: new FormControl<number | null>(null, { validators: [Validators.required] }),
    tipo_matricula_id: new FormControl<number | null>(null, { validators: [Validators.required] }),
    nivel_id: new FormControl<number | null>(null, { validators: [Validators.required] }),
    grado_id: new FormControl<number | null>(null, { validators: [Validators.required] }),
    seccion_id: new FormControl<number | null>(null, { validators: [Validators.required] }),
    fecha: new FormControl('', { nonNullable: true }),
    observaciones: new FormControl('', { nonNullable: true }),
  });

  constructor(
    private service: MatriculaService,
    private catalogos: CatalogosService,
    private route: ActivatedRoute,
    private router: Router,
    private snack: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.form.controls['nivel_id'].valueChanges.subscribe((nivelId) => {
      const n = nivelId ? Number(nivelId) : null;
      this.gradosFiltrados.set((this.grados() ?? []).filter((g) => !n || Number(g.nivel_id) === n));
    });
    this.form.controls['grado_id'].valueChanges.subscribe((gradoId) => {
      const g = gradoId ? Number(gradoId) : null;
      this.seccionesFiltradas.set((this.secciones() ?? []).filter((s) => !g || Number(s.grado_id) === g));
    });
    this.catalogos.getPeriodos().subscribe({ next: (r) => this.periodos.set(Array.isArray(r) ? r : []) });
    this.catalogos.getTiposMatricula().subscribe({ next: (r) => this.tipos.set(Array.isArray(r) ? r : []) });
    this.catalogos.getNiveles().subscribe({ next: (r) => this.niveles.set(Array.isArray(r) ? r : []) });
    this.catalogos.getGrados().subscribe({ next: (r) => this.grados.set(Array.isArray(r) ? r : []) });
    this.catalogos.getSecciones().subscribe({ next: (r) => this.secciones.set(Array.isArray(r) ? r : []) });
    this.service.getById(this.id).subscribe({
      next: (m) => {
        const nivelId = m.seccion?.grado?.nivel_id ?? null;
        this.form.patchValue({
          periodo_id: m.periodo_id,
          tipo_matricula_id: m.tipo_matricula_id,
          nivel_id: nivelId,
          grado_id: m.seccion?.grado_id ?? null,
          seccion_id: m.seccion_id,
          fecha: (m.fecha ?? '').substring(0, 10),
          observaciones: m.observaciones ?? '',
        });
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.snack.open(extractApiError(err, 'No se pudo cargar la matricula'), 'Cerrar', { duration: 4000 });
      },
    });
  }

  onSeccionChange(): void {
    const seccionId = this.form.controls['seccion_id'].value;
    if (!seccionId) {
      this.vacantes.set(null);
      return;
    }
    this.service.getVacantes(Number(seccionId)).subscribe({
      next: (v) => this.vacantes.set(v),
      error: () => this.vacantes.set(null),
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.service.update(this.id, {
      periodo_id: Number(v.periodo_id),
      tipo_matricula_id: Number(v.tipo_matricula_id),
      seccion_id: Number(v.seccion_id),
      fecha: v.fecha || null,
      observaciones: v.observaciones || null,
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.snack.open('Matricula actualizada correctamente', 'Cerrar', { duration: 3000 });
        this.submitted = true; this.form.markAsPristine(); this.router.navigate(['/matriculas', this.id]);
      },
      error: (err) => {
        this.saving.set(false);
        this.snack.open(extractApiError(err, 'No se pudo guardar'), 'Cerrar', { duration: 5000 });
      },
    });
  }
}
