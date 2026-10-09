import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

export interface ModuleQuickAction {
  label: string;
  icon: string;
  link: string | string[];
}

export interface ModuleRecentItem {
  title: string;
  subtitle?: string;
  link?: string | string[];
}

@Component({
  selector: 'app-module-home',
  standalone: true,
  imports: [RouterLink, MatIconModule, MatListModule],
  template: `
    <div class="module-home">
      <div class="flat-card">
        <div class="flat-card-header">
          <div class="flat-card-icon icon-blue"><mat-icon>{{ headerIcon() }}</mat-icon></div>
          <div>
            <h3>{{ moduleName() }}</h3>
            <p>Acciones rápidas</p>
          </div>
        </div>
        <div class="actions">
          @for (a of actions(); track a.label) {
            <a class="quick-action" [routerLink]="a.link">
              <mat-icon>{{ a.icon }}</mat-icon>{{ a.label }}
            </a>
          }
        </div>
      </div>
      <div class="flat-card">
        <div class="flat-card-header">
          <div class="flat-card-icon icon-green"><mat-icon>history</mat-icon></div>
          <div>
            <h3>{{ recentTitle() }}</h3>
          </div>
        </div>
          @if (!items().length) {
            <p class="empty">Sin registros recientes.</p>
          } @else {
            <mat-list>
              @for (item of items(); track item.title) {
                <mat-list-item>
                  <mat-icon matListItemIcon>chevron_right</mat-icon>
                  @if (item.link) {
                    <a matListItemTitle [routerLink]="item.link">{{ item.title }}</a>
                  } @else {
                    <span matListItemTitle>{{ item.title }}</span>
                  }
                  @if (item.subtitle) {
                    <span matListItemLine>{{ item.subtitle }}</span>
                  }
                </mat-list-item>
              }
            </mat-list>
          }
      </div>
    </div>
  `,
  styles: [`
    .module-home { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
    @media (max-width: 900px) { .module-home { grid-template-columns: 1fr; } }
    .actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .empty { color: #64748b; margin: 0; }
  `],
})
export class ModuleHomeComponent {
  moduleName = input('Módulo');
  actions = input<ModuleQuickAction[]>([]);
  recentTitle = input('Últimos registros');
  items = input<ModuleRecentItem[]>([]);

  /** Icono del header segun el modulo (flat vibrante). */
  headerIcon(): string {
    const nombre = this.moduleName().toLowerCase();
    if (nombre.includes('padre')) return 'family_restroom';
    if (nombre.includes('estudiante') || nombre.includes('alumno')) return 'school';
    if (nombre.includes('apoderado')) return 'link';
    if (nombre.includes('matr')) return 'app_registration';
    if (nombre.includes('nota')) return 'grade';
    if (nombre.includes('asistencia')) return 'fact_check';
    if (nombre.includes('periodo')) return 'calendar_month';
    if (nombre.includes('grado')) return 'layers';
    if (nombre.includes('secci')) return 'view_module';
    if (nombre.includes('reporte')) return 'description';
    return 'dashboard';
  }
}
