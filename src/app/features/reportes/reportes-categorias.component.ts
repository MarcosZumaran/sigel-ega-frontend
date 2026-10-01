import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CATEGORIAS_REPORTES } from '../../core/models/reporte.model';

@Component({
  selector: 'app-reportes-categorias',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <h1>Reportes</h1>
    <p class="sub">Seleccione un tipo de reporte para generarlo o descargarlo.</p>
    @for (cat of categorias; track cat.titulo) {
      <h2 class="cat-titulo">{{ cat.titulo }}</h2>
      <div class="cat-grid">
        @for (item of cat.items; track item.tipo) {
          <mat-card class="rep-card">
            <mat-card-header>
              <mat-icon mat-card-avatar>{{ item.icono }}</mat-icon>
              <mat-card-title>{{ item.titulo }}</mat-card-title>
              <mat-card-subtitle>{{ item.descripcion }}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-actions align="end">
              <a mat-raised-button color="primary" [routerLink]="['/reportes/create']" [queryParams]="{ tipo: item.tipo }">Generar</a>
            </mat-card-actions>
          </mat-card>
        }
      </div>
    }
    <div class="hist-link">
      <a mat-stroked-button routerLink="/reportes/historial"><mat-icon>history</mat-icon> Ver historial</a>
    </div>
  `,
  styles: [`
    .sub { color: #64748b; margin-top: 0; }
    .cat-titulo { margin: 1.25rem 0 0.5rem; color: #1E3A8A; }
    .cat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; }
    .hist-link { margin-top: 1.5rem; }
  `],
})
export class ReportesCategoriasComponent {
  categorias = CATEGORIAS_REPORTES;
}
