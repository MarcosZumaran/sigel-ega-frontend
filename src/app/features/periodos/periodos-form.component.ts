import { Component, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { PeriodoService } from './services/periodo.service';
import { PeriodoPayload } from '../../core/models/periodo.model';
import { extractApiError } from '../../core/utils/api-error';
import { BackButtonComponent } from '../../shared/components/back-button.component';

@Component({
  selector: 'app-periodos-form',
  standalone: true,
  imports: [BackButtonComponent, ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatCheckboxModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule, MatCardModule],
  template: `
    <app-back-button />
    <h1>{{ isEdit() ? 'Editar periodo' : 'Nuevo periodo' }}</h1>
    <mat-card>
      <mat-card-content>
        @if (loading()) {
          <div class="loading"><mat-spinner diameter="40"></mat-spinner></div>
        } @else {
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>Nombre</mat-label>
              <input matInput formControlName="nombre" maxlength="50" />
              @if (form.controls.nombre.invalid && form.controls.nombre.touched) {
                <mat-error>El nombre es requerido (max. 50)</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Anio</mat-label>
              <input matInput type="number" formControlName="anio" />
              @if (form.controls.anio.invalid && form.controls.anio.touched) {
                <mat-error>Anio entre 2000 y 2100</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Fecha inicio</mat-label>
              <input matInput type="date" formControlName="fecha_inicio" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Fecha fin</mat-label>
              <input matInput type="date" formControlName="fecha_fin" />
            </mat-form-field>
            <mat-checkbox formControlName="activo">Activo</mat-checkbox>
            <div class="form-actions">
              <a mat-button routerLink="/periodos">Cancelar</a>
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
  `],
})
export class PeriodosFormComponent implements OnInit {
  loading = signal(false);
  saving = signal(false);
  submitted = false;

  hasUnsavedChanges(): boolean {
    return !this.submitted && this.form.dirty;
  }
  isEdit = signal(false);
  private id: number | null = null;

  form = new FormGroup({
    nombre: new FormControl('', { validators: [Validators.required, Validators.maxLength(50)], nonNullable: true }),
    anio: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(2000), Validators.max(2100)] }),
    fecha_inicio: new FormControl<string | null>(null),
    fecha_fin: new FormControl<string | null>(null),
    activo: new FormControl(false, { nonNullable: true }),
  });

  constructor(private service: PeriodoService, private route: ActivatedRoute, private router: Router, private snack: MatSnackBar) {}

  ngOnInit(): void {
    const param = this.route.snapshot.paramMap.get('id');
    if (param) {
      this.id = Number(param);
      this.isEdit.set(true);
      this.loading.set(true);
      this.service.getById(this.id).subscribe({
        next: (p) => {
          this.form.patchValue({
            nombre: p.nombre,
            anio: p.anio,
            fecha_inicio: p.fecha_inicio,
            fecha_fin: p.fecha_fin,
            activo: p.activo,
          });
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.snack.open(extractApiError(err, 'No se pudo cargar el periodo'), 'Cerrar', { duration: 4000 });
        },
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const payload: PeriodoPayload = {
      nombre: v.nombre,
      anio: v.anio as number,
      fecha_inicio: v.fecha_inicio || null,
      fecha_fin: v.fecha_fin || null,
      activo: v.activo,
    };
    this.saving.set(true);
    const req = this.isEdit() && this.id !== null
      ? this.service.update(this.id, payload)
      : this.service.create(payload);
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.snack.open('Periodo guardado correctamente', 'Cerrar', { duration: 3000 });
        this.submitted = true; this.form.markAsPristine(); this.router.navigate(['/periodos']);
      },
      error: (err) => {
        this.saving.set(false);
        this.snack.open(extractApiError(err, 'No se pudo guardar el periodo'), 'Cerrar', { duration: 4000 });
      },
    });
  }
}
