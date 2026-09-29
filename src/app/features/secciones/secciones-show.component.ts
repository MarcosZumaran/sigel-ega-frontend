import { Component, OnInit, signal, inject} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SeccionService } from './services/seccion.service';
import { Seccion } from '../../core/models/seccion.model';
import { extractApiError } from '../../core/utils/api-error';
import { BackButtonComponent } from '../../shared/components/back-button.component';
import { DialogService } from '../../core/services/dialog.service';

@Component({
  selector: 'app-secciones-show',
  standalone: true,
  imports: [BackButtonComponent, RouterLink, MatCardModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <app-back-button />
    <h1>Detalle de la seccion</h1>
    @if (loading()) {
      <div class="loading"><mat-spinner diameter="40"></mat-spinner></div>
    } @else if (seccion()) {
      <mat-card>
        <mat-card-header>
          <mat-card-title>{{ seccion()?.grado?.nombre ?? '—' }} "{{ seccion()?.nombre }}"</mat-card-title>
          <mat-card-subtitle>{{ seccion()?.turno === 'manana' ? 'Turno manana' : 'Turno tarde' }} - {{ seccion()?.vacantes }} vacantes</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <dl>
            <dt>Grado</dt><dd>{{ seccion()?.grado?.nombre ?? '—' }} ({{ seccion()?.grado?.nivel?.nombre ?? '—' }})</dd>
            <dt>Docente</dt><dd>{{ seccion()?.docente ? (seccion()?.docente?.nombres + ' ' + seccion()?.docente?.apellidos) : 'Sin asignar' }}</dd>
          </dl>
        </mat-card-content>
        <mat-card-actions>
          <a mat-button routerLink="/secciones">Volver</a>
          <a mat-button color="accent" [routerLink]="['/secciones', seccion()?.id, 'edit']">Editar</a>
          <button mat-button color="warn" (click)="onDelete()">Eliminar</button>
        </mat-card-actions>
      </mat-card>
    } @else {
      <p>No se encontro la seccion.</p>
      <a mat-button routerLink="/secciones">Volver</a>
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
export class SeccionesShowComponent implements OnInit {
  private dialogs = inject(DialogService);

  loading = signal(true);
  seccion = signal<Seccion | null>(null);

  constructor(private service: SeccionService, private route: ActivatedRoute, private router: Router, private snack: MatSnackBar) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.service.getById(id).subscribe({
      next: (s) => {
        this.seccion.set(s);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.snack.open(extractApiError(err, 'No se pudo cargar la seccion'), 'Cerrar', { duration: 4000 });
      },
    });
  }

  async onDelete(): Promise<void> {
    const s = this.seccion();
    if (!s) return;
    const confirmed = await this.dialogs.confirm({
      title: 'Confirmar eliminacion',
      message: `Eliminar la seccion "${s.nombre}"?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
      icon: 'delete',
    });
    if (!confirmed) return;
    this.service.delete(s.id).subscribe({
      next: () => {
        this.snack.open('Seccion eliminada', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/secciones']);
      },
      error: (err) => {
        this.snack.open(extractApiError(err, 'No se pudo eliminar la seccion'), 'Cerrar', { duration: 4000 });
      },
    });
  }
}
