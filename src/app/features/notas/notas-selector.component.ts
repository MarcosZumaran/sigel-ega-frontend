import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { catchError, forkJoin, of } from 'rxjs';
import { CalificacionService } from './services/calificacion.service';
import { CatalogosService } from '../../core/services/catalogos.service';
import { extractApiError } from '../../core/utils/api-error';

interface Contexto {
  periodo: string;
  total: number;
  ultima: string;
}

@Component({
  selector: 'app-notas-selector',
  standalone: true,
  imports: [RouterLink, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="page-header">
      <div class="page-header-icon"><mat-icon>grade</mat-icon></div>
      <div class="page-header-text">
        <h1>Notas y evaluación</h1>
        <p>Selecciona el nivel para ver y registrar calificaciones. Equivalencia MINEDU automática: 18-20 AD, 14-17 A, 11-13 B, 0-10 C.</p>
      </div>
    </div>
    @if (contexto()) {
      <div class="flat-card context-card">
        <div class="context-item"><mat-icon>calendar_month</mat-icon><span>Periodo activo: <strong>{{ contexto()!.periodo }}</strong></span></div>
        <div class="context-item"><mat-icon>assignment</mat-icon><span><strong>{{ contexto()!.total }}</strong> calificaciones registradas</span></div>
        <div class="context-item"><mat-icon>schedule</mat-icon><span>Última evaluación: <strong>{{ contexto()!.ultima }}</strong></span></div>
      </div>
    }
    <div class="cards">
      <div class="flat-card nivel-card card-todas">
        <div class="card-header">
          <mat-icon>list</mat-icon>
          <h2>Todas</h2>
        </div>
        <div class="card-body">
          <p>Todos los niveles: consulta y registra calificaciones de primaria y secundaria en una sola vista.</p>
          <a mat-flat-button color="primary" [routerLink]="['/notas/listado']" [queryParams]="{ nivel: 'todas' }">Ver notas</a>
        </div>
      </div>
      <div class="flat-card nivel-card card-primaria">
        <div class="card-header">
          <mat-icon>school</mat-icon>
          <h2>Primaria</h2>
        </div>
        <div class="card-body">
          <p>Calificaciones del nivel primaria con equivalencia literal AD, A, B y C según norma MINEDU.</p>
          <a mat-flat-button color="primary" [routerLink]="['/notas/listado']" [queryParams]="{ nivel: 'primaria' }">Ver notas</a>
        </div>
      </div>
      <div class="flat-card nivel-card card-secundaria">
        <div class="card-header">
          <mat-icon>science</mat-icon>
          <h2>Secundaria</h2>
        </div>
        <div class="card-body">
          <p>Calificaciones del nivel secundaria con equivalencia vigesimal y literal según norma MINEDU.</p>
          <a mat-flat-button color="primary" [routerLink]="['/notas/listado']" [queryParams]="{ nivel: 'secundaria' }">Ver notas</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .context-card { display: flex; gap: 2rem; flex-wrap: wrap; border-left: 4px solid #1E3A8A; padding: 0.75rem 1rem; }
    .context-item { display: flex; align-items: center; gap: 0.5rem; color: #334155; }
    .context-item mat-icon { color: #1E3A8A; }
    .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
    @media (max-width: 900px) { .cards { grid-template-columns: 1fr; } }
    .nivel-card {
      background: #FFFFFF;
      border-radius: 12px;
      overflow: hidden;
      border: 2px solid #E2E8F0;
      transition: all 0.2s ease;
      padding: 0;
    }
    .card-todas {
      box-shadow: 0 8px 24px -8px rgba(30, 58, 138, 0.25);
    }
    .card-todas .card-header {
      background: linear-gradient(135deg, #1E3A8A 0%, #1E40AF 100%);
    }
    .card-todas:hover {
      box-shadow: 0 16px 40px -8px rgba(30, 58, 138, 0.4);
      border-color: #1E3A8A;
    }
    .card-primaria {
      box-shadow: 0 8px 24px -8px rgba(16, 185, 129, 0.25);
    }
    .card-primaria .card-header {
      background: linear-gradient(135deg, #10B981 0%, #059669 100%);
    }
    .card-primaria:hover {
      box-shadow: 0 16px 40px -8px rgba(16, 185, 129, 0.4);
      border-color: #10B981;
    }
    .card-secundaria {
      box-shadow: 0 8px 24px -8px rgba(139, 92, 246, 0.25);
    }
    .card-secundaria .card-header {
      background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
    }
    .card-secundaria:hover {
      box-shadow: 0 16px 40px -8px rgba(139, 92, 246, 0.4);
      border-color: #8B5CF6;
    }
    .card-header {
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: #FFFFFF;
    }
    .card-header mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      color: #FFFFFF;
    }
    .card-header h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
      color: #FFFFFF;
    }
    .card-body {
      padding: 1.25rem;
    }
    .card-body p {
      color: #475569;
      margin: 0 0 1rem;
      font-size: 0.875rem;
      line-height: 1.5;
    }
  `],
})
export class NotasSelectorComponent implements OnInit {
  contexto = signal<Contexto | null>(null);

  constructor(
    private service: CalificacionService,
    private catalogos: CatalogosService
  ) {}

  ngOnInit(): void {
    forkJoin({
      periodos: this.catalogos.getPeriodos().pipe(catchError(() => of([]))),
      califs: this.service.getAll().pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ periodos, califs }) => {
        const activo = periodos.find((p) => p.activo) ?? periodos[0];
        const ultima = califs.length ? `Registro #${Math.max(...califs.map((c) => c.id))}` : 'Sin registros';
        this.contexto.set({
          periodo: activo ? `${activo.nombre} (${activo.anio})` : '—',
          total: califs.length,
          ultima,
        });
      },
    });
  }
}
