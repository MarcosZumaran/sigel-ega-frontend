import { Component, OnInit, effect, signal, viewChild } from '@angular/core';
import { DatePipe, SlicePipe } from '@angular/common';
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
import { ApoderadoService } from './services/apoderado.service';
import { Apoderado } from '../../core/models/apoderado.model';
import { extractApiError } from '../../core/utils/api-error';

@Component({
  selector: 'app-apoderados-list',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DatePipe, SlicePipe, MatTableModule, MatPaginatorModule, MatSortModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule, MatSnackBarModule, MatCardModule],
  template: `
    <div class="page-header">
      <div>
        <h1>Apoderados</h1>
        <p>El apoderado se crea automaticamente al registrar un padre. Aqui se vinculan y desvinculan padres y estudiantes.</p>
      </div>
    </div>
    <mat-card>
      <mat-card-content>
        <mat-form-field appearance="outline" class="search">
          <mat-label>Buscar por UUID o DNI de padre</mat-label>
          <input matInput type="search" [formControl]="search" />
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
        @if (loading()) {
          <div class="loading"><mat-spinner diameter="40"></mat-spinner></div>
        } @else {
          <table mat-table [dataSource]="dataSource" matSort class="full-width">
            <ng-container matColumnDef="id">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>ID</th>
              <td mat-cell *matCellDef="let row">{{ row.id }}</td>
            </ng-container>
            <ng-container matColumnDef="uuid">
              <th mat-header-cell *matHeaderCellDef>UUID</th>
              <td mat-cell *matCellDef="let row" title="{{ row.uuid }}">{{ row.uuid | slice:0:8 }}…</td>
            </ng-container>
            <ng-container matColumnDef="padres">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Padres</th>
              <td mat-cell *matCellDef="let row">{{ row.padres_count ?? row.padres?.length ?? 0 }}</td>
            </ng-container>
            <ng-container matColumnDef="estudiantes">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Estudiantes</th>
              <td mat-cell *matCellDef="let row">{{ row.estudiantes_count ?? row.estudiantes?.length ?? 0 }}</td>
            </ng-container>
            <ng-container matColumnDef="created">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Creacion</th>
              <td mat-cell *matCellDef="let row">{{ row.created_at | date:'shortDate' }}</td>
            </ng-container>
            <ng-container matColumnDef="acciones">
              <th mat-header-cell *matHeaderCellDef>Acciones</th>
              <td mat-cell *matCellDef="let row">
                <a mat-icon-button color="primary" [routerLink]="['/apoderados', row.id]" title="Ver"><mat-icon>visibility</mat-icon></a>
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
    .page-header p { margin: 0.25rem 0 0; color: #64748b; }
    .search { width: 100%; max-width: 420px; }
    .full-width { width: 100%; }
    .loading { display: flex; justify-content: center; padding: 2rem; }
    .empty { text-align: center; color: #64748b; padding: 1.5rem; }
  `],
})
export class ApoderadosListComponent implements OnInit {
  loading = signal(true);
  displayedColumns = ['id', 'uuid', 'padres', 'estudiantes', 'created', 'acciones'];
  dataSource = new MatTableDataSource<Apoderado>([]);
  search = new FormControl('', { nonNullable: true });
  private paginator = viewChild(MatPaginator);
  private sort = viewChild(MatSort);

  constructor(private service: ApoderadoService, private snack: MatSnackBar) {
    effect(() => {
      const p = this.paginator();
      if (p) this.dataSource.paginator = p;
      const s = this.sort();
      if (s) this.dataSource.sort = s;
    });
  }

  ngOnInit(): void {
    this.dataSource.filterPredicate = (row, filter) => {
      const dnis = (row.padres ?? []).map((p) => p.dni).join(' ');
      const hay = `${row.uuid} ${dnis}`.toLowerCase();
      return hay.includes(filter);
    };
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
        this.snack.open(extractApiError(err, 'No se pudo cargar los apoderados'), 'Cerrar', { duration: 4000 });
      },
    });
  }

  trackById(_index: number, row: Apoderado): number {
    return row.id;
  }
}
