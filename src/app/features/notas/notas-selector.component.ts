import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
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
  imports: [RouterLink, MatCardModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="page-header">
      <div>
        <h1>Notas y evaluación</h1>
        <p>Selecciona el nivel para ver y registrar calificaciones. Equivalencia MINEDU automática: 18-20 AD, 14-17 A, 11-13 B, 0-10 C.</p>
      </div>
    </div>
    @if (contexto()) {
      <mat-card class="context-card">
        <mat-card-content>
          <div class="context-item"><mat-icon>calendar_month</mat-icon><span>Periodo activo: <strong>{{ contexto()!.periodo }}</strong></span></div>
          <div class="context-item"><mat-icon>assignment</mat-icon><span><strong>{{ contexto()!.total }}</strong> calificaciones registradas</span></div>
          <div class="context-item"><mat-icon>schedule</mat-icon><span>Última evaluación: <strong>{{ contexto()!.ultima }}</strong></span></div>
        </mat-card-content>
      </mat-card>
    }
    <div class="cards">
      <mat-card class="nivel-card border-todas">
        <mat-card-content>
          <div class="icon-circle bg-todas"><mat-icon>list</mat-icon></div>
          <h2>Todas</h2>
          <p>Todos los niveles: consulta y registra calificaciones de primaria y secundaria en una sola vista.</p>
          <a mat-flat-button color="primary" [routerLink]="['/notas/listado']" [queryParams]="{ nivel: 'todas' }">Ver notas</a>
        </mat-card-content>
      </mat-card>
      <mat-card class="nivel-card border-primaria">
        <mat-card-content>
          <div class="icon-circle bg-primaria"><mat-icon>school</mat-icon></div>
          <h2>Primaria</h2>
          <p>Calificaciones del nivel primaria con equivalencia literal AD, A, B y C según norma MINEDU.</p>
          <a mat-flat-button color="primary" [routerLink]="['/notas/listado']" [queryParams]="{ nivel: 'primaria' }">Ver notas</a>
        </mat-card-content>
      </mat-card>
      <mat-card class="nivel-card border-secundaria">
        <mat-card-content>
          <div class="icon-circle bg-secundaria"><mat-icon>science</mat-icon></div>
          <h2>Secundaria</h2>
          <p>Calificaciones del nivel secundaria con equivalencia vigesimal y literal según norma MINEDU.</p>
          <a mat-flat-button color="primary" [routerLink]="['/notas/listado']" [queryParams]="{ nivel: 'secundaria' }">Ver notas</a>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page-header { margin-bottom: 1rem; }
    .page-header h1 { margin: 0; }
    .page-header p { margin: 0.25rem 0 0; color: #64748b; }
    .context-card { margin-bottom: 1rem; background: linear-gradient(135deg, #eff6ff 0%, #ffffff 100%); border-left: 4px solid #1E3A8A; }
    .context-card mat-card-content { display: flex; gap: 2rem; flex-wrap: wrap; padding: 0.75rem 1rem !important; }
    .context-item { display: flex; align-items: center; gap: 0.5rem; color: #334155; }
    .context-item mat-icon { color: #1E3A8A; }
    .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
    @media (max-width: 900px) { .cards { grid-template-columns: 1fr; } }
    .nivel-card { min-height: 200px; border-left-width: 4px; border-left-style: solid; transition: box-shadow 0.2s ease, transform 0.2s ease; }
    .nivel-card:hover { box-shadow: 0 12px 28px rgba(30, 58, 138, 0.2); transform: translateY(-4px); }
    .border-todas { border-left-color: #1E3A8A; }
    .border-primaria { border-left-color: #16a34a; }
    .border-secundaria { border-left-color: #7c3aed; }
    .nivel-card mat-card-content { padding: 1.5rem !important; display: flex; flex-direction: column; align-items: flex-start; gap: 0.5rem; }
    .nivel-card h2 { margin: 0; }
    .nivel-card p { margin: 0 0 0.75rem; color: #64748b; flex: 1; }
    .icon-circle { width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .icon-circle mat-icon { font-size: 32px; width: 32px; height: 32px; color: #fff; }
    .bg-todas { background: #1E3A8A; }
    .bg-primaria { background: #16a34a; }
    .bg-secundaria { background: #7c3aed; }
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
