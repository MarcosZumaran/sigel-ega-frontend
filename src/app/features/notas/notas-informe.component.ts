import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BackButtonComponent } from '../../shared/components/back-button.component';
import { InformeService, InformeProgreso } from './services/informe.service';
import { extractApiError } from '../../core/utils/api-error';

@Component({
  selector: 'app-notas-informe',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatTableModule, MatProgressSpinnerModule, MatSnackBarModule, BackButtonComponent],
  template: `
    <app-back-button />
    <h1>Informe de Progreso</h1>
    @if (loading()) {
      <mat-spinner diameter="40"></mat-spinner>
    } @else if (informe()) {
      <div class="boleta-head no-print">
        <div>
          <h2>{{ informe()!.estudiante.nombres }} {{ informe()!.estudiante.apellidos }}</h2>
          <p>DNI {{ informe()!.estudiante.dni }} — Período {{ informe()!.periodo.nombre }}</p>
        </div>
        <div class="boleta-actions">
          <button mat-raised-button color="primary" (click)="descargarPdf()"><mat-icon>download</mat-icon> Descargar PDF</button>
          <button mat-stroked-button (click)="imprimir()"><mat-icon>print</mat-icon> Imprimir</button>
        </div>
      </div>
      @for (area of informe()!.areas; track area.id) {
        <mat-card class="area-card">
          <mat-card-header>
            <mat-card-title>{{ area.nombre }}</mat-card-title>
            <mat-card-subtitle>Nivel del área: <strong class="niv-{{ area.nivel_logro_area?.toLowerCase() }}">{{ area.nivel_logro_area ?? '—' }}</strong></mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <table mat-table [dataSource]="area.competencias" class="mat-elevation-z1">
              <ng-container matColumnDef="competencia">
                <th mat-header-cell *matHeaderCellDef>Competencia</th>
                <td mat-cell *matCellDef="let c">{{ c.nombre }}</td>
              </ng-container>
              <ng-container matColumnDef="b1">
                <th mat-header-cell *matHeaderCellDef>B1</th>
                <td mat-cell *matCellDef="let c"><span class="niv-{{ c.bimestres['1']?.nivel?.toLowerCase() }}">{{ c.bimestres['1']?.nivel ?? '—' }}</span></td>
              </ng-container>
              <ng-container matColumnDef="b2">
                <th mat-header-cell *matHeaderCellDef>B2</th>
                <td mat-cell *matCellDef="let c"><span class="niv-{{ c.bimestres['2']?.nivel?.toLowerCase() }}">{{ c.bimestres['2']?.nivel ?? '—' }}</span></td>
              </ng-container>
              <ng-container matColumnDef="b3">
                <th mat-header-cell *matHeaderCellDef>B3</th>
                <td mat-cell *matCellDef="let c"><span class="niv-{{ c.bimestres['3']?.nivel?.toLowerCase() }}">{{ c.bimestres['3']?.nivel ?? '—' }}</span></td>
              </ng-container>
              <ng-container matColumnDef="b4">
                <th mat-header-cell *matHeaderCellDef>B4</th>
                <td mat-cell *matCellDef="let c"><span class="niv-{{ c.bimestres['4']?.nivel?.toLowerCase() }}">{{ c.bimestres['4']?.nivel ?? '—' }}</span></td>
              </ng-container>
              <ng-container matColumnDef="final">
                <th mat-header-cell *matHeaderCellDef>Final</th>
                <td mat-cell *matCellDef="let c"><strong class="niv-{{ c.nivel_final?.toLowerCase() }}">{{ c.nivel_final ?? '—' }}</strong></td>
              </ng-container>
              <ng-container matColumnDef="conclusion">
                <th mat-header-cell *matHeaderCellDef>Conclusión</th>
                <td mat-cell *matCellDef="let c">{{ conclusionDe(c) }}</td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="cols"></tr>
              <tr mat-row *matRowDef="let row; columns: cols;"></tr>
            </table>
          </mat-card-content>
        </mat-card>
      }
    } @else {
      <p>No se pudo cargar el informe.</p>
    }
  `,
  styles: [`
    .boleta-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem; }
    .boleta-actions { display: flex; gap: 0.5rem; }
    .area-card { margin-bottom: 1rem; }
    .niv-ad { color: #16a34a; font-weight: 700; }
    .niv-a { color: #2563eb; font-weight: 700; }
    .niv-b { color: #b45309; font-weight: 700; }
    .niv-c { color: #dc2626; font-weight: 700; }
    @media print {
      .no-print, app-back-button { display: none !important; }
    }
  `],
})
export class NotasInformeComponent implements OnInit {
  loading = signal(true);
  informe = signal<InformeProgreso | null>(null);
  cols = ['competencia', 'b1', 'b2', 'b3', 'b4', 'final', 'conclusion'];
  private id = 0;

  constructor(private route: ActivatedRoute, private svc: InformeService, private snack: MatSnackBar) {}

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('estudianteId'));
    this.svc.getInforme(this.id).subscribe({
      next: (d) => { this.informe.set(d); this.loading.set(false); },
      error: (e) => { this.loading.set(false); this.snack.open(extractApiError(e, 'No se pudo cargar el informe'), 'Cerrar', { duration: 4000 }); },
    });
  }

  conclusionDe(c: { bimestres: Record<string, { conclusion: string | null }> }): string {
    const vals = Object.values(c.bimestres).map((b) => b?.conclusion).filter((x): x is string => !!x);
    return vals.length ? vals[vals.length - 1]! : '—';
  }

  descargarPdf(): void {
    this.svc.descargarPdf(this.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `informe-progreso-${this.id}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: (e) => this.snack.open(extractApiError(e, 'No se pudo descargar el PDF'), 'Cerrar', { duration: 4000 }),
    });
  }

  imprimir(): void {
    window.print();
  }
}
