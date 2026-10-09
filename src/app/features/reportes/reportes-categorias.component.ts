import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CATEGORIAS_REPORTES } from '../../core/models/reporte.model';

@Component({
  selector: 'app-reportes-categorias',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="page-header">
      <div class="page-header-icon"><mat-icon>description</mat-icon></div>
      <div class="page-header-text">
        <h1>Reportes</h1>
        <p>Seleccione un tipo de reporte para generarlo o descargarlo.</p>
      </div>
      <div class="page-header-actions">
        <a mat-raised-button color="primary" routerLink="/reportes/historial"><mat-icon>history</mat-icon> Ver historial</a>
      </div>
    </div>
    @for (cat of categorias; track cat.titulo) {
      <h2 class="cat-titulo">{{ cat.titulo }}</h2>
      <div class="cat-grid">
        @for (item of cat.items; track item.tipo) {
          <div class="flat-card rep-card">
            <div class="flat-card-header">
              <div class="flat-card-icon {{ acentos[$index % acentos.length] }}"><mat-icon>{{ item.icono }}</mat-icon></div>
              <div>
                <h3>{{ item.titulo }}</h3>
                <p>{{ item.descripcion }}</p>
              </div>
            </div>
            <div class="rep-actions">
              <a mat-raised-button color="primary" [routerLink]="['/reportes/create']" [queryParams]="{ tipo: item.tipo }">Generar</a>
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .cat-titulo { margin: 1.25rem 0 0.5rem; color: #1E3A8A; }
    .cat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; }
    .rep-actions { display: flex; justify-content: flex-end; }
  `],
})
export class ReportesCategoriasComponent {
  categorias = CATEGORIAS_REPORTES;
  acentos = ['icon-blue', 'icon-green', 'icon-orange', 'icon-red', 'icon-purple', 'icon-cyan'];
}
