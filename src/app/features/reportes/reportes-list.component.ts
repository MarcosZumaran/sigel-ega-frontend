import { Component, signal, viewChild, effect, inject} from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { ReporteService } from './services/reporte.service';
import { CatalogosService } from '../../core/services/catalogos.service';
import { extractApiError } from '../../core/utils/api-error';
import type { Reporte, TipoReporte, FormatoReporte } from '../../core/models/reporte.model';
import type { Periodo } from '../../core/models/periodo.model';
import { DialogService } from '../../core/services/dialog.service';

@Component({
  selector: 'app-reportes-list',
  standalone: true,
  imports: [RouterLink, DatePipe, FormsModule, MatTableModule, MatPaginatorModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule, MatCardModule, MatProgressSpinnerModule, MatSnackBarModule, MatChipsModule],
  template: `
    <div class="page-header">
      <h1>Reportes</h1>
      <a mat-raised-button color="primary" routerLink="create"><mat-icon>add</mat-icon> Generar reporte</a>
    </div>
    <mat-card class="filters">
      <mat-card-content class="filter-row">
        <mat-form-field appearance="outline">
          <mat-label>Tipo</mat-label>
          <mat-select [(ngModel)]="fTipo" (selectionChange)="goPage(0)">
            <mat-option [value]="null">Todos</mat-option>
            <mat-option value="auxiliar">Auxiliar</mat-option>
            <mat-option value="asistencia">Asistencia</mat-option>
            <mat-option value="matriculas">Matriculas</mat-option>
            <mat-option value="notas">Notas</mat-option>
            <mat-option value="general">General</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Periodo</mat-label>
          <mat-select [(ngModel)]="fPeriodo" (selectionChange)="goPage(0)">
            <mat-option [value]="null">Todos</mat-option>
            @for (p of periodos(); track p.id) {
              <mat-option [value]="p.id">{{ p.nombre }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Formato</mat-label>
          <mat-select [(ngModel)]="fFormato" (selectionChange)="goPage(0)">
            <mat-option [value]="null">Todos</mat-option>
            <mat-option value="pdf">PDF</mat-option>
            <mat-option value="excel">Excel</mat-option>
            <mat-option value="csv">CSV</mat-option>
          </mat-select>
        </mat-form-field>
        <button mat-button (click)="clearFilters()">Limpiar</button>
      </mat-card-content>
    </mat-card>
    <mat-card>
      <mat-card-content>
        @if (loading()) {
          <div class="center"><mat-spinner diameter="40"></mat-spinner></div>
        } @else {
          <table mat-table [dataSource]="dataSource" class="full-width">
            <ng-container matColumnDef="tipo">
              <th mat-header-cell *matHeaderCellDef>Tipo</th>
              <td mat-cell *matCellDef="let row">{{ row.tipo }}</td>
            </ng-container>
            <ng-container matColumnDef="periodo">
              <th mat-header-cell *matHeaderCellDef>Periodo</th>
              <td mat-cell *matCellDef="let row">{{ row.periodo?.nombre ?? '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="seccion">
              <th mat-header-cell *matHeaderCellDef>Seccion</th>
              <td mat-cell *matCellDef="let row">{{ nombreSeccion(row) }}</td>
            </ng-container>
            <ng-container matColumnDef="formato">
              <th mat-header-cell *matHeaderCellDef>Formato</th>
              <td mat-cell *matCellDef="let row">{{ row.formato }}</td>
            </ng-container>
            <ng-container matColumnDef="estado">
              <th mat-header-cell *matHeaderCellDef>Estado</th>
              <td mat-cell *matCellDef="let row"><mat-chip class="est-{{ row.estado }}">{{ row.estado }}</mat-chip></td>
            </ng-container>
            <ng-container matColumnDef="fecha">
              <th mat-header-cell *matHeaderCellDef>Generado</th>
              <td mat-cell *matCellDef="let row">{{ row.created_at | date:'dd/MM/yyyy HH:mm' }}</td>
            </ng-container>
            <ng-container matColumnDef="acciones">
              <th mat-header-cell *matHeaderCellDef>Acciones</th>
              <td mat-cell *matCellDef="let row">
                <a mat-icon-button color="primary" [routerLink]="['/reportes', row.id]" title="Ver"><mat-icon>visibility</mat-icon></a>
                <button mat-icon-button (click)="onDownload(row)" title="Descargar"><mat-icon>download</mat-icon></button>
                <button mat-icon-button color="warn" (click)="onDelete(row)" title="Eliminar"><mat-icon>delete</mat-icon></button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns;"></tr>
          </table>
          <mat-paginator [length]="total()" [pageSize]="perPage" [pageSizeOptions]="[10, 25]" (page)="onPage($event)" showFirstLastButtons></mat-paginator>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .filter-row { display: flex; gap: 1rem; flex-wrap: wrap; align-items: center; }
    .filters { margin-bottom: 1rem; }
    .full-width { width: 100%; }
    .center { display: flex; justify-content: center; padding: 2rem; }
    .est-generado { background: #dcfce7 !important; color: #166534 !important; }
    .est-cacheado { background: #dbeafe !important; color: #1d4ed8 !important; }
    .est-expirado { background: #e2e8f0 !important; color: #475569 !important; }
    td mat-icon { font-size: 26px; width: 26px; height: 26px; }
  `],
})
export class ReportesListComponent {
  private dialogs = inject(DialogService);

