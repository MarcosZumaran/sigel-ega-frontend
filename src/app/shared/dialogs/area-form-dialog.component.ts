import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AreaService, AreaPayload } from '../../core/services/area.service';
import { Area } from '../../core/models/calificacion.model';
import { extractApiError } from '../../core/utils/api-error';

export interface AreaFormData {
  area?: Area | null;
  padres?: Area[];
}

@Component({
  selector: 'app-area-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressSpinnerModule],
  template: `
    <h2 mat-dialog-title>{{ data.area ? 'Editar área' : 'Nueva área' }}</h2>
    <form [formGroup]="form" (ngSubmit)="guardar()">
      <mat-dialog-content>
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="nombre" maxlength="100" placeholder="Ej. Comunicación" />
          @if (form.controls.nombre.invalid && form.controls.nombre.touched) {
            <mat-error>Ingrese el nombre (mín. 3 caracteres)</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Código SIAGIE (opcional)</mat-label>
          <input matInput formControlName="codigo_siagie" maxlength="20" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Área padre (opcional, para competencia)</mat-label>
          <mat-select formControlName="area_padre_id">
            <mat-option [value]="null">Ninguna (área principal)</mat-option>
            @for (p of padres(); track p.id) {
              <mat-option [value]="p.id">{{ p.nombre }}</mat-option>
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
export class AreaFormDialogComponent implements OnInit {
  data = inject<AreaFormData>(MAT_DIALOG_DATA);
  private ref = inject(MatDialogRef<AreaFormDialogComponent>);
  private areas = inject(AreaService);

  padres = signal<Area[]>(this.data.padres ?? []);
  saving = signal(false);
  error = signal<string | null>(null);

  form = new FormGroup({
    nombre: new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]),
    codigo_siagie: new FormControl<string | null>(null, Validators.maxLength(20)),
    area_padre_id: new FormControl<number | null>(null),
  });

  ngOnInit(): void {
    if (this.data.padres === undefined) {
      this.areas.getAll().subscribe({ next: (a: Area[]) => this.padres.set(a.filter((x: Area) => !x.area_padre_id)) });
    }
    if (this.data.area) {
      const a = this.data.area;
      this.form.patchValue({ nombre: a.nombre, codigo_siagie: a.codigo_siagie ?? null, area_padre_id: a.area_padre_id ?? null });
    }
  }

  guardar(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.error.set(null);
    const payload = this.form.getRawValue() as AreaPayload;
    const req = this.data.area
      ? this.areas.update(this.data.area.id, payload)
      : this.areas.create(payload);
    req.subscribe({
      next: (a: Area) => this.ref.close(a),
      error: (e: unknown) => {
        this.saving.set(false);
        this.error.set(extractApiError(e, 'No se pudo guardar el área'));
      },
    });
  }
}
