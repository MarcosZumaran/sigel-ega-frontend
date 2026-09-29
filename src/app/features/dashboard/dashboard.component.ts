import { Component, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { MatriculaService } from '../matriculas/services/matricula.service';
import { AsistenciaService } from '../asistencias/services/asistencia.service';
import { Matricula } from '../../core/models/matricula.model';
import { Asistencia } from '../../core/models/asistencia.model';
import { extractApiError } from '../../core/utils/api-error';

interface Acceso {
  titulo: string;
  descripcion: string;
  icono: string;
  ruta: string;
  color: string;
}

const ACCESOS: Acceso[] = [
  { titulo: 'Matricular', descripcion: 'Registrar nueva matricula', icono: 'assignment', ruta: '/matriculas/create', color: 'bg-[#1E3A8A]/10 text-[#1E3A8A]' },
  { titulo: 'Alumnos', descripcion: 'Ver estudiantes', icono: 'school', ruta: '/estudiantes', color: 'bg-emerald-100 text-emerald-700' },
  { titulo: 'Notas', descripcion: 'Calificaciones y evaluacion', icono: 'grade', ruta: '/notas', color: 'bg-amber-100 text-amber-700' },
  { titulo: 'Asistencias', descripcion: 'Registro diario', icono: 'check_circle', ruta: '/asistencias', color: 'bg-red-100 text-[#C8102E]' },
  { titulo: 'Reportes', descripcion: 'Generar y descargar', icono: 'description', ruta: '/reportes', color: 'bg-slate-200 text-slate-700' },
  { titulo: 'Apoderados', descripcion: 'Hub padres-estudiantes', icono: 'link', ruta: '/apoderados', color: 'bg-sky-100 text-sky-700' },
];

function hoyLocal(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe, MatCardModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule, MatListModule, MatDividerModule],
  template: `
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-slate-900">Bienvenido, {{ auth.user()?.name ?? 'usuario' }}</h1>
      <p class="text-sm text-slate-500 mt-1 capitalize">{{ hoy | date:"EEEE, d 'de' MMMM 'de' y" }}</p>
    </div>

    <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">Accesos directos</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
      @for (a of accesos; track a.ruta) {
        <a [routerLink]="a.ruta" class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 {{ a.color }}">
            <mat-icon>{{ a.icono }}</mat-icon>
          </div>
          <div>
            <p class="font-semibold text-slate-900">{{ a.titulo }}</p>
            <p class="text-sm text-slate-500">{{ a.descripcion }}</p>
          </div>
        </a>
      }
    </div>

    <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">Tareas pendientes</h2>
    @if (loading()) {
      <div class="flex justify-center py-12"><mat-spinner diameter="40"></mat-spinner></div>
    } @else {
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Ultimas matriculas</mat-card-title>
            <mat-card-subtitle>Las 5 mas recientes</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            @if (ultimasMatriculas().length) {
              <mat-list>
                @for (m of ultimasMatriculas(); track m.id) {
                  <mat-list-item>
                    <mat-icon matListItemIcon>assignment</mat-icon>
                    <span matListItemTitle>{{ nombreEstudiante(m) }}</span>
                    <span matListItemLine>{{ m.seccion?.nombre ?? ('Seccion ' + m.seccion_id) }} · {{ m.fecha }}</span>
                  </mat-list-item>
                  <mat-divider></mat-divider>
                }
              </mat-list>
            } @else {
              <p class="text-sm text-slate-500">No hay matriculas registradas.</p>
            }
          </mat-card-content>
          <mat-card-actions>
            <a mat-button class="!text-[#1E3A8A]" routerLink="/matriculas">Ver todas</a>
          </mat-card-actions>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-card-title>Asistencia de hoy</mat-card-title>
            <mat-card-subtitle>{{ hoy | date:"d 'de' MMMM 'de' y, HH:mm" }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            @if (asistenciaHoy().length) {
              <div class="flex gap-6 py-2">
                <div class="text-center">
                  <p class="text-3xl font-bold text-emerald-600">{{ contar('presente') }}</p>
                  <p class="text-xs text-slate-500">Presentes</p>
                </div>
                <div class="text-center">
                  <p class="text-3xl font-bold text-red-600">{{ contar('ausente') }}</p>
                  <p class="text-xs text-slate-500">Ausentes</p>
                </div>
                <div class="text-center">
                  <p class="text-3xl font-bold text-amber-600">{{ contar('tardia') }}</p>
                  <p class="text-xs text-slate-500">Tardias</p>
                </div>
                <div class="text-center">
                  <p class="text-3xl font-bold text-sky-600">{{ contar('justificado') }}</p>
                  <p class="text-xs text-slate-500">Justificados</p>
                </div>
              </div>
            } @else {
              <p class="text-sm text-slate-500">Aún no se registra la asistencia de hoy.</p>
            }
          </mat-card-content>
          <mat-card-actions>
            <a mat-button class="!text-[#1E3A8A]" routerLink="/asistencias/create">Registrar asistencia</a>
          </mat-card-actions>
        </mat-card>
      </div>
    }
  `,
  styles: [``],
})
export class DashboardComponent implements OnInit {
  hoy = new Date();
  accesos = ACCESOS;
  loading = signal(true);
  ultimasMatriculas = signal<Matricula[]>([]);
  asistenciaHoy = signal<Asistencia[]>([]);

  constructor(
    public auth: AuthService,
    private matriculas: MatriculaService,
    private asistencias: AsistenciaService,
    private snack: MatSnackBar,
  ) {}

  ngOnInit(): void {
    forkJoin({
      matriculas: this.matriculas.getAll().pipe(catchError(() => of([] as Matricula[]))),
      asistencias: this.asistencias.getAll().pipe(catchError(() => of([] as Asistencia[]))),
    }).subscribe({
      next: ({ matriculas, asistencias }) => {
        this.ultimasMatriculas.set([...matriculas].sort((a, b) => b.id - a.id).slice(0, 5));
        this.asistenciaHoy.set(asistencias.filter((a) => (a.fecha ?? '').slice(0, 10) === hoyLocal()));
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.snack.open(extractApiError(err, 'No se pudo cargar el panel'), 'Cerrar', { duration: 4000 });
      },
    });
  }

  nombreEstudiante(m: Matricula): string {
    const e = m.estudiante;
    return e ? `${e.nombres} ${e.apellidos}` : `Matricula #${m.id}`;
  }

  contar(estado: string): number {
    return this.asistenciaHoy().filter((a) => a.estado === estado).length;
  }
}
