import { Component, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { PadreService } from './services/padre.service';
import { PadrePayload } from '../../core/models/padre.model';
import { extractApiError } from '../../core/utils/api-error';
import { BackButtonComponent } from '../../shared/components/back-button.component';

@Component({
  selector: 'app-padres-form',
  standalone: true,
  imports: [BackButtonComponent, ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule, MatCardModule],
  template: `
    <app-back-button />
    <h1>{{ isEdit() ? 'Editar padre' : 'Nuevo padre' }}</h1>
    <mat-card>
      <mat-card-content>
        @if (loading()) {
          <div class="loading"><mat-spinner diameter="40"></mat-spinner></div>
        } @else {
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>DNI</mat-label>
              <input matInput formControlName="dni" maxlength="8" inputmode="numeric" placeholder="8 digitos" />
              @if (form.controls.dni.invalid && form.controls.dni.touched) {
                <mat-error>El DNI debe tener 8 digitos</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Nombres</mat-label>
              <input matInput formControlName="nombres" maxlength="150" />
              @if (form.controls.nombres.invalid && form.controls.nombres.touched) {
                <mat-error>Los nombres son requeridos</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Apellidos</mat-label>
              <input matInput formControlName="apellidos" maxlength="150" />
              @if (form.controls.apellidos.invalid && form.controls.apellidos.touched) {
                <mat-error>Los apellidos son requeridos</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Telefono</mat-label>
              <input matInput formControlName="telefono" maxlength="20" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" maxlength="100" />
              @if (form.controls.email.invalid && form.controls.email.touched) {
                <mat-error>Ingrese un correo valido</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Direccion</mat-label>
              <input matInput formControlName="direccion" maxlength="200" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Ocupacion</mat-label>
              <input matInput formControlName="ocupacion" maxlength="100" />
            </mat-form-field>
            <div class="form-actions">
              <a mat-button routerLink="/padres">Cancelar</a>
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
export class PadresFormComponent implements OnInit {
  loading = signal(false);
  saving = signal(false);
  submitted = false;

  hasUnsavedChanges(): boolean {
    return !this.submitted && this.form.dirty;
  }
  isEdit = signal(false);
  private id: number | null = null;

  form = new FormGroup({
    dni: new FormControl('', { validators: [Validators.required, Validators.pattern(/^\d{8}$/)], nonNullable: true }),
    nombres: new FormControl('', { validators: [Validators.required, Validators.maxLength(150)], nonNullable: true }),
    apellidos: new FormControl('', { validators: [Validators.required, Validators.maxLength(150)], nonNullable: true }),
    telefono: new FormControl<string | null>(null),
    email: new FormControl<string | null>(null, { validators: [Validators.email, Validators.maxLength(100)] }),
    direccion: new FormControl<string | null>(null),
    ocupacion: new FormControl<string | null>(null),
  });

  constructor(private service: PadreService, private route: ActivatedRoute, private router: Router, private snack: MatSnackBar) {}

  ngOnInit(): void {
    const param = this.route.snapshot.paramMap.get('id');
    if (param) {
      this.id = Number(param);
      this.isEdit.set(true);
      this.loading.set(true);
      this.service.getById(this.id).subscribe({
        next: (p) => {
          this.form.patchValue({
            dni: p.dni,
            nombres: p.nombres,
            apellidos: p.apellidos,
            telefono: p.telefono,
            email: p.email,
            direccion: p.direccion,
            ocupacion: p.ocupacion,
          });
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.snack.open(extractApiError(err, 'No se pudo cargar el padre'), 'Cerrar', { duration: 4000 });
        },
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const payload: PadrePayload = {
      dni: v.dni,
      nombres: v.nombres,
      apellidos: v.apellidos,
      telefono: v.telefono || null,
      email: v.email || null,
      direccion: v.direccion || null,
      ocupacion: v.ocupacion || null,
    };
    this.saving.set(true);
    const req = this.isEdit() && this.id !== null
      ? this.service.update(this.id, payload)
      : this.service.create(payload);
    req.subscribe({
      next: (res) => {
        this.saving.set(false);
        const extra = !this.isEdit() && res.apoderado_id ? ` Apoderado #${res.apoderado_id} creado.` : '';
        this.snack.open(`Padre guardado correctamente.${extra}`, 'Cerrar', { duration: 4000 });
        this.submitted = true; this.form.markAsPristine(); this.router.navigate(['/padres']);
      },
      error: (err) => {
        this.saving.set(false);
        this.snack.open(extractApiError(err, 'No se pudo guardar el padre'), 'Cerrar', { duration: 4000 });
      },
    });
  }
}
