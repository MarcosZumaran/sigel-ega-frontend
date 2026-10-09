import { Component, Inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ActividadService } from './services/actividad.service';
import { CatalogosService } from '../../core/services/catalogos.service';
import { extractApiError } from '../../core/utils/api-error';
import type { Area } from '../../core/models/calificacion.model';

export interface ActividadFormData {
  competencia_id?: number;
  bimestre_id?: number;
  seccion_id?: number;
}

@Component({
  selector: 'app-actividad-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <h2 mat-dialog-title><mat-icon>assignment</mat-icon> Nueva actividad</h2>
    <mat-dialog-content>
      @if (cargando()) {
        <div class="center"><mat-spinner diameter="32" /></div>
      } @else {
        <form [formGroup]="form" class="form-grid">
          <mat-form-field appearance="outline" class="full">
            <mat-label>Competencia</mat-label>
            <mat-select formControlName="competencia_id" required>
              @for (c of competencias(); track c.id) {
                <mat-option [value]="c.id">{{ c.nombre }}</mat-option>
              }
            </mat-select>
            @if (form.controls['competencia_id'].invalid && form.controls['competencia_id'].touched) {
              <mat-error>Seleccione la competencia</mat-error>
            }
          </mat-form-field>
          <mat-form-field appearance="outline" class="full">
            <mat-label>Título de la actividad</mat-label>
            <input matInput formControlName="titulo" maxlength="200" placeholder="Ej.: Exposición sobre ecosistemas" />
            @if (form.controls['titulo'].invalid && form.controls['titulo'].touched) {
              <mat-error>Mínimo 3 caracteres</mat-error>
            }
          </mat-form-field>
          <mat-form-field appearance="outline" class="full">
            <mat-label>Descripción (opcional)</mat-label>
            <textarea matInput formControlName="descripcion" rows="2"></textarea>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full">
            <mat-label>Fecha</mat-label>
            <input matInput type="date" formControlName="fecha" />
          </mat-form-field>
        </form>
      }
      @if (error()) { <p class="error">{{ error() }}</p> }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" (click)="guardar()" [disabled]="guardando() || !form.valid">
        @if (guardando()) { <mat-spinner diameter="18" /> } @else { Crear actividad }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2[mat-dialog-title] { display: flex; align-items: center; gap: 0.5rem; }
    .form-grid { display: grid; gap: 0.25rem; padding-top: 0.5rem; }
    .full { width: 100%; }
    .center { display: flex; justify-content: center; padding: 1.5rem; }
    .error { color: #C8102E; margin: 0.5rem 0 0; }
  `],
})
export class ActividadFormDialogComponent implements OnInit {
  cargando = signal(true);
  guardando = signal(false);
  error = signal<string | null>(null);
  competencias = signal<Area[]>([]);

  form = new FormGroup({
    competencia_id: new FormControl<number | null>(null, Validators.required),
    titulo: new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]),
    descripcion: new FormControl<string | null>(null),
    fecha: new FormControl(this.hoy(), Validators.required),
  });

  constructor(
    private ref: MatDialogRef<ActividadFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ActividadFormData,
    private actividades: ActividadService,
    private catalogos: CatalogosService,
  ) {}

  ngOnInit(): void {
    this.form.patchValue({ competencia_id: this.data.competencia_id ?? null });
    this.catalogos
      .getAreas()
      .pipe(catchError(() => of([] as Area[])))
      .subscribe((areas) => {
        this.competencias.set(areas.filter((a) => a.tipo === 'competencia'));
        this.cargando.set(false);
      });
  }

  guardar(): void {
    if (!this.form.valid || this.guardando()) return;
    if (!this.data.bimestre_id || !this.data.seccion_id) {
      this.error.set('Falta el contexto (bimestre o sección).');
      return;
    }
    this.guardando.set(true);
    this.error.set(null);
    const v = this.form.value;
    this.actividades
      .create({
        competencia_id: v.competencia_id!,
        bimestre_id: this.data.bimestre_id,
        seccion_id: this.data.seccion_id,
        titulo: v.titulo!,
        descripcion: v.descripcion ?? null,
        fecha: v.fecha!,
      })
      .subscribe({
        next: (act) => this.ref.close(act),
        error: (err) => {
          this.error.set(extractApiError(err, 'No se pudo crear la actividad.'));
          this.guardando.set(false);
        },
      });
  }

  private hoy(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
