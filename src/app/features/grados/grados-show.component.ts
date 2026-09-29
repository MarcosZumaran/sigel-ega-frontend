import { Component, OnInit, signal, inject} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { GradoService } from './services/grado.service';
import { Grado } from '../../core/models/grado.model';
import { extractApiError } from '../../core/utils/api-error';
import { BackButtonComponent } from '../../shared/components/back-button.component';
import { DialogService } from '../../core/services/dialog.service';

@Component({
  selector: 'app-grados-show',
  standalone: true,
  imports: [BackButtonComponent, RouterLink, MatCardModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <app-back-button />
    <h1>Detalle del grado</h1>
    @if (loading()) {
      <div class="loading"><mat-spinner diameter="40"></mat-spinner></div>
    } @else if (grado()) {
      <mat-card>
        <mat-card-header>
          <mat-card-title>{{ grado()?.nombre }}</mat-card-title>
          <mat-card-subtitle>{{ grado()?.nivel?.nombre ?? '—' }}</mat-card-subtitle>
        </mat-card-header>
        <mat-card-actions>
          <a mat-button routerLink="/grados">Volver</a>
          <a mat-button color="accent" [routerLink]="['/grados', grado()?.id, 'edit']">Editar</a>
          <button mat-button color="warn" (click)="onDelete()">Eliminar</button>
        </mat-card-actions>
      </mat-card>
    } @else {
      <p>No se encontro el grado.</p>
      <a mat-button routerLink="/grados">Volver</a>
    }
  `,
  styles: [`
    h1 { color: #1E3A8A; }
    .loading { display: flex; justify-content: center; padding: 2rem; }
  `],
})
export class GradosShowComponent implements OnInit {
  private dialogs = inject(DialogService);

  loading = signal(true);
  grado = signal<Grado | null>(null);

  constructor(private service: GradoService, private route: ActivatedRoute, private router: Router, private snack: MatSnackBar) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.service.getById(id).subscribe({
      next: (g) => {
        this.grado.set(g);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.snack.open(extractApiError(err, 'No se pudo cargar el grado'), 'Cerrar', { duration: 4000 });
      },
    });
  }

  async onDelete(): Promise<void> {
    const g = this.grado();
    if (!g) return;
    const confirmed = await this.dialogs.confirm({
      title: 'Confirmar eliminacion',
      message: `Eliminar el grado "${g.nombre}"?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
      icon: 'delete',
    });
    if (!confirmed) return;
    this.service.delete(g.id).subscribe({
      next: () => {
        this.snack.open('Grado eliminado', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/grados']);
      },
      error: (err) => {
        this.snack.open(extractApiError(err, 'No se pudo eliminar el grado'), 'Cerrar', { duration: 4000 });
      },
    });
  }
}
