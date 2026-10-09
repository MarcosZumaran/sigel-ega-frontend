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
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatriculaService } from './services/matricula.service';
import { CatalogosService } from '../../core/services/catalogos.service';
import { Matricula, TipoMatricula } from '../../core/models/matricula.model';
import { Periodo } from '../../core/models/periodo.model';
import { extractApiError } from '../../core/utils/api-error';
import { DialogService } from '../../core/services/dialog.service';

@Component({
  selector: 'app-matriculas-list',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatTableModule, MatPaginatorModule, MatSortModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressSpinnerModule, MatSnackBarModule, MatCardModule],
  template: `
    <div class="page-header">
      <h1>Matriculas</h1>
      <a mat-raised-button color="primary" routerLink="create"><mat-icon>add</mat-icon>Nueva matricula</a>
    </div>
    <mat-card>
      <mat-card-content>
        <div class="filters">
          <mat-form-field appearance="outline" class="search">
            <mat-label>Buscar por estudiante</mat-label>
            <input matInput type="search" [formControl]="search" />
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Periodo</mat-label>
            <mat-select [formControl]="fPeriodo">
              <mat-option [value]="0">Todos</mat-option>
              @for (p of periodos(); track p.id) {
                <mat-option [value]="p.id">{{ p.nombre }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Tipo</mat-label>
            <mat-select [formControl]="fTipo">
              <mat-option [value]="0">Todos</mat-option>
              @for (t of tipos(); track t.id) {
                <mat-option [value]="t.id">{{ t.nombre }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>
        @if (loading()) {
          <div class="loading"><mat-spinner diameter="40"></mat-spinner></div>
        } @else {
          <table mat-table [dataSource]="dataSource" matSort class="full-width">
            <ng-container matColumnDef="estudiante">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Estudiante</th>
              <td mat-cell *matCellDef="let row">{{ row.estudiante?.nombres }} {{ row.estudiante?.apellidos }}</td>
            </ng-container>
            <ng-container matColumnDef="seccion">
              <th mat-header-cell *matHeaderCellDef>Seccion</th>
              <td mat-cell *matCellDef="let row">{{ row.seccion?.grado?.nombre ?? '' }} {{ row.seccion?.nombre }}</td>
            </ng-container>
            <ng-container matColumnDef="periodo">
              <th mat-header-cell *matHeaderCellDef>Periodo</th>
              <td mat-cell *matCellDef="let row">{{ row.periodo?.nombre }}</td>
            </ng-container>
            <ng-container matColumnDef="tipo">
              <th mat-header-cell *matHeaderCellDef>Tipo</th>
              <td mat-cell *matCellDef="let row">{{ row.tipo_matricula?.nombre }}</td>
            </ng-container>
            <ng-container matColumnDef="fecha">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Fecha</th>
              <td mat-cell *matCellDef="let row">{{ row.fecha }}</td>
            </ng-container>
            <ng-container matColumnDef="acciones">
              <th mat-header-cell *matHeaderCellDef>Acciones</th>
              <td mat-cell *matCellDef="let row">
                <a mat-icon-button color="primary" [routerLink]="['/matriculas', row.id]" title="Ver"><mat-icon>visibility</mat-icon></a>
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
    .filters { display: flex; gap: 1rem; flex-wrap: wrap; }
    .search { flex: 1 1 280px; }
    .full-width { width: 100%; }
    .loading { display: flex; justify-content: center; padding: 2rem; }
    .empty { text-align: center; color: #64748b; padding: 1.5rem; }
  `],
})
export class MatriculasListComponent implements OnInit {
  private dialogs = inject(DialogService);

  loading = signal(true);
  displayedColumns = ['estudiante', 'periodo', 'seccion', 'tipo', 'fecha', 'acciones'];
  dataSource = new MatTableDataSource<Matricula>([]);
  search = new FormControl('', { nonNullable: true });
  fPeriodo = new FormControl(0, { nonNullable: true });
  fTipo = new FormControl(0, { nonNullable: true });
  periodos = signal<Periodo[]>([]);
  tipos = signal<TipoMatricula[]>([]);
  private paginator = viewChild(MatPaginator);
  private sort = viewChild(MatSort);

  constructor(
    private service: MatriculaService,
    private catalogos: CatalogosService,
    private snack: MatSnackBar,
  ) {
    effect(() => {
      const p = this.paginator();
      if (p) this.dataSource.paginator = p;
      const s = this.sort();
      if (s) this.dataSource.sort = s;
    });
  }

  ngOnInit(): void {
    this.dataSource.filterPredicate = (row) => {
      const periodoOk = !this.fPeriodo.value || Number(row.periodo_id) === this.fPeriodo.value;
      const tipoOk = !this.fTipo.value || Number(row.tipo_matricula_id) === this.fTipo.value;
      const t = this.search.value.trim().toLowerCase();
      const textoOk = !t || `${row.estudiante?.nombres ?? ''} ${row.estudiante?.apellidos ?? ''} ${row.estudiante?.dni ?? ''}`.toLowerCase().includes(t);
      return periodoOk && tipoOk && textoOk;
    };
    const refilter = () => { this.dataSource.filter = `${Date.now()}`; };
    this.search.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(refilter);
    this.fPeriodo.valueChanges.subscribe(refilter);
    this.fTipo.valueChanges.subscribe(refilter);
    this.catalogos.getPeriodos().subscribe({ next: (r) => this.periodos.set(Array.isArray(r) ? r : []) });
    this.catalogos.getTiposMatricula().subscribe({ next: (r) => this.tipos.set(Array.isArray(r) ? r : []) });
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
        this.snack.open(extractApiError(err, 'No se pudo cargar las matriculas'), 'Cerrar', { duration: 4000 });
      },
    });
  }

  async onDelete(row: Matricula): Promise<void> {
    const confirmed = await this.dialogs.confirm({
      title: 'Confirmar eliminacion',
      message: 'Eliminar esta matricula?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
      icon: 'delete',
    });
    if (!confirmed) return;
    this.service.delete(row.id).subscribe({
      next: (res) => {
        this.snack.open(res.message ?? 'Matricula eliminada', 'Cerrar', { duration: 3000 });
        this.load();
      },
      error: (err) => this.snack.open(extractApiError(err, 'No se pudo eliminar'), 'Cerrar', { duration: 4000 }),
    });
  }
}
