import { Component, OnInit, effect, signal, viewChild, inject} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { PeriodoService } from './services/periodo.service';
import { Periodo } from '../../core/models/periodo.model';
import { extractApiError } from '../../core/utils/api-error';
import { DialogService } from '../../core/services/dialog.service';

@Component({
  selector: 'app-periodos-list',
  standalone: true,
  imports: [RouterLink, MatTableModule, MatPaginatorModule, MatSortModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule, MatCardModule],
  template: `
    <div class="page-header">
      <div>
        <h1>Periodos academicos</h1>
        <p>Gestiona los anios lectivos del sistema.</p>
      </div>
      <a mat-raised-button color="primary" routerLink="create">+ Nuevo periodo</a>
    </div>
    <mat-card>
      <mat-card-content>
        @if (loading()) {
          <div class="loading"><mat-spinner diameter="40"></mat-spinner></div>
        } @else {
          <table mat-table [dataSource]="dataSource" matSort class="full-width">
            <ng-container matColumnDef="nombre">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Nombre</th>
              <td mat-cell *matCellDef="let row">{{ row.nombre }}</td>
            </ng-container>
            <ng-container matColumnDef="anio">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Anio</th>
              <td mat-cell *matCellDef="let row">{{ row.anio }}</td>
            </ng-container>
            <ng-container matColumnDef="vigencia">
              <th mat-header-cell *matHeaderCellDef>Vigencia</th>
              <td mat-cell *matCellDef="let row">{{ row.fecha_inicio ?? '—' }} → {{ row.fecha_fin ?? '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="activo">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Estado</th>
              <td mat-cell *matCellDef="let row">
                @if (row.activo) {
                  <span class="badge badge-active">Activo</span>
                } @else {
                  <span class="badge badge-inactive">Inactivo</span>
                }
              </td>
            </ng-container>
            <ng-container matColumnDef="acciones">
              <th mat-header-cell *matHeaderCellDef>Acciones</th>
              <td mat-cell *matCellDef="let row">
                <a mat-icon-button color="primary" [routerLink]="['/periodos', row.id]" title="Ver"><mat-icon>visibility</mat-icon></a>
                <a mat-icon-button color="accent" [routerLink]="[row.id, 'edit']" title="Editar"><mat-icon>edit</mat-icon></a>
                <button mat-icon-button color="warn" (click)="onDelete(row)" title="Eliminar"><mat-icon>delete</mat-icon></button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
          @if (!dataSource.data.length) {
            <p class="empty">Sin periodos registrados.</p>
          }
          <mat-paginator [pageSizeOptions]="[5, 10, 20]" showFirstLastButtons></mat-paginator>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .page-header h1 { margin: 0; color: #1E3A8A; }
    .page-header p { margin: 0.25rem 0 0; color: #64748b; }
    .full-width { width: 100%; }
    .loading { display: flex; justify-content: center; padding: 2rem; }
    .empty { text-align: center; color: #64748b; padding: 1.5rem; }
    .badge { border-radius: 9999px; padding: 0.15rem 0.65rem; font-size: 0.75rem; font-weight: 500; }
    .badge-active { background: #d1fae5; color: #065f46; }
    .badge-inactive { background: #f1f5f9; color: #475569; }
  `],
})
export class PeriodosListComponent implements OnInit {
  private dialogs = inject(DialogService);

  loading = signal(true);
  displayedColumns = ['nombre', 'anio', 'vigencia', 'activo', 'acciones'];
  dataSource = new MatTableDataSource<Periodo>([]);
  private paginator = viewChild(MatPaginator);
  private sort = viewChild(MatSort);

  constructor(private service: PeriodoService, private snack: MatSnackBar) {
    effect(() => {
      const p = this.paginator();
      if (p) this.dataSource.paginator = p;
      const s = this.sort();
      if (s) this.dataSource.sort = s;
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.service.getAll().subscribe({
      next: (res) => {
        this.dataSource.data = Array.isArray(res) ? res : [];
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.snack.open(extractApiError(err, 'No se pudo cargar los periodos'), 'Cerrar', { duration: 4000 });
      },
    });
  }

  trackById(_index: number, row: Periodo): number {
    return row.id;
  }

  async onDelete(row: Periodo): Promise<void> {
    const confirmed = await this.dialogs.confirm({
      title: 'Confirmar eliminacion',
      message: `Eliminar el periodo "${row.nombre}"?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
      icon: 'delete',
    });
    if (!confirmed) return;
    this.service.delete(row.id).subscribe({
      next: (res) => {
        this.snack.open(res.message ?? 'Periodo eliminado', 'Cerrar', { duration: 3000 });
        this.load();
      },
      error: (err) => {
        this.snack.open(extractApiError(err, 'No se pudo eliminar el periodo'), 'Cerrar', { duration: 4000 });
      },
    });
  }
}
