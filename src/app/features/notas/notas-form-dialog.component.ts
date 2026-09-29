import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CalificacionService } from './services/calificacion.service';
import { CatalogosService } from '../../core/services/catalogos.service';
import { MatriculaService } from '../matriculas/services/matricula.service';
import type { NivelLogro } from '../../core/models/calificacion.model';
import type { Area, TipoEvaluacion } from '../../core/models/calificacion.model';
import type { Matricula } from '../../core/models/matricula.model';
import type { Seccion } from '../../core/models/seccion.model';
import { extractApiError } from '../../core/utils/api-error';
import { notaANivel, esCoherente } from '../../core/utils/ministerio-equivalencia';

@Component({
  selector: 'app-notas-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <h2 mat-dialog-title>Nueva calificacion</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-grid">
        <mat-form-field appearance="outline">
          <mat-label>Seccion (para filtrar matriculas)</mat-label>
          <mat-select [formControl]="fSeccion">
            @for (s of secciones(); track s.id) {
              <mat-option [value]="s.id">{{ s.grado?.nombre }} {{ s.nombre }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Matricula (estudiante)</mat-label>
          <mat-select formControlName="matricula_id">
            @for (m of matriculasFiltradas(); track m.id) {
              <mat-option [value]="m.id">#{{ m.id }} — {{ m.estudiante?.nombres }} {{ m.estudiante?.apellidos }}</mat-option>
            }
          </mat-select>
          @if (form.controls['matricula_id'].invalid && form.controls['matricula_id'].touched) {
            <mat-error>Seleccione la matricula</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Area</mat-label>
          <mat-select formControlName="area_id">
            @for (a of areas(); track a.id) {
              <mat-option [value]="a.id">{{ a.nombre }}</mat-option>
            }
          </mat-select>
          @if (form.controls['area_id'].invalid && form.controls['area_id'].touched) {
            <mat-error>Seleccione el area</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Tipo de evaluacion</mat-label>
          <mat-select formControlName="tipo_evaluacion_id">
            @for (t of tipos(); track t.id) {
              <mat-option [value]="t.id">{{ t.nombre }}</mat-option>
            }
          </mat-select>
          @if (form.controls['tipo_evaluacion_id'].invalid && form.controls['tipo_evaluacion_id'].touched) {
            <mat-error>Seleccione el tipo</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Nota (0-20, opcional si usa nivel literal)</mat-label>
          <input matInput type="number" min="0" max="20" step="0.5" formControlName="nota" (input)="onNota()" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Nivel de logro</mat-label>
          <mat-select formControlName="nivel_logro" (selectionChange)="onNivel()">
            <mat-option [value]="null">—</mat-option>
            <mat-option value="AD">AD — Logro Destacado</mat-option>
            <mat-option value="A">A — Logro Esperado</mat-option>
            <mat-option value="B">B — En Proceso</mat-option>
            <mat-option value="C">C — En Inicio</mat-option>
          </mat-select>
        </mat-form-field>
        @if (form.controls['nivel_logro'].value === 'C') {
          <mat-form-field appearance="outline" class="full">
            <mat-label>Motivo de nota C (obligatorio)</mat-label>
            <textarea matInput rows="2" formControlName="motivo_nota_c"></textarea>
            @if (form.controls['motivo_nota_c'].invalid && form.controls['motivo_nota_c'].touched) {
              <mat-error>El nivel C exige motivo</mat-error>
            }
          </mat-form-field>
        }
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid || saving()" (click)="save()">
        @if (saving()) { <mat-spinner diameter="20"></mat-spinner> } @else { <span>Guardar</span> }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; padding-top: 0.5rem; }
    .full { grid-column: 1 / -1; }
  `],
})
export class NotasFormDialogComponent implements OnInit {
  form: FormGroup;
  fSeccion: FormControl<number | null>;
  saving = signal(false);
  secciones = signal<Seccion[]>([]);
  areas = signal<Area[]>([]);
  tipos = signal<TipoEvaluacion[]>([]);
  matriculas = signal<Matricula[]>([]);
  matriculasFiltradas = signal<Matricula[]>([]);

  constructor(
    private fb: FormBuilder,
    private service: CalificacionService,
    private catalogos: CatalogosService,
    private matriculasSvc: MatriculaService,
    private snack: MatSnackBar,
    private ref: MatDialogRef<NotasFormDialogComponent>
  ) {
    this.form = this.fb.group({
      matricula_id: [null, Validators.required],
      area_id: [null, Validators.required],
      tipo_evaluacion_id: [null, Validators.required],
      nota: [null, [Validators.min(0), Validators.max(20)]],
      nivel_logro: [null],
      motivo_nota_c: [''],
    });
    this.fSeccion = this.fb.control<number | null>(null);
  }

  ngOnInit(): void {
    this.catalogos.getSecciones().subscribe({ next: (v) => this.secciones.set(v) });
    this.catalogos.getAreas().subscribe({ next: (v) => this.areas.set(v) });
    this.catalogos.getTiposEvaluacion().subscribe({ next: (v) => this.tipos.set(v) });
    this.matriculasSvc.getAll().subscribe({
      next: (v) => { this.matriculas.set(v); this.applySeccion(); },
      error: (err) => this.snack.open(extractApiError(err, 'No se pudo cargar matriculas.'), 'Cerrar', { duration: 4000 }),
    });
    this.fSeccion.valueChanges.subscribe(() => this.applySeccion());
  }

  onNota(): void {
    const raw = this.form.controls['nota'].value;
    const nota = raw === null || raw === '' ? null : Number(raw);
    if (nota !== null && !isNaN(nota) && nota >= 0 && nota <= 20) {
      this.form.controls['nivel_logro'].setValue(notaANivel(nota));
    }
  }

  onNivel(): void {
    const nivel = this.form.controls['nivel_logro'].value as NivelLogro | null;
    const raw = this.form.controls['nota'].value;
    const nota = raw === null || raw === '' ? null : Number(raw);
    if (nivel && nota !== null && !isNaN(nota) && !esCoherente(nota, nivel)) {
      this.snack.open(`Nota ${nota} corresponde a ${notaANivel(nota)}. Se ajusto el nivel.`, 'Cerrar', { duration: 4000 });
      this.form.controls['nivel_logro'].setValue(notaANivel(nota));
    }
  }

  save(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const nota = v.nota === null || v.nota === '' ? null : Number(v.nota);
    const nivel = (v.nivel_logro ?? null) as NivelLogro | null;
    const motivo = String(v.motivo_nota_c ?? '').trim();
    if (!esCoherente(nota, nivel)) {
      this.snack.open('Nota y nivel no son coherentes.', 'Cerrar', { duration: 4000 });
      return;
    }
    if (nivel === 'C' && !motivo) {
      this.snack.open('El nivel C exige motivo.', 'Cerrar', { duration: 4000 });
      this.form.controls['motivo_nota_c'].markAsTouched();
      return;
    }
    this.saving.set(true);
    this.service.create({
      matricula_id: v.matricula_id,
      area_id: v.area_id,
      tipo_evaluacion_id: v.tipo_evaluacion_id,
      nota,
      nivel_logro: nivel,
      escala: nivel ? 'literal' : 'vigesimal',
      es_nota_c: nivel === 'C',
      motivo_nota_c: motivo || null,
    }).subscribe({
      next: () => { this.snack.open('Calificacion creada.', 'Cerrar', { duration: 3000 }); this.ref.close(true); },
      error: (err) => { this.saving.set(false); this.snack.open(extractApiError(err, 'No se pudo crear.'), 'Cerrar', { duration: 5000 }); },
    });
  }

  private applySeccion(): void {
    const s = this.fSeccion.value;
    this.matriculasFiltradas.set(s ? this.matriculas().filter((m) => m.seccion_id === s) : this.matriculas());
  }
}
