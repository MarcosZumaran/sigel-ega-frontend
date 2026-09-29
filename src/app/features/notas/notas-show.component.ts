import { Component, OnInit, signal, inject} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CalificacionService } from './services/calificacion.service';
import type { Calificacion } from '../../core/models/calificacion.model';
import { extractApiError } from '../../core/utils/api-error';
import { nivelDescripcion } from '../../core/utils/ministerio-equivalencia';
import { DialogService } from '../../core/services/dialog.service';

@Component({
  selector: 'app-notas-show',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <a mat-button routerLink="/notas"><mat-icon>arrow_back</mat-icon> Volver</a>
    @if (loading()) {
      <div class="loading"><mat-spinner diameter="40"></mat-spinner></div>
    } @else if (row()) {
      <mat-card>
        <mat-card-header>
          <mat-card-title>Calificacion #{{ row()!.id }}</mat-card-title>
          <mat-card-subtitle>{{ row()!.matricula?.estudiante?.nombres }} {{ row()!.matricula?.estudiante?.apellidos }}</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <dl>
            <dt>Area</dt><dd>{{ row()!.area?.nombre ?? row()!.area_id }}</dd>
            <dt>Tipo de evaluacion</dt><dd>{{ row()!.tipoEvaluacion?.nombre ?? row()!.tipo_evaluacion_id }}</dd>
            <dt>Nota</dt><dd>{{ row()!.nota ?? '—' }}</dd>
            <dt>Nivel de logro</dt><dd><span class="nivel-{{ row()!.nivel_logro }}">{{ row()!.nivel_logro ?? '—' }}</span> {{ nivelDesc(row()!.nivel_logro) }}</dd>
            <dt>Escala</dt><dd>{{ row()!.escala ?? '—' }}</dd>
            <dt>Motivo de nota C</dt><dd>{{ row()!.motivo_nota_c ?? '—' }}</dd>
          </dl>
        </mat-card-content>
        <mat-card-actions>
          <button mat-button color="warn" (click)="remove()"><mat-icon>delete</mat-icon> Eliminar</button>
        </mat-card-actions>
      </mat-card>
    }
  `,
  styles: [`
    .loading { display: flex; justify-content: center; padding: 2rem; }
    dl { display: grid; grid-template-columns: 180px 1fr; gap: 0.5rem; }
    dt { font-weight: 500; color: #64748b; } dd { margin: 0; }
    .nivel-AD { background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 6px; font-weight: bold; }
    .nivel-A { background: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 6px; font-weight: bold; }
    .nivel-B { background: #fef9c3; color: #854d0e; padding: 2px 8px; border-radius: 6px; font-weight: bold; }
    .nivel-C { background: #fecaca; color: #991b1b; padding: 2px 8px; border-radius: 6px; font-weight: bold; }
  `],
})
export class NotasShowComponent implements OnInit {
  private dialogs = inject(DialogService);

  loading = signal(true);
  row = signal<Calificacion | null>(null);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: CalificacionService,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.service.getById(id).subscribe({
      next: (v) => { this.row.set(v); this.loading.set(false); },
      error: (err) => { this.loading.set(false); this.snack.open(extractApiError(err, 'No se pudo cargar.'), 'Cerrar', { duration: 4000 }); },
    });
  }

  nivelDesc(nivel: unknown): string {
    return nivelDescripcion(String(nivel ?? ''));
  }

  async remove(): Promise<void> {
    const r = this.row();
    if (!r) return;
    const confirmed = await this.dialogs.confirm({
      title: 'Confirmar eliminacion',
      message: `Eliminar calificacion #${r.id}?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
      icon: 'delete',
    });
    if (!confirmed) return;
    this.service.delete(r.id).subscribe({
      next: () => { this.snack.open('Calificacion eliminada.', 'Cerrar', { duration: 3000 }); this.router.navigate(['/notas']); },
      error: (err) => this.snack.open(extractApiError(err, 'No se pudo eliminar.'), 'Cerrar', { duration: 4000 }),
    });
  }
}
