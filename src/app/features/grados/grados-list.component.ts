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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { GradoService } from './services/grado.service';
import { Grado } from '../../core/models/grado.model';
import { extractApiError } from '../../core/utils/api-error';
import { DialogService } from '../../core/services/dialog.service';
import { GradoFormDialogComponent } from '../../shared/dialogs/grado-form-dialog.component';

@Component({
  selector: 'app-grados-list',
  standalone: true,
  imports: [RouterLink, MatTableModule, MatPaginatorModule, MatSortModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule, MatCardModule, MatDialogModule],
  template: `
    <div class="page-header">
      <div>
        <h1>Grados</h1>
        <p>Gestiona los grados por nivel educativo.</p>
      </div>
      <button mat-raised-button color="primary" (click)="openCrear()">+ Nuevo grado</button>
    </div>
    <mat-card>
      <mat-card-content>
        @if (loading()) {
          <div class="loading"><mat-spinner diameter="40"></mat-spinner></div>
        } @else {
          <table mat-table [dataSource]="dataSource" matSort class="full-width">
            <ng-container matColumnDef="nivel">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Nivel</th>
              <td mat-cell *matCellDef="let row">{{ row.nivel?.nombre ?? '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="nombre">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Nombre</th>
              <td mat-cell *matCellDef="let row">{{ row.nombre }}</td>
            </ng-container>
            <ng-container matColumnDef="acciones">
              <th mat-header-cell *matHeaderCellDef>Acciones</th>
              <td mat-cell *matCellDef="let row">
                <a mat-icon-button color="primary" [routerLink]="['/grados', row.id]" title="Ver"><mat-icon>visibility</mat-icon></a>
                <button mat-icon-button color="accent" (click)="openEditar(row)" title="Editar"><mat-icon>edit</mat-icon></button>
                <button mat-icon-button color="warn" (click)="onDelete(row)" title="Eliminar"><mat-icon>delete</mat-icon></button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
          @if (!dataSource.data.length) {
            <p class="empty">Sin grados registrados.</p>
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
  `],
})
export class GradosListComponent implements OnInit {
  private dialogs = inject(DialogService);

  loading = signal(true);
  displayedColumns = ['nivel', 'nombre', 'acciones'];
  dataSource = new MatTableDataSource<Grado>([]);
  private paginator = viewChild(MatPaginator);
  private sort = viewChild(MatSort);

  constructor(private service: GradoService, private snack: MatSnackBar, private dialog: MatDialog) {
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
        this.snack.open(extractApiError(err, 'No se pudo cargar los grados'), 'Cerrar', { duration: 4000 });
      },
    });
  }

  trackById(_index: number, row: Grado): number {
    return row.id;
  }

  openCrear(): void {
    this.dialog.open(GradoFormDialogComponent, { data: {} })
      .afterClosed().subscribe((ok) => { if (ok) this.load(); });
  }

  openEditar(row: Grado): void {
    this.dialog.open(GradoFormDialogComponent, { data: { grado: row } })
      .afterClosed().subscribe((ok) => { if (ok) this.load(); });
  }

  async onDelete(row: Grado): Promise<void> {
    const confirmed = await this.dialogs.confirm({
      title: 'Confirmar eliminacion',
      message: `Eliminar el grado "${row.nombre}"?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
      icon: 'delete',
    });
    if (!confirmed) return;
    this.service.delete(row.id).subscribe({
      next: (res) => {
        this.snack.open(res.message ?? 'Grado eliminado', 'Cerrar', { duration: 3000 });
        this.load();
      },
      error: (err) => {
        this.snack.open(extractApiError(err, 'No se pudo eliminar el grado'), 'Cerrar', { duration: 4000 });
      },
    });
  }
}
