import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';

export interface BimestreEditData {
  nombre: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  activo: boolean;
}

@Component({
  selector: 'app-bimestre-edit-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatCheckboxModule],
  template: `
    <h2 mat-dialog-title>Editar bimestre</h2>
    <form [formGroup]="form" (ngSubmit)="guardar()">
      <mat-dialog-content>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="nombre" maxlength="50" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Fecha de inicio</mat-label>
          <input matInput type="date" formControlName="fecha_inicio" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Fecha de fin</mat-label>
          <input matInput type="date" formControlName="fecha_fin" />
          @if (form.hasError('rangoInvalido')) {
            <mat-error>La fecha de fin debe ser posterior a la de inicio</mat-error>
          }
        </mat-form-field>
        <mat-checkbox formControlName="activo">Bimestre activo</mat-checkbox>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-stroked-button type="button" (click)="ref.close()">Cancelar</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">Guardar</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`.full-width { width: 100%; margin-bottom: 0.5rem; }`],
})
export class BimestreEditDialogComponent {
  ref = inject(MatDialogRef<BimestreEditDialogComponent, BimestreEditData | undefined>);
  data = inject<BimestreEditData>(MAT_DIALOG_DATA);

  form = new FormGroup(
    {
      nombre: new FormControl(this.data.nombre, { nonNullable: true, validators: [Validators.required, Validators.maxLength(50)] }),
      fecha_inicio: new FormControl<string | null>(this.data.fecha_inicio),
      fecha_fin: new FormControl<string | null>(this.data.fecha_fin),
      activo: new FormControl(this.data.activo, { nonNullable: true }),
    },
    { validators: (g) => {
      const ini = g.get('fecha_inicio')?.value;
      const fin = g.get('fecha_fin')?.value;
      return ini && fin && fin <= ini ? { rangoInvalido: true } : null;
    } }
  );

  guardar(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.ref.close({ nombre: v.nombre, fecha_inicio: v.fecha_inicio || null, fecha_fin: v.fecha_fin || null, activo: v.activo });
  }
}
