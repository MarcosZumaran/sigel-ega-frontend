import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SeccionService } from '../../features/secciones/services/seccion.service';
import { CatalogosService } from '../../core/services/catalogos.service';
import { Seccion, SeccionPayload, Turno } from '../../core/models/seccion.model';
import { Docente } from '../../core/models/catalogos.model';
import { Grado } from '../../core/models/grado.model';
import { extractApiError } from '../../core/utils/api-error';

export interface SeccionFormData {
  seccion?: Seccion | null;
}

@Component({
  selector: 'app-seccion-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressSpinnerModule],
  template: `
    <h2 mat-dialog-title>{{ data.seccion ? 'Editar sección' : 'Nueva sección' }}</h2>
    <form [formGroup]="form" (ngSubmit)="guardar()">
      <mat-dialog-content>
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Grado</mat-label>
          <mat-select formControlName="grado_id">
            @for (g of grados(); track g.id) {
              <mat-option [value]="g.id">{{ g.nombre }}</mat-option>
            }
          </mat-select>
          @if (form.controls.grado_id.invalid && form.controls.grado_id.touched) {
            <mat-error>Seleccione un grado</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="nombre" maxlength="10" placeholder="Ej. A" />
          @if (form.controls.nombre.invalid && form.controls.nombre.touched) {
            <mat-error>Ingrese el nombre</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Turno</mat-label>
          <mat-select formControlName="turno">
            <mat-option value="manana">Mañana</mat-option>
            <mat-option value="tarde">Tarde</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Vacantes</mat-label>
          <input matInput type="number" formControlName="vacantes" min="1" max="60" />
          @if (form.controls.vacantes.invalid && form.controls.vacantes.touched) {
            <mat-error>Vacantes entre 1 y 60</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Docente (opcional)</mat-label>
          <mat-select formControlName="docente_id">
            <mat-option [value]="null">Sin asignar</mat-option>
            @for (d of docentes(); track d.id) {
              <mat-option [value]="d.id">{{ d.nombres }} {{ d.apellidos }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        @if (error()) {
          <p class="text-sm text-red-600">{{ error() }}</p>
        }
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancelar</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || saving()">
          @if (saving()) { <mat-spinner diameter="18"></mat-spinner> }
          @else { <span>Guardar</span> }
        </button>
      </mat-dialog-actions>
    </form>
  `,
})
export class SeccionFormDialogComponent implements OnInit {
  data = inject<SeccionFormData>(MAT_DIALOG_DATA);
  private ref = inject(MatDialogRef<SeccionFormDialogComponent>);
  private secciones = inject(SeccionService);
  private catalogos = inject(CatalogosService);

  grados = signal<Grado[]>([]);
  docentes = signal<Docente[]>([]);
  saving = signal(false);
  error = signal<string | null>(null);

  form = new FormGroup({
    grado_id: new FormControl<number | null>(null, Validators.required),
    nombre: new FormControl('', [Validators.required, Validators.maxLength(10)]),
    turno: new FormControl<Turno>('manana', Validators.required),
    vacantes: new FormControl<number>(30, [Validators.required, Validators.min(1), Validators.max(60)]),
    docente_id: new FormControl<number | null>(null),
  });

  ngOnInit(): void {
    this.catalogos.getGrados().subscribe({ next: (g: Grado[]) => this.grados.set(g) });
    this.catalogos.getDocentes().subscribe({ next: (d: Docente[]) => this.docentes.set(d) });
    if (this.data.seccion) {
      const s = this.data.seccion;
      this.form.patchValue({ grado_id: s.grado_id, nombre: s.nombre, turno: s.turno, vacantes: s.vacantes, docente_id: s.docente_id ?? null });
    }
  }

  guardar(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.error.set(null);
    const payload = this.form.getRawValue() as SeccionPayload;
    const req = this.data.seccion
      ? this.secciones.update(this.data.seccion.id, payload)
      : this.secciones.create(payload);
    req.subscribe({
      next: (s: Seccion) => this.ref.close(s),
      error: (e: unknown) => {
        this.saving.set(false);
        this.error.set(extractApiError(e, 'No se pudo guardar la sección'));
      },
    });
  }
}