  columns = ['tipo', 'periodo', 'seccion', 'formato', 'estado', 'fecha', 'acciones'];
  dataSource = new MatTableDataSource<Reporte>([]);
  loading = signal(true);
  periodos = signal<Periodo[]>([]);
  total = signal(0);
  perPage = 10;
  page = 0;
  fTipo: TipoReporte | null = null;
  fPeriodo: number | null = null;
  fFormato: FormatoReporte | null = null;
  paginator = viewChild(MatPaginator);

  constructor(
    private service: ReporteService,
    private catalogos: CatalogosService,
    private snack: MatSnackBar
  ) {
    effect(() => {
      const p = this.paginator();
      if (p) p.pageIndex = this.page;
    });
    this.catalogos.getPeriodos().subscribe({ next: (p) => this.periodos.set(p), error: () => undefined });
    this.load();
  }

  params(): Record<string, string | number | boolean> {
    const p: Record<string, string | number | boolean> = { per_page: this.perPage, page: this.page + 1 };
    if (this.fTipo) p['tipo'] = this.fTipo;
    if (this.fPeriodo) p['periodo_id'] = this.fPeriodo;
    if (this.fFormato) p['formato'] = this.fFormato;
    return p;
  }

  load(): void {
    this.loading.set(true);
    this.service.getAll(this.params()).subscribe({
      next: (res) => {
        this.dataSource.data = res.data;
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.snack.open(extractApiError(err, 'No se pudo cargar los reportes'), 'Cerrar', { duration: 4000 });
      },
    });
  }

  goPage(page: number): void {
    this.page = page;
    this.load();
  }

  onPage(e: PageEvent): void {
    this.page = e.pageIndex;
    this.perPage = e.pageSize;
    this.load();
  }

  clearFilters(): void {
    this.fTipo = null;
    this.fPeriodo = null;
    this.fFormato = null;
    this.goPage(0);
  }

  nombreSeccion(r: Reporte): string {
    const s = r.seccion;
    return s ? `${s.grado?.nombre ?? ''} ${s.nombre}`.trim() : '-';
  }

  onDownload(row: Reporte): void {
    this.service.descargar(row.id).subscribe({
      next: (blob) => this.saveBlob(blob, row),
      error: () => this.snack.open('No se pudo descargar el archivo', 'Cerrar', { duration: 4000 }),
    });
  }

  saveBlob(blob: Blob, row: Reporte): void {
    const url = URL.createObjectURL(blob);
    const ext = row.formato === 'pdf' ? 'pdf' : row.formato === 'excel' ? 'xlsx' : 'csv';
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-${row.tipo}-${row.id}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async onDelete(row: Reporte): Promise<void> {
    const confirmed = await this.dialogs.confirm({
      title: 'Confirmar eliminacion',
      message: `Eliminar reporte ${row.tipo} #${row.id}?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
      icon: 'delete',
    });
    if (!confirmed) return;
    this.service.delete(row.id).subscribe({
      next: () => {
        this.snack.open('Reporte eliminado', 'Cerrar', { duration: 3000 });
        this.load();
      },
      error: (err) => this.snack.open(extractApiError(err, 'No se pudo cargar los reportes'), 'Cerrar', { duration: 4000 }),
    });
  }
}
