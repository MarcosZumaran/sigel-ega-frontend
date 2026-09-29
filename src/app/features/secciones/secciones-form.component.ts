import { Component, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { SeccionService } from './services/seccion.service';
import { CatalogosService } from '../../core/services/catalogos.service';
import { SeccionPayload, Turno } from '../../core/models/seccion.model';
import { Grado } from '../../core/models/grado.model';
import { Docente } from '../../core/models/catalogos.model';
import { extractApiError } from '../../core/utils/api-error';
import { BackButtonComponent } from '../../shared/components/back-button.component';

@Component({
  selector: 'app-secciones-form',
  standalone: true,
  imports: [BackButtonComponent, ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatSelectModule, MatRadioModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule, MatCardModule],
  template: `
    <app-back-button />
    <h1>{{ isEdit() ? 'Editar seccion' : 'Nueva seccion' }}</h1>
    <mat-card>
      <mat-card-content>
        @if (loading()) {
          <div class="loading"><mat-spinner diameter="40"></mat-spinner></div>
        } @else {
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>Grado</mat-label>
              <mat-select formControlName="grado_id">
                @for (g of grados(); track g.id) {
                  <mat-option [value]="g.id">{{ g.nivel?.nombre ?? '' }} - {{ g.nombre }}</mat-option>
                }
              </mat-select>
              @if (form.controls.grado_id.invalid && form.controls.grado_id.touched) {
                <mat-error>Seleccione un grado</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Nombre</mat-label>
              <input matInput formControlName="nombre" maxlength="10" placeholder="Ej. A" />
              @if (form.controls.nombre.invalid && form.controls.nombre.touched) {
                <mat-error>El nombre es requerido (max. 10)</mat-error>
              }
            </mat-form-field>
            <div>
              <label class="radio-label">Turno</label>
              <mat-radio-group formControlName="turno" class="radio-group">
                <mat-radio-button value="manana">Manana</mat-radio-button>
                <mat-radio-button value="tarde">Tarde</mat-radio-button>
              </mat-radio-group>
            </div>
            <mat-form-field appearance="outline">
              <mat-label>Vacantes</mat-label>
              <input matInput type="number" formControlName="vacantes" min="0" />
              @if (form.controls.vacantes.invalid && form.controls.vacantes.touched) {
                <mat-error>Vacantes debe ser 0 o mayor</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Docente (opcional)</mat-label>
              <mat-select formControlName="docente_id">
                <mat-option [value]="null">Sin asignar</mat-option>
                @for (d of docentes(); track d.id) {
                  <mat-option [value]="d.id">{{ d.nombres }} {{ d.apellidos }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <div class="form-actions">
              <a mat-button routerLink="/secciones">Cancelar</a>
              <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || saving()">
                @if (saving()) {
                  <mat-spinner diameter="20"></mat-spinner>
                } @else {
                  <span>Guardar</span>
                }
              </button>
            </div>
          </form>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    h1 { color: #1E3A8A; }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; }
    .form-actions { grid-column: 1 / -1; display: flex; justify-content: flex-end; gap: 0.5rem; }
    .loading { display: flex; justify-content: center; padding: 2rem; }
    .radio-label { display: block; font-size: 0.75rem; color: #475569; margin-bottom: 0.25rem; }
    .radio-group { display: flex; gap: 1rem; }
  `],
})
export class SeccionesFormComponent implements OnInit {
  loading = signal(true);
  saving = signal(false);
  submitted = false;

  hasUnsavedChanges(): boolean {
    return !this.submitted && this.form.dirty;
  }
  isEdit = signal(false);
  grados = signal<Grado[]>([]);
  docentes = signal<Docente[]>([]);
  private id: number | null = null;

  form = new FormGroup({
    grado_id: new FormControl<number | null>(null, { validators: [Validators.required] }),
    nombre: new FormControl('', { validators: [Validators.required, Validators.maxLength(10)], nonNullable: true }),
    turno: new FormControl<Turno>('manana', { validators: [Validators.required], nonNullable: true }),
    vacantes: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(0)] }),
    docente_id: new FormControl<number | null>(null),
  });

  constructor(private service: SeccionService, private catalogos: CatalogosService, private route: ActivatedRoute, private router: Router, private snack: MatSnackBar) {}

  ngOnInit(): void {
    forkJoin({ grados: this.catalogos.getGrados(), docentes: this.catalogos.getDocentes() }).subscribe({
      next: ({ grados, docentes }) => {
        this.grados.set(Array.isArray(grados) ? grados : []);
        this.docentes.set(Array.isArray(docentes) ? docentes : []);
        const param = this.route.snapshot.paramMap.get('id');
        if (param) {
          this.id = Number(param);
          this.isEdit.set(true);
          this.service.getById(this.id).subscribe({
            next: (s) => {
              this.form.patchValue({ grado_id: s.grado_id, nombre: s.nombre, turno: s.turno, vacantes: s.vacantes, docente_id: s.docente_id });
              this.loading.set(false);
            },
            error: (err) => {
              this.loading.set(false);
              this.snack.open(extractApiError(err, 'No se pudo cargar la seccion'), 'Cerrar', { duration: 4000 });
            },
          });
        } else {
          this.loading.set(false);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.snack.open(extractApiError(err, 'No se pudo cargar grados y docentes'), 'Cerrar', { duration: 4000 });
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const payload: SeccionPayload = {
      grado_id: v.grado_id as number,
      nombre: v.nombre,
      turno: v.turno,
      vacantes: v.vacantes as number,
      docente_id: v.docente_id,
    };
    this.saving.set(true);
    const req = this.isEdit() && this.id !== null
      ? this.service.update(this.id, payload)
      : this.service.create(payload);
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.snack.open('Seccion guardada correctamente', 'Cerrar', { duration: 3000 });
        this.submitted = true; this.form.markAsPristine(); this.router.navigate(['/secciones']);
      },
      error: (err) => {
        this.saving.set(false);
        this.snack.open(extractApiError(err, 'No se pudo guardar la seccion'), 'Cerrar', { duration: 4000 });
      },
    });
  }
}
