import { Component, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { GradoService } from './services/grado.service';
import { CatalogosService } from '../../core/services/catalogos.service';
import { GradoPayload } from '../../core/models/grado.model';
import { Nivel } from '../../core/models/catalogos.model';
import { extractApiError } from '../../core/utils/api-error';
import { BackButtonComponent } from '../../shared/components/back-button.component';

@Component({
  selector: 'app-grados-form',
  standalone: true,
  imports: [BackButtonComponent, ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule, MatCardModule],
  template: `
    <app-back-button />
    <h1>{{ isEdit() ? 'Editar grado' : 'Nuevo grado' }}</h1>
    <mat-card>
      <mat-card-content>
        @if (loading()) {
          <div class="loading"><mat-spinner diameter="40"></mat-spinner></div>
        } @else {
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form-grid">
            <mat-form-field appearance="outline">
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
            <mat-form-field appearance="outline">
              <mat-label>Nombre</mat-label>
              <input matInput formControlName="nombre" maxlength="100" placeholder="Ej. Primero" />
              @if (form.controls.nombre.invalid && form.controls.nombre.touched) {
                <mat-error>El nombre es requerido (max. 100)</mat-error>
              }
            </mat-form-field>
            <div class="form-actions">
              <a mat-button routerLink="/grados">Cancelar</a>
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
export class GradosFormComponent implements OnInit {
  loading = signal(true);
  saving = signal(false);
  submitted = false;

  hasUnsavedChanges(): boolean {
    return !this.submitted && this.form.dirty;
  }
  isEdit = signal(false);
  niveles = signal<Nivel[]>([]);
  private id: number | null = null;

  form = new FormGroup({
    nivel_id: new FormControl<number | null>(null, { validators: [Validators.required] }),
    nombre: new FormControl('', { validators: [Validators.required, Validators.maxLength(100)], nonNullable: true }),
  });

  constructor(private service: GradoService, private catalogos: CatalogosService, private route: ActivatedRoute, private router: Router, private snack: MatSnackBar) {}

  ngOnInit(): void {
    this.catalogos.getNiveles().subscribe({
      next: (res) => {
        this.niveles.set(Array.isArray(res) ? res : []);
        const param = this.route.snapshot.paramMap.get('id');
        if (param) {
          this.id = Number(param);
          this.isEdit.set(true);
          this.service.getById(this.id).subscribe({
            next: (g) => {
              this.form.patchValue({ nivel_id: g.nivel_id, nombre: g.nombre });
              this.loading.set(false);
            },
            error: (err) => {
              this.loading.set(false);
              this.snack.open(extractApiError(err, 'No se pudo cargar el grado'), 'Cerrar', { duration: 4000 });
            },
          });
        } else {
          this.loading.set(false);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.snack.open(extractApiError(err, 'No se pudo cargar los niveles'), 'Cerrar', { duration: 4000 });
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const payload: GradoPayload = { nivel_id: v.nivel_id as number, nombre: v.nombre };
    this.saving.set(true);
    const req = this.isEdit() && this.id !== null
      ? this.service.update(this.id, payload)
      : this.service.create(payload);
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.snack.open('Grado guardado correctamente', 'Cerrar', { duration: 3000 });
        this.submitted = true; this.form.markAsPristine(); this.router.navigate(['/grados']);
      },
      error: (err) => {
        this.saving.set(false);
        this.snack.open(extractApiError(err, 'No se pudo guardar el grado'), 'Cerrar', { duration: 4000 });
      },
    });
  }
}
