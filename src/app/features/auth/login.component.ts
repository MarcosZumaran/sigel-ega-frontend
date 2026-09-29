import { Component, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <h2>Iniciar sesion</h2>
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Correo</mat-label>
        <input matInput type="email" formControlName="email" autocomplete="username" />
        @if (form.controls['email'].invalid && form.controls['email'].touched) {
          <mat-error>Ingrese un correo valido</mat-error>
        }
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Contrasena</mat-label>
        <input matInput type="password" formControlName="password" autocomplete="current-password" />
        @if (form.controls['password'].invalid && form.controls['password'].touched) {
          <mat-error>Ingrese su contrasena</mat-error>
        }
      </mat-form-field>
      <button mat-raised-button color="primary" class="full-width" type="submit" [disabled]="form.invalid || loading()">
        @if (loading()) {
          <mat-spinner diameter="20"></mat-spinner>
        } @else {
          <span>Ingresar</span>
        }
      </button>
    </form>
  `,
  styles: [`
    h2 { margin-top: 0; text-align: center; color: #1E3A8A; }
    .full-width { width: 100%; margin-bottom: 1rem; }
  `],
})
export class LoginComponent {
  loading = signal(false);
  form: ReturnType<FormBuilder['group']>;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router, private snack: MatSnackBar) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    const { email, password } = this.form.getRawValue();
    this.auth.login(email ?? '', password ?? '').subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.snack.open(err?.error?.message ?? 'No se pudo iniciar sesion', 'Cerrar', { duration: 4000 });
      },
    });
  }
}
