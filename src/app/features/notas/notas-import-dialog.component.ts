import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatListModule } from '@angular/material/list';
import { CalificacionService } from './services/calificacion.service';
import { CatalogosService } from '../../core/services/catalogos.service';
import type { Periodo } from '../../core/models/periodo.model';
import type { Seccion } from '../../core/models/seccion.model';
import type { SiagieImportResult } from '../../core/models/calificacion.model';
import { extractApiError } from '../../core/utils/api-error';

@Component({
  selector: 'app-notas-import-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressSpinnerModule, MatSnackBarModule, MatListModule],
  template: `
    <h2 mat-dialog-title>Importar SIAGIE</h2>
    <mat-dialog-content>
      <p class="hint">El archivo debe tener cabecera: <code>dni, area_id, tipo_evaluacion_id, nivel_logro, motivo_c, nota</code>. Nivel AD/A/B/C; la C exige <code>motivo_c</code>. Formatos: xlsx, xls, csv (max 5MB).</p>
      <form [formGroup]="form" class="form-grid">
        <mat-form-field appearance="outline">
          <mat-label>Periodo</mat-label>
          <mat-select formControlName="periodo_id">
            @for (p of periodos(); track p.id) {
              <mat-option [value]="p.id">{{ p.nombre }} ({{ p.anio }})</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Seccion</mat-label>
          <mat-select formControlName="seccion_id">
            @for (s of secciones(); track s.id) {
              <mat-option [value]="s.id">{{ s.grado?.nombre }} {{ s.nombre }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <div class="full drop" (dragover)="onDrag($event)" (drop)="onDrop($event)" (click)="fileInput.click()">
          <input #fileInput hidden type="file" accept=".xlsx,.xls,.csv,.txt" (change)="onFile($event)" />
          @if (fileName()) {
            <p><strong>{{ fileName() }}</strong></p>
          } @else {
            <p>Arrastre el archivo aqui o haga clic para seleccionar</p>
          }
        </div>
      </form>
      @if (result()) {
        <div class="result">
          <p><strong>{{ result()!.message }}</strong> — Importados: {{ result()!.importados }}</p>
          @if (result()!.errores.length) {
            <p>Errores por fila:</p>
            <mat-list>
              @for (e of result()!.errores; track e) {
                <mat-list-item>{{ e }}</mat-list-item>
              }
            </mat-list>
          }
        </div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cerrar</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid || !file || importing()" (click)="doImport()">
        @if (importing()) { <mat-spinner diameter="20"></mat-spinner> } @else { <span>Importar</span> }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .hint { color: #64748b; } .hint code { background: #f1f5f9; padding: 0 4px; border-radius: 4px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; padding-top: 0.5rem; }
    .full { grid-column: 1 / -1; }
    .drop { border: 2px dashed #94a3b8; border-radius: 8px; padding: 1.5rem; text-align: center; cursor: pointer; color: #64748b; }
    .result { margin-top: 1rem; } .result mat-list { max-height: 220px; overflow: auto; }
  `],
})
export class NotasImportDialogComponent implements OnInit {
  form: FormGroup;
  importing = signal(false);
  fileName = signal('');
  file: File | null = null;
  result = signal<SiagieImportResult | null>(null);
  periodos = signal<Periodo[]>([]);
  secciones = signal<Seccion[]>([]);

  constructor(
    private fb: FormBuilder,
    private service: CalificacionService,
    private catalogos: CatalogosService,
    private snack: MatSnackBar,
    private ref: MatDialogRef<NotasImportDialogComponent>
  ) {
    this.form = this.fb.group({
      periodo_id: [null, Validators.required],
      seccion_id: [null, Validators.required],
    });
  }

  ngOnInit(): void {
    this.catalogos.getPeriodos().subscribe({ next: (v) => this.periodos.set(v) });
    this.catalogos.getSecciones().subscribe({ next: (v) => this.secciones.set(v) });
  }

  onDrag(e: DragEvent): void {
    e.preventDefault();
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0];
    if (f) this.setFile(f);
  }

  onFile(e: Event): void {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) this.setFile(f);
  }

  doImport(): void {
    if (this.form.invalid || !this.file) return;
    const v = this.form.getRawValue();
    this.importing.set(true);
    this.service.importSiagie(this.file, v.periodo_id, v.seccion_id).subscribe({
      next: (res) => {
        this.importing.set(false);
        this.result.set(res);
        if (res.importados > 0) this.ref.close(true);
      },
      error: (err) => {
        this.importing.set(false);
        this.snack.open(extractApiError(err, 'No se pudo importar.'), 'Cerrar', { duration: 5000 });
      },
    });
  }

  private setFile(f: File): void {
    this.file = f;
    this.fileName.set(f.name);
    this.result.set(null);
  }
}
