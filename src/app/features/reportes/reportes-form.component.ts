import { Component, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ReporteService } from './services/reporte.service';
import { CatalogosService } from '../../core/services/catalogos.service';
import { extractApiError } from '../../core/utils/api-error';
import { BackButtonComponent } from '../../shared/components/back-button.component';
import type { Periodo } from '../../core/models/periodo.model';
import type { Seccion } from '../../core/models/seccion.model';

@Component({
  selector: 'app-reportes-form',
  standalone: true,
  imports: [BackButtonComponent, RouterLink, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatSelectModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div class="page-header">
      <app-back-button />
      <h1>Generar reporte</h1>
      <a mat-button routerLink="/reportes"><mat-icon>arrow_back</mat-icon> Volver</a>
    </div>
    <mat-card class="card">
      <mat-card-content>
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Tipo de reporte</mat-label>
            <mat-select formControlName="tipo">
              <mat-option value="auxiliar">Auxiliar</mat-option>
              <mat-option value="asistencia">Asistencia</mat-option>
              <mat-option value="matriculas">Matriculas</mat-option>
              <mat-option value="notas">Notas</mat-option>
              <mat-option value="general">General</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Periodo</mat-label>
            <mat-select formControlName="periodo_id">
              <mat-option [value]="null">Sin periodo</mat-option>
              @for (p of periodos(); track p.id) {
                <mat-option [value]="p.id">{{ p.nombre }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Seccion</mat-label>
            <mat-select formControlName="seccion_id">
              <mat-option [value]="null">Todas</mat-option>
              @for (s of secciones(); track s.id) {
                <mat-option [value]="s.id">{{ s.grado?.nombre }} {{ s.nombre }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Formato</mat-label>
            <mat-select formControlName="formato">
              <mat-option value="pdf">PDF</mat-option>
              <mat-option value="excel">Excel</mat-option>
              <mat-option value="csv">CSV</mat-option>
            </mat-select>
          </mat-form-field>
          <div class="actions">
            <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || saving()">
              @if (saving()) { <mat-spinner diameter="20"></mat-spinner> } @else { <span>Generar y descargar</span> }
            </button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .card { max-width: 600px; }
    .full-width { width: 100%; margin-bottom: 1rem; }
    .actions { display: flex; justify-content: flex-end; }
  `],
})
export class ReportesFormComponent {
  periodos = signal<Periodo[]>([]);
  secciones = signal<Seccion[]>([]);
  saving = signal(false);
  submitted = false;

  hasUnsavedChanges(): boolean {
    return !this.submitted && this.form.dirty;
  }
  form: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder,
    private service: ReporteService,
    private catalogos: CatalogosService,
    private router: Router,
    private snack: MatSnackBar
  ) {
    this.form = this.fb.group({
      tipo: ['auxiliar', Validators.required],
      periodo_id: [null as number | null],
      seccion_id: [null as number | null],
      formato: ['pdf', Validators.required],
    });
    this.catalogos.getPeriodos().subscribe({
      next: (p) => {
        this.periodos.set(p);
        const activo = p.find((x) => x.activo);
        if (activo) this.form.controls['periodo_id'].setValue(activo.id);
      },
      error: () => undefined,
    });
    this.catalogos.getSecciones().subscribe({ next: (s) => this.secciones.set(s), error: () => undefined });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const v = this.form.getRawValue();
    this.service.generar({ tipo: v.tipo ?? 'auxiliar', periodo_id: v.periodo_id ?? null, seccion_id: v.seccion_id ?? null, formato: v.formato ?? 'pdf' }).subscribe({
      next: (rep) => {
        this.service.descargar(rep.id).subscribe({
          next: (blob) => {
            const url = URL.createObjectURL(blob);
            const ext = rep.formato === 'pdf' ? 'pdf' : rep.formato === 'excel' ? 'xlsx' : 'csv';
            const a = document.createElement('a');
            a.href = url;
            a.download = `reporte-${rep.tipo}-${rep.id}.${ext}`;
            a.click();
            URL.revokeObjectURL(url);
            this.saving.set(false);
            this.snack.open('Reporte generado', 'Cerrar', { duration: 3000 });
            this.submitted = true; this.form.markAsPristine(); this.router.navigate(['/reportes']);
          },
          error: () => {
            this.saving.set(false);
            this.snack.open('Reporte generado pero no se pudo descargar', 'Cerrar', { duration: 4000 });
            this.submitted = true; this.form.markAsPristine(); this.router.navigate(['/reportes']);
          },
        });
      },
      error: (err) => {
        this.saving.set(false);
        this.snack.open(extractApiError(err, 'No se pudo generar el reporte'), 'Cerrar', { duration: 5000 });
      },
    });
  }
}
