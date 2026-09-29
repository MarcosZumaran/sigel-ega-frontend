import { Component, OnInit, signal, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { DatePipe } from '@angular/common';
import { BimestreService } from '../notas/services/bimestre.service';
import { BackButtonComponent } from '../../shared/components/back-button.component';
import { extractApiError } from '../../core/utils/api-error';
import { Bimestre } from '../../core/models/bimestre.model';
import {
  BimestreEditDialogComponent,
  BimestreEditData,
} from './bimestre-edit-dialog.component';

@Component({
  selector: 'app-periodos-bimestres',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatChipsModule,
    DatePipe,
    BackButtonComponent,
  ],
  template: `
    <app-back-button />
    <h1>Bimestres del período</h1>
    <p class="subtitle">Período #{{ periodoId() }}</p>

    <mat-card>
      <mat-card-content class="actions-row">
        <button mat-flat-button color="primary" (click)="generar(false)" [disabled]="loading()">
          <mat-icon>auto_awesome</mat-icon>
          Generar bimestres automáticamente
        </button>
        <button mat-stroked-button (click)="generar(true)" [disabled]="loading()">
          <mat-icon>refresh</mat-icon>
          Regenerar (sobrescribir)
        </button>
      </mat-card-content>
    </mat-card>

    @if (loading()) {
      <div class="spinner-wrap"><mat-spinner diameter="40"></mat-spinner></div>
    } @else if (bimestres().length === 0) {
      <mat-card class="empty-state">
        <mat-card-content>
          <mat-icon>calendar_month</mat-icon>
          <p>Este período aún no tiene bimestres.</p>
          <p>Genérelos automáticamente o regístrelos desde el backend.</p>
        </mat-card-content>
      </mat-card>
    } @else {
      <mat-card>
        <table mat-table [dataSource]="bimestres()" class="full-width">
          <ng-container matColumnDef="numero">
            <th mat-header-cell *matHeaderCellDef>N°</th>
            <td mat-cell *matCellDef="let b">{{ b.numero }}</td>
          </ng-container>
          <ng-container matColumnDef="nombre">
            <th mat-header-cell *matHeaderCellDef>Nombre</th>
            <td mat-cell *matCellDef="let b">{{ b.nombre }}</td>
          </ng-container>
          <ng-container matColumnDef="inicio">
            <th mat-header-cell *matHeaderCellDef>Inicio</th>
            <td mat-cell *matCellDef="let b">{{ b.fecha_inicio ? (b.fecha_inicio | date:'dd/MM/yyyy':'+0000') : '—' }}</td>
          </ng-container>
          <ng-container matColumnDef="fin">
            <th mat-header-cell *matHeaderCellDef>Fin</th>
            <td mat-cell *matCellDef="let b">{{ b.fecha_fin ? (b.fecha_fin | date:'dd/MM/yyyy':'+0000') : '—' }}</td>
          </ng-container>
          <ng-container matColumnDef="estado">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let b">
              <mat-chip [highlighted]="b.activo" [color]="b.activo ? 'primary' : undefined">
                {{ b.activo ? 'Activo' : 'Cerrado' }}
              </mat-chip>
            </td>
          </ng-container>
          <ng-container matColumnDef="acciones">
            <th mat-header-cell *matHeaderCellDef>Acciones</th>
            <td mat-cell *matCellDef="let b">
              <button mat-icon-button color="primary" (click)="editar(b)" aria-label="Editar bimestre">
                <mat-icon>edit</mat-icon>
              </button>
              @if (!b.activo) {
                <button mat-icon-button color="accent" (click)="activar(b)" aria-label="Activar bimestre">
                  <mat-icon>check_circle</mat-icon>
                </button>
              }
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols;"></tr>
        </table>
      </mat-card>
    }
  `,
  styles: [`
    h1 { margin: 0.5rem 0 0; }
    .subtitle { color: #64748b; margin: 0 0 1rem; }
    .actions-row { display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .spinner-wrap { display: flex; justify-content: center; padding: 2rem; }
    .empty-state { text-align: center; padding: 2rem; color: #64748b; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .full-width { width: 100%; }
    mat-card { margin-bottom: 1rem; }
  `],
})
export class PeriodosBimestresComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private bimestresSvc = inject(BimestreService);
  private snack = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  loading = signal(true);
  periodoId = signal<number>(0);
  bimestres = signal<Bimestre[]>([]);
  cols = ['numero', 'nombre', 'inicio', 'fin', 'estado', 'acciones'];

  ngOnInit(): void {
    this.periodoId.set(Number(this.route.snapshot.paramMap.get('id')));
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.bimestresSvc.getByPeriodo(this.periodoId()).subscribe({
      next: (rows) => {
        this.bimestres.set(rows);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.snack.open(extractApiError(err, 'No se pudieron cargar los bimestres'), 'Cerrar', { duration: 4000 });
      },
    });
  }

  generar(sobrescribir: boolean): void {
    this.loading.set(true);
    this.bimestresSvc.generar(this.periodoId(), undefined, sobrescribir).subscribe({
      next: (res) => {
        this.snack.open(res.message ?? 'Bimestres generados', 'Cerrar', { duration: 4000 });
        this.cargar();
      },
      error: (err) => {
        this.loading.set(false);
        this.snack.open(extractApiError(err, 'No se pudieron generar los bimestres'), 'Cerrar', { duration: 4000 });
      },
    });
  }

  editar(b: Bimestre): void {
    const ref = this.dialog.open<BimestreEditDialogComponent, BimestreEditData, BimestreEditData>(BimestreEditDialogComponent, {
      width: '480px',
      data: { nombre: b.nombre, fecha_inicio: b.fecha_inicio ?? null, fecha_fin: b.fecha_fin ?? null, activo: b.activo },
    });
    ref.afterClosed().subscribe((data) => {
      if (!data) return;
      this.bimestresSvc.update(b.id, data).subscribe({
        next: () => {
          this.snack.open('Bimestre actualizado', 'Cerrar', { duration: 3000 });
          this.cargar();
        },
        error: (err) => this.snack.open(extractApiError(err, 'No se pudo actualizar'), 'Cerrar', { duration: 4000 }),
      });
    });
  }

  activar(b: Bimestre): void {
    this.bimestresSvc.activar(b.id).subscribe({
      next: () => {
        this.snack.open(`Bimestre ${b.nombre} activado`, 'Cerrar', { duration: 3000 });
        this.cargar();
      },
      error: (err) => this.snack.open(extractApiError(err, 'No se pudo activar'), 'Cerrar', { duration: 4000 }),
    });
  }
}
