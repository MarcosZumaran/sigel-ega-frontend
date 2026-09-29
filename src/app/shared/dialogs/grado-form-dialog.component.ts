import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GradoService } from '../../features/grados/services/grado.service';
import { CatalogosService } from '../../core/services/catalogos.service';
import { Grado, GradoPayload } from '../../core/models/grado.model';
import { Nivel } from '../../core/models/catalogos.model';
import { extractApiError } from '../../core/utils/api-error';

export interface GradoFormData {
  grado?: Grado | null;
}

@Component({
  selector: 'app-grado-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressSpinnerModule],
  template: `
    <h2 mat-dialog-title>{{ data.grado ? 'Editar grado' : 'Nuevo grado' }}</h2>
    <form [formGroup]="form" (ngSubmit)="guardar()">
      <mat-dialog-content>
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Nivel</mat-label>
          <mat-select formControlName="nivel_id">
            @for (n of niveles(); track n.id) {
              <mat-option [value]="n.id">{{ n.nombre }}</mat-option>
            }
          </mat-select>
          @if (form.controls.nivel_id.invalid && form.controls.nivel_id.touched) {
            <mat-error>Seleccione un nivel</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="nombre" maxlength="100" placeholder="Ej. 1° de Primaria" />
          @if (form.controls.nombre.invalid && form.controls.nombre.touched) {
            <mat-error>Ingrese el nombre (mín. 3 caracteres)</mat-error>
          }
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
export class GradoFormDialogComponent implements OnInit {
  data = inject<GradoFormData>(MAT_DIALOG_DATA);
  private ref = inject(MatDialogRef<GradoFormDialogComponent>);
  private grados = inject(GradoService);
  private catalogos = inject(CatalogosService);

  niveles = signal<Nivel[]>([]);
  saving = signal(false);
  error = signal<string | null>(null);

  form = new FormGroup({
    nivel_id: new FormControl<number | null>(null, Validators.required),
    nombre: new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]),
  });

  ngOnInit(): void {
    this.catalogos.getNiveles().subscribe({ next: (n: Nivel[]) => this.niveles.set(n) });
    if (this.data.grado) {
      this.form.patchValue({ nivel_id: this.data.grado.nivel_id, nombre: this.data.grado.nombre });
    }
  }

  guardar(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.error.set(null);
    const payload = this.form.getRawValue() as GradoPayload;
    const req = this.data.grado
      ? this.grados.update(this.data.grado.id, payload)
      : this.grados.create(payload);
    req.subscribe({
      next: (g: Grado) => this.ref.close(g),
      error: (e: unknown) => {
        this.saving.set(false);
        this.error.set(extractApiError(e, 'No se pudo guardar el grado'));
      },
    });
  }
}
