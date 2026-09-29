import { Component, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ReporteService } from './services/reporte.service';
import { extractApiError } from '../../core/utils/api-error';
import { BackButtonComponent } from '../../shared/components/back-button.component';
import type { Reporte } from '../../core/models/reporte.model';

@Component({
  selector: 'app-reportes-show',
  standalone: true,
  imports: [BackButtonComponent, RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div class="page-header">
      <app-back-button />
      <h1>Detalle de reporte</h1>
      <a mat-button routerLink="/reportes"><mat-icon>arrow_back</mat-icon> Volver</a>
    </div>
    @if (loading()) {
      <div class="center"><mat-spinner diameter="40"></mat-spinner></div>
    } @else if (row()) {
      <mat-card>
        <mat-card-content class="grid">
          <div><strong>Tipo:</strong> {{ row()!.tipo }}</div>
          <div><strong>Periodo:</strong> {{ row()!.periodo?.nombre ?? '-' }}</div>
          <div><strong>Seccion:</strong> {{ seccionNombre() }}</div>
          <div><strong>Formato:</strong> {{ row()!.formato }}</div>
          <div><strong>Estado:</strong> <mat-chip>{{ row()!.estado }}</mat-chip></div>
          <div><strong>Generado por:</strong> {{ row()!.autor?.name ?? '-' }}</div>
          <div><strong>Fecha:</strong> {{ row()!.created_at }}</div>
          <div><strong>Expira:</strong> {{ row()!.expira_en ?? '-' }}</div>
        </mat-card-content>
        <mat-card-actions>
          <button mat-raised-button color="primary" (click)="onDownload()"><mat-icon>download</mat-icon> Descargar archivo</button>
        </mat-card-actions>
      </mat-card>
    } @else {
      <p class="hint">Reporte no encontrado.</p>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 0.75rem; }
    .center { display: flex; justify-content: center; padding: 2rem; }
    .hint { color: #64748b; text-align: center; }
  `],
})
export class ReportesShowComponent {
  row = signal<Reporte | null>(null);
  loading = signal(true);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: ReporteService,
    private snack: MatSnackBar
  ) {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.service.getById(id).subscribe({
      next: (r) => {
        this.row.set(r);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.snack.open(extractApiError(err, 'No se pudo cargar el reporte'), 'Cerrar', { duration: 4000 });
        this.router.navigate(['/reportes']);
      },
    });
  }

  seccionNombre(): string {
    const s = this.row()?.seccion;
    return s ? `${s.grado?.nombre ?? ''} ${s.nombre}`.trim() : '-';
  }

  onDownload(): void {
    const r = this.row();
    if (!r) return;
    this.service.descargar(r.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const ext = r.formato === 'pdf' ? 'pdf' : r.formato === 'excel' ? 'xlsx' : 'csv';
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-${r.tipo}-${r.id}.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.snack.open('No se pudo descargar el archivo', 'Cerrar', { duration: 4000 }),
    });
  }
}
