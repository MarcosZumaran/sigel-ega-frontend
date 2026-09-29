import { Component, OnInit, signal, inject} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PeriodoService } from './services/periodo.service';
import { Periodo } from '../../core/models/periodo.model';
import { extractApiError } from '../../core/utils/api-error';
import { BackButtonComponent } from '../../shared/components/back-button.component';
import { DialogService } from '../../core/services/dialog.service';

@Component({
  selector: 'app-periodos-show',
  standalone: true,
  imports: [BackButtonComponent, RouterLink, MatCardModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <app-back-button />
    <h1>Detalle del periodo</h1>
    @if (loading()) {
      <div class="loading"><mat-spinner diameter="40"></mat-spinner></div>
    } @else if (periodo()) {
      <mat-card>
        <mat-card-header>
          <mat-card-title>{{ periodo()?.nombre }} ({{ periodo()?.anio }})</mat-card-title>
          <mat-card-subtitle>{{ periodo()?.activo ? 'Activo' : 'Inactivo' }}</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <dl>
            <dt>Fecha inicio</dt><dd>{{ periodo()?.fecha_inicio ?? '—' }}</dd>
            <dt>Fecha fin</dt><dd>{{ periodo()?.fecha_fin ?? '—' }}</dd>
          </dl>
        </mat-card-content>
        <mat-card-actions>
          <a mat-button routerLink="/periodos">Volver</a>
          <a mat-button color="primary" [routerLink]="['/periodos', periodo()?.id, 'bimestres']">Bimestres</a>
          <a mat-button color="accent" [routerLink]="['/periodos', periodo()?.id, 'edit']">Editar</a>
          <button mat-button color="warn" (click)="onDelete()">Eliminar</button>
        </mat-card-actions>
      </mat-card>
    } @else {
      <p>No se encontro el periodo.</p>
      <a mat-button routerLink="/periodos">Volver</a>
    }
  `,
  styles: [`
    h1 { color: #1E3A8A; }
    .loading { display: flex; justify-content: center; padding: 2rem; }
    dl { display: grid; grid-template-columns: 140px 1fr; gap: 0.5rem; }
    dt { font-weight: 500; color: #475569; }
    dd { margin: 0; }
  `],
})
export class PeriodosShowComponent implements OnInit {
  private dialogs = inject(DialogService);

  loading = signal(true);
  periodo = signal<Periodo | null>(null);

  constructor(private service: PeriodoService, private route: ActivatedRoute, private router: Router, private snack: MatSnackBar) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.service.getById(id).subscribe({
      next: (p) => {
        this.periodo.set(p);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.snack.open(extractApiError(err, 'No se pudo cargar el periodo'), 'Cerrar', { duration: 4000 });
      },
    });
  }

  async onDelete(): Promise<void> {
    const p = this.periodo();
    if (!p) return;
    const confirmed = await this.dialogs.confirm({
      title: 'Confirmar eliminacion',
      message: `Eliminar el periodo "${p.nombre}"?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
      icon: 'delete',
    });
    if (!confirmed) return;
    this.service.delete(p.id).subscribe({
      next: () => {
        this.snack.open('Periodo eliminado', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/periodos']);
      },
      error: (err) => {
        this.snack.open(extractApiError(err, 'No se pudo eliminar el periodo'), 'Cerrar', { duration: 4000 });
      },
    });
  }
}
