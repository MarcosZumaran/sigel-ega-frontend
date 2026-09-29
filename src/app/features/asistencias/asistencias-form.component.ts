import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AsistenciaService } from './services/asistencia.service';
import { MatriculaService } from '../matriculas/services/matricula.service';
import { CatalogosService } from '../../core/services/catalogos.service';
import { extractApiError } from '../../core/utils/api-error';
import { BackButtonComponent } from '../../shared/components/back-button.component';
import type { EstadoAsistencia } from '../../core/models/asistencia.model';
import type { Matricula } from '../../core/models/matricula.model';
import type { Seccion } from '../../core/models/seccion.model';

interface FilaAsistencia {
  matricula: Matricula;
  existenteId: number | null;
  estado: EstadoAsistencia;
  motivo: string;
}

@Component({
  selector: 'app-asistencias-form',
  standalone: true,
  imports: [BackButtonComponent, RouterLink, FormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule, MatTableModule, MatRadioModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div class="page-header">
      <app-back-button />
      <h1>Registrar asistencia</h1>
      <a mat-button routerLink="/asistencias"><mat-icon>arrow_back</mat-icon> Volver</a>
    </div>
    <mat-card class="filters">
      <mat-card-content class="filter-row">
        <mat-form-field appearance="outline">
          <mat-label>Seccion</mat-label>
          <mat-select [(ngModel)]="seccionId" (selectionChange)="onSeccionChange()">
            @for (s of secciones(); track s.id) {
              <mat-option [value]="s.id">{{ s.grado?.nombre }} {{ s.nombre }} ({{ s.turno }})</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Fecha</mat-label>
          <input matInput type="date" [(ngModel)]="fecha" (ngModelChange)="onSeccionChange()" />
        </mat-form-field>
        <span class="spacer"></span>
        <button mat-button color="primary" (click)="marcarTodos('presente')" [disabled]="!filas().length">Todos presentes</button>
        <button mat-button color="warn" (click)="marcarTodos('ausente')" [disabled]="!filas().length">Todos ausentes</button>
      </mat-card-content>
    </mat-card>
    <mat-card>
      <mat-card-content>
        @if (loading()) {
          <div class="center"><mat-spinner diameter="40"></mat-spinner></div>
        } @else if (!seccionId) {
          <p class="hint">Seleccione una seccion y una fecha para cargar la lista de estudiantes.</p>
        } @else if (!filas().length) {
          <p class="hint">No hay matriculas en esta seccion.</p>
        } @else {
          <table mat-table [dataSource]="filas()" class="full-width">
            <ng-container matColumnDef="estudiante">
              <th mat-header-cell *matHeaderCellDef>Estudiante</th>
              <td mat-cell *matCellDef="let f">{{ f.matricula.estudiante?.nombres }} {{ f.matricula.estudiante?.apellidos }}</td>
            </ng-container>
            <ng-container matColumnDef="estado">
              <th mat-header-cell *matHeaderCellDef>Estado</th>
              <td mat-cell *matCellDef="let f">
                <mat-radio-group [(ngModel)]="f.estado" class="estado-group">
                  <mat-radio-button value="presente">Presente</mat-radio-button>
                  <mat-radio-button value="tardia">Tardia</mat-radio-button>
                  <mat-radio-button value="ausente">Ausente</mat-radio-button>
                  <mat-radio-button value="justificado">Justificado</mat-radio-button>
                </mat-radio-group>
                @if (f.estado === 'justificado') {
                  <mat-form-field appearance="outline" class="motivo">
                    <mat-label>Motivo (obligatorio)</mat-label>
                    <input matInput [(ngModel)]="f.motivo" maxlength="500" />
                  </mat-form-field>
                }
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="['estudiante', 'estado']"></tr>
            <tr mat-row *matRowDef="let row; columns: ['estudiante', 'estado'];"></tr>
          </table>
          <div class="actions">
            <button mat-raised-button color="primary" (click)="onSave()" [disabled]="saving()">
              @if (saving()) { <mat-spinner diameter="20"></mat-spinner> } @else { <span>Guardar asistencia</span> }
            </button>
          </div>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .filter-row { display: flex; gap: 1rem; flex-wrap: wrap; align-items: center; }
    .spacer { flex: 1 1 auto; }
    .filters { margin-bottom: 1rem; }
    .full-width { width: 100%; }
    .center { display: flex; justify-content: center; padding: 2rem; }
    .hint { color: #64748b; text-align: center; padding: 2rem; }
    .estado-group { display: flex; gap: 1rem; flex-wrap: wrap; }
    .motivo { width: 100%; max-width: 400px; margin-top: 0.5rem; }
    .actions { margin-top: 1.5rem; display: flex; justify-content: flex-end; }
  `],
})
export class AsistenciasFormComponent {
  secciones = signal<Seccion[]>([]);
  filas = signal<FilaAsistencia[]>([]);
  loading = signal(false);
  saving = signal(false);
  submitted = false;
  private baseline = '';
  seccionId: number | null = null;
  fecha = new Date().toISOString().slice(0, 10);

  private matriculas: Matricula[] = [];

  constructor(
    private service: AsistenciaService,
    private matriculaService: MatriculaService,
    private catalogos: CatalogosService,
    private router: Router,
    private snack: MatSnackBar
  ) {
    this.catalogos.getSecciones().subscribe({ next: (s) => this.secciones.set(s), error: (err) => this.snack.open(extractApiError(err, 'No se pudo guardar la asistencia'), 'Cerrar', { duration: 4000 }) });
    this.matriculaService.getAll().subscribe({ next: (m) => (this.matriculas = m), error: () => undefined });
  }

  onSeccionChange(): void {
    if (!this.seccionId || !this.fecha) {
      this.filas.set([]);
      return;
    }
    this.loading.set(true);
    this.service.getAll().subscribe({
      next: (todas) => {
        const delDia = todas.filter((a) => a.fecha === this.fecha && a.matricula?.seccion_id === this.seccionId);
        const porMatricula = new Map(delDia.map((a) => [a.matricula_id, a]));
        const filas: FilaAsistencia[] = this.matriculas
          .filter((m) => m.seccion_id === this.seccionId)
          .map((m) => {
            const ex = porMatricula.get(m.id);
            return {
              matricula: m,
              existenteId: ex?.id ?? null,
              estado: ex?.estado ?? 'presente',
              motivo: ex?.motivo_justificacion ?? '',
            };
          });
        this.filas.set(filas);
        this.baseline = JSON.stringify(filas);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.snack.open(extractApiError(err, 'No se pudo guardar la asistencia'), 'Cerrar', { duration: 4000 });
      },
    });
  }

  marcarTodos(estado: EstadoAsistencia): void {
    this.filas.update((filas) => filas.map((f) => ({ ...f, estado })));
  }

  hasUnsavedChanges(): boolean {
    return !this.submitted && this.filas().length > 0 && JSON.stringify(this.filas()) !== this.baseline;
  }

  onSave(): void {
    const sinMotivo = this.filas().filter((f) => f.estado === 'justificado' && !f.motivo.trim());
    if (sinMotivo.length) {
      this.snack.open('Todo justificado exige un motivo', 'Cerrar', { duration: 4000 });
      return;
    }
    this.saving.set(true);
    const ops = this.filas().map((f) => {
      const payload = { matricula_id: f.matricula.id, fecha: this.fecha, estado: f.estado, motivo_justificacion: f.estado === 'justificado' ? f.motivo.trim() : null };
      return f.existenteId ? this.service.update(f.existenteId, payload) : this.service.create(payload);
    });
    forkJoin(ops).subscribe({
      next: () => {
        this.saving.set(false);
        this.snack.open('Asistencia guardada', 'Cerrar', { duration: 3000 });
        this.submitted = true;
        this.router.navigate(['/asistencias']);
      },
      error: (err) => {
        this.saving.set(false);
        this.snack.open(extractApiError(err, 'No se pudo guardar la asistencia'), 'Cerrar', { duration: 5000 });
      },
    });
  }
}
