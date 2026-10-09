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
      <div class="flat-card nivel-card">
        <div class="nivel-banner bg-todas">
          <mat-icon>list</mat-icon>
          <h2>Todas</h2>
        </div>
        <div class="nivel-body">
          <p>Todos los niveles: consulta y registra calificaciones de primaria y secundaria en una sola vista.</p>
          <a mat-flat-button color="primary" [routerLink]="['/notas/listado']" [queryParams]="{ nivel: 'todas' }">Ver notas</a>
        </div>
      </div>
      <div class="flat-card nivel-card">
        <div class="nivel-banner bg-primaria">
          <mat-icon>school</mat-icon>
          <h2>Primaria</h2>
        </div>
        <div class="nivel-body">
          <p>Calificaciones del nivel primaria con equivalencia literal AD, A, B y C según norma MINEDU.</p>
          <a mat-flat-button color="primary" [routerLink]="['/notas/listado']" [queryParams]="{ nivel: 'primaria' }">Ver notas</a>
        </div>
      </div>
      <div class="flat-card nivel-card">
        <div class="nivel-banner bg-secundaria">
          <mat-icon>science</mat-icon>
          <h2>Secundaria</h2>
        </div>
        <div class="nivel-body">
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
    .nivel-card { padding: 0; overflow: hidden; transition: transform 0.15s ease, filter 0.15s ease; }
    .nivel-card:hover { transform: translateY(-3px); filter: brightness(0.98); }
    .nivel-banner { display: flex; align-items: center; gap: 0.75rem; padding: 1rem 1.25rem; color: #fff; }
    .nivel-banner mat-icon { font-size: 28px; width: 28px; height: 28px; color: #fff; }
    .nivel-banner h2 { margin: 0; color: #fff; font-size: 1.25rem; font-weight: 700; }
    .nivel-body { padding: 1.25rem; display: flex; flex-direction: column; align-items: flex-start; gap: 0.75rem; }
    .nivel-body p { margin: 0; color: #64748b; flex: 1; }
    .bg-todas { background: #1E3A8A; }
    .bg-primaria { background: #10B981; }
    .bg-secundaria { background: #8B5CF6; }
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
