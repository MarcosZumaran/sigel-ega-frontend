import { Component, OnInit, signal, inject} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatListModule } from '@angular/material/list';
import { PadreService } from './services/padre.service';
import { ApoderadoService } from '../apoderados/services/apoderado.service';
import { Padre } from '../../core/models/padre.model';
import { ApoderadoVinculado } from '../../core/models/catalogos.model';
import { extractApiError } from '../../core/utils/api-error';
import { BackButtonComponent } from '../../shared/components/back-button.component';
import { DialogService } from '../../core/services/dialog.service';

@Component({
  selector: 'app-padres-show',
  standalone: true,
  imports: [BackButtonComponent, RouterLink, MatCardModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule, MatListModule],
  template: `
    <app-back-button />
    <h1>Detalle del padre</h1>
    @if (loading()) {
      <div class="loading"><mat-spinner diameter="40"></mat-spinner></div>
    } @else if (padre()) {
      <mat-card>
        <mat-card-header>
          <mat-card-title>{{ padre()?.nombres }} {{ padre()?.apellidos }}</mat-card-title>
          <mat-card-subtitle>DNI {{ padre()?.dni }}</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <dl>
            <dt>Telefono</dt><dd>{{ padre()?.telefono ?? '—' }}</dd>
            <dt>Email</dt><dd>{{ padre()?.email ?? '—' }}</dd>
            <dt>Direccion</dt><dd>{{ padre()?.direccion ?? '—' }}</dd>
            <dt>Ocupacion</dt><dd>{{ padre()?.ocupacion ?? '—' }}</dd>
            <dt>Apoderado</dt>
            <dd>
              @if (padre()?.apoderado_id) {
                <a mat-stroked-button [routerLink]="['/apoderados', padre()?.apoderado_id]">Ver apoderado</a>
              } @else {
                <span>Sin apoderado</span>
              }
            </dd>
          </dl>
          <h3>Estudiantes vinculados (apoderado #{{ padre()?.apoderado_id }})</h3>
          @if (loadingApoderado()) {
            <mat-spinner diameter="24"></mat-spinner>
          } @else if (apoderado()?.estudiantes?.length) {
            <mat-list>
              @for (e of apoderado()?.estudiantes; track e?.id) {
                <mat-list-item>{{ e?.nombres }} {{ e?.apellidos }} (DNI {{ e?.dni }})</mat-list-item>
              }
            </mat-list>
          } @else {
            <p class="muted">Sin estudiantes vinculados.</p>
          }
        </mat-card-content>
        <mat-card-actions>
          <a mat-button routerLink="/padres">Volver</a>
          <a mat-button color="accent" [routerLink]="['/padres', padre()?.id, 'edit']">Editar</a>
          <button mat-button color="warn" (click)="onDelete()">Eliminar</button>
        </mat-card-actions>
      </mat-card>
    } @else {
      <p>No se encontro el padre.</p>
      <a mat-button routerLink="/padres">Volver</a>
    }
  `,
  styles: [`
    h1 { color: #1E3A8A; }
    .loading { display: flex; justify-content: center; padding: 2rem; }
    dl { display: grid; grid-template-columns: 140px 1fr; gap: 0.5rem; }
    dt { font-weight: 500; color: #475569; }
    dd { margin: 0; }
    h3 { margin-top: 1.5rem; color: #1E3A8A; }
    .muted { color: #64748b; }
  `],
})
export class PadresShowComponent implements OnInit {
  private dialogs = inject(DialogService);

  loading = signal(true);
  loadingApoderado = signal(false);
  padre = signal<Padre | null>(null);
  apoderado = signal<ApoderadoVinculado | null>(null);

  constructor(private service: PadreService, private apoderados: ApoderadoService, private route: ActivatedRoute, private router: Router, private snack: MatSnackBar) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.service.getById(id).subscribe({
      next: (p) => {
        this.padre.set(p);
        this.loading.set(false);
        if (p.apoderado_id) this.loadApoderado(p.apoderado_id);
      },
      error: (err) => {
        this.loading.set(false);
        this.snack.open(extractApiError(err, 'No se pudo cargar el padre'), 'Cerrar', { duration: 4000 });
      },
    });
  }

  private loadApoderado(id: number): void {
    this.loadingApoderado.set(true);
    this.apoderados.getById(id).subscribe({
      next: (a) => {
        this.apoderado.set(a);
        this.loadingApoderado.set(false);
      },
      error: (err) => {
        this.loadingApoderado.set(false);
        this.snack.open(extractApiError(err, 'No se pudo cargar el apoderado'), 'Cerrar', { duration: 4000 });
      },
    });
  }

  async onDelete(): Promise<void> {
    const p = this.padre();
    if (!p) return;
    const confirmed = await this.dialogs.confirm({
      title: 'Confirmar eliminacion',
      message: `Eliminar al padre "${p.nombres} ${p.apellidos}"?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
      icon: 'delete',
    });
    if (!confirmed) return;
    this.service.delete(p.id).subscribe({
      next: () => {
        this.snack.open('Padre eliminado', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/padres']);
      },
      error: (err) => {
        this.snack.open(extractApiError(err, 'No se pudo eliminar el padre'), 'Cerrar', { duration: 4000 });
      },
    });
  }
}
