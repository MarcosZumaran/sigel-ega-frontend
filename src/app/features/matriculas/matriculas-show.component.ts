import { Component, OnInit, signal, inject} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatriculaService } from './services/matricula.service';
import { Matricula } from '../../core/models/matricula.model';
import { extractApiError } from '../../core/utils/api-error';
import { BackButtonComponent } from '../../shared/components/back-button.component';
import { DialogService } from '../../core/services/dialog.service';

@Component({
  selector: 'app-matriculas-show',
  standalone: true,
  imports: [BackButtonComponent, RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    @if (loading()) {
      <div class="loading"><mat-spinner diameter="40"></mat-spinner></div>
    } @else if (matricula()) {
      <app-back-button />
      <h1>Matricula #{{ matricula()?.id }}</h1>
      <mat-card>
        <mat-card-content>
          <dl>
            <dt>Estudiante</dt>
            <dd><a [routerLink]="['/estudiantes', matricula()?.estudiante_id]">{{ matricula()?.estudiante?.nombres }} {{ matricula()?.estudiante?.apellidos }}</a></dd>
            <dt>Seccion</dt>
            <dd><a [routerLink]="['/secciones', matricula()?.seccion_id]">{{ matricula()?.seccion?.grado?.nombre }} {{ matricula()?.seccion?.nombre }}</a></dd>
            <dt>Periodo</dt>
            <dd><a [routerLink]="['/periodos', matricula()?.periodo_id]">{{ matricula()?.periodo?.nombre }}</a></dd>
            <dt>Tipo</dt><dd>{{ matricula()?.tipo_matricula?.nombre }}</dd>
            <dt>Fecha</dt><dd>{{ matricula()?.fecha }}</dd>
            <dt>Estado</dt><dd>{{ matricula()?.estado?.nombre ?? '—' }}</dd>
            <dt>Observaciones</dt><dd>{{ matricula()?.observaciones ?? '—' }}</dd>
          </dl>
        </mat-card-content>
      </mat-card>
      <div class="actions">
        <a mat-button routerLink="/matriculas">Volver</a>
        <a mat-raised-button color="accent" [routerLink]="['/matriculas', id, 'edit']"><mat-icon>edit</mat-icon>Editar</a>
        <button mat-raised-button color="warn" (click)="onDelete()"><mat-icon>delete</mat-icon>Eliminar</button>
      </div>
    } @else {
      <p>No se encontro la matricula.</p>
      <a mat-button routerLink="/matriculas">Volver</a>
    }
  `,
  styles: [`
    h1 { color: #1E3A8A; }
    .loading { display: flex; justify-content: center; padding: 2rem; }
    dl { display: grid; grid-template-columns: 130px 1fr; gap: 0.25rem 1rem; margin: 0; }
    dt { color: #64748b; }
    dd { margin: 0; }
    .actions { display: flex; gap: 0.5rem; margin: 1rem 0 2rem; }
  `],
})
export class MatriculasShowComponent implements OnInit {
  private dialogs = inject(DialogService);

  loading = signal(true);
  id = 0;
  matricula = signal<Matricula | null>(null);

  constructor(
    private service: MatriculaService,
    private route: ActivatedRoute,
    private router: Router,
    private snack: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.service.getById(this.id).subscribe({
      next: (m) => {
        this.matricula.set(m);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.snack.open(extractApiError(err, 'No se pudo cargar la matricula'), 'Cerrar', { duration: 4000 });
      },
    });
  }

  async onDelete(): Promise<void> {
    const confirmed = await this.dialogs.confirm({
      title: 'Confirmar eliminacion',
      message: 'Eliminar esta matricula?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
      icon: 'delete',
    });
    if (!confirmed) return;
    this.service.delete(this.id).subscribe({
      next: (res) => {
        this.snack.open(res.message ?? 'Matricula eliminada', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/matriculas']);
      },
      error: (err) => this.snack.open(extractApiError(err, 'No se pudo eliminar'), 'Cerrar', { duration: 4000 }),
    });
  }
}
