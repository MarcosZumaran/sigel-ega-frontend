import { Component, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
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
import type { Grado } from '../../core/models/grado.model';

@Component({
  selector: 'app-reportes-form',
  standalone: true,
  imports: [BackButtonComponent, RouterLink, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatSelectModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div class="page-header">
      <app-back-button />
      <h1>Generar reporte</h1>
      <span></span>
    </div>
    <mat-card class="card">
      <mat-card-content>
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <p class="tipo-desc">{{ descripciones[form.controls['tipo'].value ?? ''] }}</p>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Tipo de reporte</mat-label>
            <mat-select formControlName="tipo">
              <mat-option value="auxiliar">Auxiliar</mat-option>
              <mat-option value="asistencia">Asistencia</mat-option>
              <mat-option value="matriculas">Matriculas</mat-option>
              <mat-option value="notas">Notas</mat-option>
              <mat-option value="general">General</mat-option>
              <mat-option value="acta-evaluacion">Acta de Evaluación</mat-option>
              <mat-option value="nomina-matricula">Nómina de Matrícula</mat-option>
              <mat-option value="orden-merito">Orden de Mérito</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Período académico</mat-label>
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
                <mat-option [value]="s.id">{{ s.grado?.nombre }} {{ s.nombre }} — {{ s.turno === 'manana' ? 'Mañana' : 'Tarde' }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          @if (!esOficial()) {
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Formato</mat-label>
              <mat-select formControlName="formato">
                <mat-option value="pdf">PDF</mat-option>
                <mat-option value="excel">Excel</mat-option>
                <mat-option value="csv">CSV</mat-option>
              </mat-select>
            </mat-form-field>
          } @else {
            <p class="tipo-desc">Los reportes oficiales solo están disponibles en PDF.</p>
          }
          @if (form.controls['tipo'].value === 'orden-merito') {
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Grado</mat-label>
              <mat-select formControlName="grado_id">
                @for (g of grados(); track g.id) {
                  <mat-option [value]="g.id">{{ g.nombre }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          }
          <div class="actions">
            @if (esOficial()) {
              <button mat-stroked-button type="button" (click)="vistaPrevia()" [disabled]="form.invalid || saving()">Vista previa</button>
            }
            <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || saving()">
              @if (saving()) { <mat-spinner diameter="20"></mat-spinner> } @else { <span>Generar y descargar PDF</span> }
            </button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .card { max-width: 600px; }
    .full-width { width: 100%; margin-bottom: 1rem; }
    .actions { display: flex; justify-content: flex-end; gap: 0.5rem; }
    .tipo-desc { color: #64748b; font-size: 0.85rem; margin: 0 0 1rem; }
  `],
})
export class ReportesFormComponent {
  periodos = signal<Periodo[]>([]);
  secciones = signal<Seccion[]>([]);
  grados = signal<Grado[]>([]);
  saving = signal(false);
  submitted = false;
  private readonly oficiales = ['acta-evaluacion', 'nomina-matricula', 'orden-merito'];
  readonly descripciones: Record<string, string> = {
    auxiliar: 'Registro auxiliar de calificaciones por sección.',
    asistencia: 'Parte diario de asistencia por sección y fecha.',
    matriculas: 'Listado de estudiantes matriculados.',
    notas: 'Consolidado de notas por sección.',
    general: 'Resumen general institucional.',
    'acta-evaluacion': 'Documento oficial con niveles de logro por estudiante y competencia.',
    'nomina-matricula': 'Nómina oficial de estudiantes matriculados por sección.',
    'orden-merito': 'Ranking oficial por promedio en el grado.',
  };

  esOficial(): boolean {
    return this.oficiales.includes(this.form.controls['tipo'].value ?? '');
  }

  hasUnsavedChanges(): boolean {
    return !this.submitted && this.form.dirty;
  }
  form: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder,
    private service: ReporteService,
    private catalogos: CatalogosService,
    private router: Router,
    private route: ActivatedRoute,
    private snack: MatSnackBar
  ) {
    this.form = this.fb.group({
      tipo: ['auxiliar', Validators.required],
      periodo_id: [null as number | null],
      seccion_id: [null as number | null],
      grado_id: [null as number | null],
      formato: ['pdf', Validators.required],
    });
    const preset = this.route.snapshot.queryParamMap.get('tipo');
    if (preset) this.form.controls['tipo'].setValue(preset);
    this.catalogos.getPeriodos().subscribe({
      next: (p) => {
        this.periodos.set(p);
        const activo = p.find((x) => x.activo);
        if (activo) this.form.controls['periodo_id'].setValue(activo.id);
      },
      error: () => undefined,
    });
    this.catalogos.getSecciones().subscribe({ next: (s) => this.secciones.set(s), error: () => undefined });
    this.catalogos.getGrados().subscribe({ next: (g) => this.grados.set(g), error: () => undefined });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const v = this.form.getRawValue();
    if (this.oficiales.includes(v.tipo ?? '')) {
      this.descargarOficial(v.tipo ?? '', v.periodo_id ?? null, v.seccion_id ?? null, v.grado_id ?? null);
      return;
    }
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

  vistaPrevia(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const params: Record<string, string | number | boolean> = {};
    if (v.periodo_id != null) params['periodo_id'] = v.periodo_id;
    if (v.seccion_id != null) params['seccion_id'] = v.seccion_id;
    if (v.grado_id != null) params['grado_id'] = v.grado_id;
    this.saving.set(true);
    this.service.descargarOficial(v.tipo as 'acta-evaluacion' | 'nomina-matricula' | 'orden-merito', params).subscribe({
      next: (blob) => {
        this.saving.set(false);
        window.open(URL.createObjectURL(blob), '_blank');
      },
      error: (err) => {
        this.saving.set(false);
        this.snack.open(extractApiError(err, 'No se pudo generar la vista previa'), 'Cerrar', { duration: 5000 });
      },
    });
  }

  private descargarOficial(tipo: string, periodoId: number | null, seccionId: number | null, gradoId: number | null): void {
    if (tipo === 'orden-merito' && !gradoId) {
      this.saving.set(false);
      this.snack.open('Seleccione un grado para el Orden de Mérito', 'Cerrar', { duration: 4000 });
      return;
    }
    if (tipo !== 'orden-merito' && !seccionId) {
      this.saving.set(false);
      this.snack.open('Seleccione una sección', 'Cerrar', { duration: 4000 });
      return;
    }
    const params: Record<string, string | number | boolean> = {};
    if (periodoId != null) params['periodo_id'] = periodoId;
    if (seccionId != null) params['seccion_id'] = seccionId;
    if (gradoId != null) params['grado_id'] = gradoId;
    this.service.descargarOficial(tipo as 'acta-evaluacion' | 'nomina-matricula' | 'orden-merito', params).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${tipo}-${Date.now()}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        this.saving.set(false);
        this.snack.open('Reporte descargado', 'Cerrar', { duration: 3000 });
        this.submitted = true; this.form.markAsPristine(); this.router.navigate(['/reportes']);
      },
      error: (err) => {
        this.saving.set(false);
        this.snack.open(extractApiError(err, 'No se pudo descargar el reporte'), 'Cerrar', { duration: 5000 });
      },
    });
  }
}
