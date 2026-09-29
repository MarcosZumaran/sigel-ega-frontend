import { Component, OnInit, effect, signal, viewChild, inject} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { EstudianteService } from './services/estudiante.service';
import { Estudiante } from '../../core/models/estudiante.model';
import { extractApiError } from '../../core/utils/api-error';
import { DialogService } from '../../core/services/dialog.service';
import { ModuleHomeComponent } from '../../shared/components/module-home.component';

@Component({
  selector: 'app-estudiantes-list',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatTableModule, MatPaginatorModule, MatSortModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule, MatSnackBarModule, MatCardModule, ModuleHomeComponent],
  template: `
    <div class="page-header">
      <h1>Estudiantes</h1>
      <a mat-raised-button color="primary" routerLink="create"><mat-icon>add</mat-icon>Nuevo estudiante</a>
    </div>
    <app-module-home moduleName="Estudiantes"
      [actions]="[{label: 'Nuevo estudiante', icon: 'add', link: 'create'}, {label: 'Matricular', icon: 'app_registration', link: '/matriculas/create'}]"
      recentTitle="Últimos estudiantes" [items]="recentItems()" />
    <mat-card>
      <mat-card-content>
        <mat-form-field appearance="outline" class="search">
          <mat-label>Buscar por DNI o apellidos</mat-label>
          <input matInput type="search" [formControl]="search" />
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
        @if (loading()) {
          <div class="loading"><mat-spinner diameter="40"></mat-spinner></div>
        } @else {
          <table mat-table [dataSource]="dataSource" matSort class="full-width">
            <ng-container matColumnDef="dni">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>DNI</th>
              <td mat-cell *matCellDef="let row">{{ row.dni }}</td>
            </ng-container>
            <ng-container matColumnDef="codigo">
              <th mat-header-cell *matHeaderCellDef>Codigo</th>
              <td mat-cell *matCellDef="let row">{{ row.codigo_estudiante ?? '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="nombres">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Nombres</th>
              <td mat-cell *matCellDef="let row">{{ row.nombres }} {{ row.apellidos }}</td>
            </ng-container>
            <ng-container matColumnDef="nivel">
              <th mat-header-cell *matHeaderCellDef>Nivel</th>
              <td mat-cell *matCellDef="let row">{{ row.nivel?.nombre ?? '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="grado">
              <th mat-header-cell *matHeaderCellDef>Grado</th>
              <td mat-cell *matCellDef="let row">{{ row.grado?.nombre ?? '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="apoderado">
              <th mat-header-cell *matHeaderCellDef>Apoderado</th>
              <td mat-cell *matCellDef="let row">
                <a [routerLink]="['/apoderados', row.apoderado_id]">#{{ row.apoderado_id }}</a>
              </td>
            </ng-container>
            <ng-container matColumnDef="acciones">
              <th mat-header-cell *matHeaderCellDef>Acciones</th>
              <td mat-cell *matCellDef="let row">
                <a mat-icon-button color="primary" [routerLink]="['/estudiantes', row.id]" title="Ver"><mat-icon>visibility</mat-icon></a>
                <a mat-icon-button color="accent" [routerLink]="[row.id, 'edit']" title="Editar"><mat-icon>edit</mat-icon></a>
                <button mat-icon-button color="warn" (click)="onDelete(row)" title="Eliminar"><mat-icon>delete</mat-icon></button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
          @if (!dataSource.filteredData.length) {
            <p class="empty">Sin resultados.</p>
          }
          <mat-paginator [pageSizeOptions]="[5, 10, 20]" showFirstLastButtons></mat-paginator>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .page-header h1 { margin: 0; color: #1E3A8A; }
    .search { width: 100%; max-width: 420px; }
    .full-width { width: 100%; }
    .loading { display: flex; justify-content: center; padding: 2rem; }
    .empty { text-align: center; color: #64748b; padding: 1.5rem; }
  `],
})
export class EstudiantesListComponent implements OnInit {
  private dialogs = inject(DialogService);

  loading = signal(true);
  displayedColumns = ['dni', 'codigo', 'nombres', 'nivel', 'grado', 'apoderado', 'acciones'];
  dataSource = new MatTableDataSource<Estudiante>([]);
  search = new FormControl('', { nonNullable: true });
  private paginator = viewChild(MatPaginator);
  private sort = viewChild(MatSort);

  constructor(private service: EstudianteService, private snack: MatSnackBar) {
    effect(() => {
      const p = this.paginator();
      if (p) this.dataSource.paginator = p;
      const s = this.sort();
      if (s) this.dataSource.sort = s;
    });
  }

  ngOnInit(): void {
    this.dataSource.filterPredicate = (row, filter) =>
      `${row.dni ?? ''} ${row.nombres} ${row.apellidos} ${row.codigo_estudiante ?? ''}`.toLowerCase().includes(filter);
    this.search.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe((v) => {
      this.dataSource.filter = v.trim().toLowerCase();
      this.dataSource.paginator?.firstPage();
    });
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
        this.snack.open(extractApiError(err, 'No se pudo cargar los estudiantes'), 'Cerrar', { duration: 4000 });
      },
    });
  }

  recentItems(): { title: string; subtitle?: string; link?: string[] }[] {
    return [...this.dataSource.data].sort((a, b) => b.id - a.id).slice(0, 5).map((r) => ({
      title: `${r.nombres} ${r.apellidos}`,
      subtitle: `DNI ${r.dni}`,
      link: [String(r.id)],
    }));
  }

  async onDelete(row: Estudiante): Promise<void> {
    const confirmed = await this.dialogs.confirm({
      title: 'Confirmar eliminacion',
      message: `Eliminar al estudiante ${row.nombres} ${row.apellidos}?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
      icon: 'delete',
    });
    if (!confirmed) return;
    this.service.delete(row.id).subscribe({
      next: (res) => {
        this.snack.open(res.message ?? 'Estudiante eliminado', 'Cerrar', { duration: 3000 });
        this.load();
      },
      error: (err) => this.snack.open(extractApiError(err, 'No se pudo eliminar'), 'Cerrar', { duration: 4000 }),
    });
  }
}
