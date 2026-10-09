import { Component, signal, computed, viewChild, effect, inject} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { AsistenciaService } from './services/asistencia.service';
import { CatalogosService } from '../../core/services/catalogos.service';
import { extractApiError } from '../../core/utils/api-error';
import type { Asistencia, EstadoAsistencia } from '../../core/models/asistencia.model';
import type { Seccion } from '../../core/models/seccion.model';
import { DialogService } from '../../core/services/dialog.service';

@Component({
  selector: 'app-asistencias-list',
  standalone: true,
  imports: [RouterLink, FormsModule, MatTableModule, MatPaginatorModule, MatSortModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule, MatCardModule, MatProgressSpinnerModule, MatSnackBarModule, MatChipsModule],
  template: `
    <div class="page-header">
      <h1>Asistencias</h1>
      <a mat-raised-button color="primary" [routerLink]="['/asistencias/create']"><mat-icon>add</mat-icon> Registrar asistencia</a>
    </div>
    <mat-card class="filters">
      <mat-card-content class="filter-row">
        <mat-form-field appearance="outline">
          <mat-label>Fecha</mat-label>
          <input matInput type="date" [(ngModel)]="fFecha" (ngModelChange)="applyFilters()" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Seccion</mat-label>
          <mat-select [(ngModel)]="fSeccion" (selectionChange)="applyFilters()">
            <mat-option [value]="null">Todas</mat-option>
            @for (s of secciones(); track s.id) {
              <mat-option [value]="s.id">{{ s.grado?.nombre }} {{ s.nombre }} ({{ s.turno }})</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Estado</mat-label>
          <mat-select [(ngModel)]="fEstado" (selectionChange)="applyFilters()">
            <mat-option [value]="null">Todos</mat-option>
            <mat-option value="presente">Presente</mat-option>
            <mat-option value="ausente">Ausente</mat-option>
            <mat-option value="tardia">Tardia</mat-option>
            <mat-option value="justificado">Justificado</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="grow">
          <mat-label>Buscar estudiante</mat-label>
          <input matInput [(ngModel)]="fSearch" (ngModelChange)="applyFilters()" placeholder="Nombres, apellidos o DNI" />
        </mat-form-field>
        <button mat-button (click)="clearFilters()">Limpiar</button>
      </mat-card-content>
    </mat-card>
    <mat-card>
      <mat-card-content>
        @if (loading()) {
          <div class="center"><mat-spinner diameter="40"></mat-spinner></div>
        } @else {
          <table mat-table [dataSource]="dataSource" matSort class="full-width">
            <ng-container matColumnDef="fecha">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Fecha</th>
              <td mat-cell *matCellDef="let row">{{ row.fecha }}</td>
            </ng-container>
            <ng-container matColumnDef="estudiante">
              <th mat-header-cell *matHeaderCellDef>Estudiante</th>
              <td mat-cell *matCellDef="let row">{{ nombreEstudiante(row) }}</td>
            </ng-container>
            <ng-container matColumnDef="seccion">
              <th mat-header-cell *matHeaderCellDef>Seccion</th>
              <td mat-cell *matCellDef="let row">{{ nombreSeccion(row) }}</td>
            </ng-container>
            <ng-container matColumnDef="estado">
              <th mat-header-cell *matHeaderCellDef>Estado</th>
              <td mat-cell *matCellDef="let row"><mat-chip [class]="'st-' + row.estado">{{ row.estado }}</mat-chip></td>
            </ng-container>
            <ng-container matColumnDef="motivo">
              <th mat-header-cell *matHeaderCellDef>Motivo</th>
              <td mat-cell *matCellDef="let row">{{ row.motivo_justificacion ?? '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="acciones">
              <th mat-header-cell *matHeaderCellDef>Acciones</th>
              <td mat-cell *matCellDef="let row">
                <a mat-icon-button color="primary" [routerLink]="['/asistencias', row.id]" title="Ver"><mat-icon>visibility</mat-icon></a>
                <button mat-icon-button color="warn" (click)="onDelete(row)" title="Eliminar"><mat-icon>delete</mat-icon></button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns;"></tr>
          </table>
          <mat-paginator [pageSizeOptions]="[10, 25, 50]" showFirstLastButtons></mat-paginator>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .filter-row { display: flex; gap: 1rem; flex-wrap: wrap; align-items: center; }
    .grow { flex: 1 1 200px; }
    .filters { margin-bottom: 1rem; }
    .full-width { width: 100%; }
    .center { display: flex; justify-content: center; padding: 2rem; }
    .st-presente { background: #dcfce7; color: #166534; }
    .st-ausente { background: #fee2e2; color: #991b1b; }
    .st-tardia { background: #fef3c7; color: #92400e; }
    .st-justificado { background: #dbeafe; color: #1e40af; }
  `],
})
export class AsistenciasListComponent {
  private dialogs = inject(DialogService);

