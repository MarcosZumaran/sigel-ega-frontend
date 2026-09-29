import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface JustificarDialogData {
  alumno: string;
  fecha: string;
  motivo: string;
}

@Component({
  selector: 'app-justificar-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>Justificar inasistencia</h2>
    <form [formGroup]="form" (ngSubmit)="guardar()">
      <mat-dialog-content>
        <p class="meta">{{ data.alumno }} — {{ data.fecha }}</p>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Motivo de la justificación</mat-label>
          <textarea matInput rows="3" formControlName="motivo"></textarea>
          @if (form.controls.motivo.invalid && form.controls.motivo.touched) {
            <mat-error>El motivo es obligatorio (mínimo 3 caracteres)</mat-error>
          }
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="ref.close(undefined)">Cancelar</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">Guardar</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .full { width: 100%; }
    .meta { font-size: 0.85rem; color: #475569; margin-top: 0; }
  `],
})
export class JustificarDialogComponent {
  form: FormGroup<{ motivo: FormControl<string> }>;

  constructor(
    public ref: MatDialogRef<JustificarDialogComponent, string | undefined>,
    @Inject(MAT_DIALOG_DATA) public data: JustificarDialogData
  ) {
    this.form = new FormGroup({
      motivo: new FormControl(data.motivo ?? '', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(3)],
      }),
    });
  }

  guardar(): void {
    if (this.form.invalid) return;
    this.ref.close(this.form.controls.motivo.value.trim());
  }
}
