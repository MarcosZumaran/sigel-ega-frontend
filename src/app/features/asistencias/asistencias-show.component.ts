import { Component, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { AsistenciaService } from './services/asistencia.service';
import { extractApiError } from '../../core/utils/api-error';
import { BackButtonComponent } from '../../shared/components/back-button.component';
import type { Asistencia } from '../../core/models/asistencia.model';

@Component({
  selector: 'app-asistencias-show',
  standalone: true,
  imports: [BackButtonComponent, RouterLink, FormsModule, MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule, MatSnackBarModule, MatChipsModule],
  template: `
    <div class="page-header">
      <app-back-button />
      <h1>Detalle de asistencia</h1>
      <a mat-button routerLink="/asistencias"><mat-icon>arrow_back</mat-icon> Volver</a>
    </div>
    @if (loading()) {
      <div class="center"><mat-spinner diameter="40"></mat-spinner></div>
    } @else if (row()) {
      <mat-card>
        <mat-card-content class="grid">
          <div><strong>Fecha:</strong> {{ row()!.fecha }}</div>
          <div><strong>Estudiante:</strong> {{ row()!.matricula?.estudiante?.nombres }} {{ row()!.matricula?.estudiante?.apellidos }}</div>
          <div><strong>DNI:</strong> {{ row()!.matricula?.estudiante?.dni }}</div>
          <div><strong>Seccion:</strong> {{ row()!.matricula?.seccion?.grado?.nombre }} {{ row()!.matricula?.seccion?.nombre }}</div>
          <div><strong>Estado:</strong> <mat-chip [class]="'st-' + row()!.estado">{{ row()!.estado }}</mat-chip></div>
          <div><strong>Motivo:</strong> {{ row()!.motivo_justificacion ?? '-' }}</div>
        </mat-card-content>
      </mat-card>
      @if (row()!.estado !== 'justificado') {
        <mat-card class="justify">
          <mat-card-header><mat-card-title>Justificar inasistencia</mat-card-title></mat-card-header>
          <mat-card-content>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Motivo de justificacion</mat-label>
              <input matInput [(ngModel)]="motivo" maxlength="500" />
            </mat-form-field>
            <button mat-raised-button color="primary" (click)="onJustificar()" [disabled]="!motivo.trim() || saving()">
              @if (saving()) { <mat-spinner diameter="20"></mat-spinner> } @else { <span>Justificar</span> }
            </button>
          </mat-card-content>
        </mat-card>
      }
    } @else {
      <p class="hint">Registro no encontrado.</p>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 0.75rem; }
    .justify { margin-top: 1rem; }
    .full-width { width: 100%; }
    .center { display: flex; justify-content: center; padding: 2rem; }
    .hint { color: #64748b; text-align: center; }
    .st-presente { background: #dcfce7; color: #166534; }
    .st-ausente { background: #fee2e2; color: #991b1b; }
    .st-tardia { background: #fef3c7; color: #92400e; }
    .st-justificado { background: #dbeafe; color: #1e40af; }
  `],
})
export class AsistenciasShowComponent {
  row = signal<Asistencia | null>(null);
  loading = signal(true);
  saving = signal(false);
  motivo = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: AsistenciaService,
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
        this.snack.open(extractApiError(err, 'No se pudo cargar la asistencia'), 'Cerrar', { duration: 4000 });
        this.router.navigate(['/asistencias']);
      },
    });
  }

  onJustificar(): void {
    const r = this.row();
    if (!r || !this.motivo.trim()) return;
    this.saving.set(true);
    this.service.justificar(r.id, this.motivo.trim()).subscribe({
      next: (upd) => {
        this.row.set(upd);
        this.motivo = '';
        this.saving.set(false);
        this.snack.open('Inasistencia justificada', 'Cerrar', { duration: 3000 });
      },
      error: (err) => {
        this.saving.set(false);
        this.snack.open(extractApiError(err, 'No se pudo cargar la asistencia'), 'Cerrar', { duration: 4000 });
      },
    });
  }
}