  columns = ['fecha', 'estudiante', 'seccion', 'estado', 'motivo', 'acciones'];
  dataSource = new MatTableDataSource<Asistencia>([]);
  loading = signal(true);
  secciones = signal<Seccion[]>([]);
  fFecha: string | null = null;
  fSeccion: number | null = null;
  fEstado: EstadoAsistencia | null = null;
  fSearch = '';
  paginator = viewChild(MatPaginator);
  sort = viewChild(MatSort);

  private all = signal<Asistencia[]>([]);

  constructor(
    private service: AsistenciaService,
    private catalogos: CatalogosService,
    private snack: MatSnackBar
  ) {
    effect(() => {
      const p = this.paginator();
      if (p) this.dataSource.paginator = p;
      const s = this.sort();
      if (s) this.dataSource.sort = s;
    });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.catalogos.getSecciones().subscribe({ next: (s) => this.secciones.set(s), error: () => undefined });
    this.service.getAll().subscribe({
      next: (rows) => {
        this.all.set(rows);
        this.applyFilters();
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.snack.open(extractApiError(err, 'No se pudo cargar las asistencias'), 'Cerrar', { duration: 4000 });
      },
    });
  }

  applyFilters(): void {
    const q = this.fSearch.trim().toLowerCase();
    const filtered = this.all().filter((a) => {
      if (this.fFecha && a.fecha !== this.fFecha) return false;
      if (this.fEstado && a.estado !== this.fEstado) return false;
      if (this.fSeccion && a.matricula?.seccion_id !== this.fSeccion) return false;
      if (q) {
        const e = a.matricula?.estudiante;
        const hay = `${e?.nombres ?? ''} ${e?.apellidos ?? ''} ${e?.dni ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    this.dataSource.data = filtered;
  }

  clearFilters(): void {
    this.fFecha = null;
    this.fSeccion = null;
    this.fEstado = null;
    this.fSearch = '';
    this.applyFilters();
  }

  nombreEstudiante(a: Asistencia): string {
    const e = a.matricula?.estudiante;
    return e ? `${e.nombres} ${e.apellidos}` : `#${a.matricula_id}`;
  }

  nombreSeccion(a: Asistencia): string {
    const s = a.matricula?.seccion;
    return s ? `${s.grado?.nombre ?? ''} ${s.nombre}`.trim() : '-';
  }

  async onDelete(row: Asistencia): Promise<void> {
    const confirmed = await this.dialogs.confirm({
      title: 'Confirmar eliminacion',
      message: `Eliminar asistencia de ${this.nombreEstudiante(row)} del ${row.fecha}?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
      icon: 'delete',
    });
    if (!confirmed) return;
    this.service.delete(row.id).subscribe({
      next: () => {
        this.snack.open('Asistencia eliminada', 'Cerrar', { duration: 3000 });
        this.load();
      },
      error: (err) => this.snack.open(extractApiError(err, 'No se pudo cargar las asistencias'), 'Cerrar', { duration: 4000 }),
    });
  }
}
