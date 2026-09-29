import { Component, OnInit, signal, inject} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { EstudianteService } from './services/estudiante.service';
import { Estudiante } from '../../core/models/estudiante.model';
import { extractApiError } from '../../core/utils/api-error';
import { BackButtonComponent } from '../../shared/components/back-button.component';
import { DialogService } from '../../core/services/dialog.service';

@Component({
  selector: 'app-estudiantes-show',
  standalone: true,
  imports: [BackButtonComponent, RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule, MatTableModule],
  template: `
    @if (loading()) {
      <div class="loading"><mat-spinner diameter="40"></mat-spinner></div>
    } @else if (estudiante()) {
      <app-back-button />
      <h1>{{ estudiante()?.nombres }} {{ estudiante()?.apellidos }}</h1>
      <div class="panels">
        <mat-card>
          <mat-card-header><mat-card-title>Datos personales</mat-card-title></mat-card-header>
          <mat-card-content>
            <dl>
              <dt>DNI</dt><dd>{{ estudiante()?.dni }}</dd>
              <dt>Codigo</dt><dd>{{ estudiante()?.codigo_estudiante ?? '—' }}</dd>
              <dt>Nacimiento</dt><dd>{{ estudiante()?.fecha_nacimiento ?? '—' }}</dd>
              <dt>Sexo</dt><dd>{{ estudiante()?.sexo === 'M' ? 'Masculino' : estudiante()?.sexo === 'F' ? 'Femenino' : '—' }}</dd>
              <dt>Direccion</dt><dd>{{ estudiante()?.direccion ?? '—' }}</dd>
              <dt>Telefono</dt><dd>{{ estudiante()?.telefono ?? '—' }}</dd>
              <dt>Email</dt><dd>{{ estudiante()?.email ?? '—' }}</dd>
              <dt>Nivel</dt><dd>{{ estudiante()?.nivel?.nombre ?? '—' }}</dd>
              <dt>Grado</dt><dd>{{ estudiante()?.grado?.nombre ?? estudiante()?.matricula_activa?.seccion?.grado?.nombre ?? '—' }}</dd>
            </dl>
          </mat-card-content>
        </mat-card>
        <mat-card>
          <mat-card-header><mat-card-title>Apoderado</mat-card-title></mat-card-header>
          <mat-card-content>
            @if (estudiante()?.apoderado_id) {
              <a mat-stroked-button [routerLink]="['/apoderados', estudiante()?.apoderado_id]">Ver apoderado</a>
            } @else {
              <p class="muted">Sin apoderado</p>
            }
          </mat-card-content>
        </mat-card>
      </div>
      <mat-card class="mt">
        <mat-card-header><mat-card-title>Matrículas históricas ({{ estudiante()?.matriculas?.length ?? 0 }})</mat-card-title></mat-card-header>
        <mat-card-content>
          @if (estudiante()?.matriculas?.length) {
            <table mat-table [dataSource]="estudiante()?.matriculas ?? []" class="full-width">
              <ng-container matColumnDef="periodo">
                <th mat-header-cell *matHeaderCellDef>Periodo</th>
                <td mat-cell *matCellDef="let m">{{ m.periodo?.nombre ?? m.periodo_id }}</td>
              </ng-container>
              <ng-container matColumnDef="seccion">
                <th mat-header-cell *matHeaderCellDef>Seccion</th>
                <td mat-cell *matCellDef="let m">{{ m.seccion?.nombre ?? m.seccion_id }}</td>
              </ng-container>
              <ng-container matColumnDef="fecha">
                <th mat-header-cell *matHeaderCellDef>Fecha</th>
                <td mat-cell *matCellDef="let m">{{ m.fecha }}</td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="['periodo', 'seccion', 'fecha']"></tr>
              <tr mat-row *matRowDef="let row; columns: ['periodo', 'seccion', 'fecha'];"></tr>
            </table>
          } @else {
            <p class="muted">Sin matriculas registradas. Las matriculas cargaran aqui cuando el backend las incluya en el detalle.</p>
          }
        </mat-card-content>
      </mat-card>
      <div class="actions">
        <a mat-button routerLink="/estudiantes">Volver</a>
        <a mat-raised-button color="accent" [routerLink]="['/estudiantes', id, 'edit']"><mat-icon>edit</mat-icon>Editar</a>
        <button mat-raised-button color="warn" (click)="onDelete()"><mat-icon>delete</mat-icon>Eliminar</button>
      </div>
    } @else {
      <p>No se encontro el estudiante.</p>
      <a mat-button routerLink="/estudiantes">Volver</a>
    }
  `,
  styles: [`
    h1 { color: #1E3A8A; }
    .muted { color: #64748b; }
    .loading { display: flex; justify-content: center; padding: 2rem; }
    .panels { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; }
    .mt { margin-top: 1rem; }
    dl { display: grid; grid-template-columns: 130px 1fr; gap: 0.25rem 1rem; margin: 0; }
    dt { color: #64748b; }
    dd { margin: 0; }
    .full-width { width: 100%; }
    .actions { display: flex; gap: 0.5rem; margin: 1rem 0 2rem; }
  `],
})
export class EstudiantesShowComponent implements OnInit {
  private dialogs = inject(DialogService);

  loading = signal(true);
  id = 0;
  estudiante = signal<Estudiante | null>(null);

  constructor(
    private service: EstudianteService,
    private route: ActivatedRoute,
    private router: Router,
    private snack: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.service.getById(this.id).subscribe({
      next: (e) => {
        this.estudiante.set(e);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.snack.open(extractApiError(err, 'No se pudo cargar el estudiante'), 'Cerrar', { duration: 4000 });
      },
    });
  }

  async onDelete(): Promise<void> {
    const confirmed = await this.dialogs.confirm({
      title: 'Confirmar eliminacion',
      message: 'Eliminar este estudiante?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
      icon: 'delete',
    });
    if (!confirmed) return;
    this.service.delete(this.id).subscribe({
      next: (res) => {
        this.snack.open(res.message ?? 'Estudiante eliminado', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/estudiantes']);
      },
      error: (err) => this.snack.open(extractApiError(err, 'No se pudo eliminar'), 'Cerrar', { duration: 4000 }),
    });
  }
}
