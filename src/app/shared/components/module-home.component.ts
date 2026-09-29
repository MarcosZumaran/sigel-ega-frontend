import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
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
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatListModule],
  template: `
    <div class="module-home">
      <mat-card class="actions-card">
        <mat-card-header>
          <mat-card-title>{{ moduleName() }}</mat-card-title>
          <mat-card-subtitle>Acciones rápidas</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content class="actions">
          @for (a of actions(); track a.label) {
            <a mat-stroked-button color="primary" [routerLink]="a.link">
              <mat-icon>{{ a.icon }}</mat-icon>{{ a.label }}
            </a>
          }
        </mat-card-content>
      </mat-card>
      <mat-card class="recent-card">
        <mat-card-header>
          <mat-card-title>{{ recentTitle() }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
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
        </mat-card-content>
      </mat-card>
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
}
