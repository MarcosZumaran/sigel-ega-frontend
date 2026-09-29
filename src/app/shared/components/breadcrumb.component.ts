import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  template: `
    <nav aria-label="Breadcrumb" class="hidden sm:flex items-center gap-2 text-sm text-slate-500">
      <a routerLink="/dashboard" class="hover:text-slate-900 transition-colors flex items-center" aria-label="Inicio">
        <mat-icon class="!text-base !w-4 !h-4">home</mat-icon>
      </a>
      @for (crumb of breadcrumbs(); track crumb.label + ':' + $index) {
        <mat-icon class="!text-base !w-4 !h-4 text-slate-400">chevron_right</mat-icon>
        @if (crumb.isActive) {
          <span class="text-slate-900 font-medium" aria-current="page">{{ crumb.label }}</span>
        } @else {
          <a [routerLink]="crumb.url" class="hover:text-slate-900 transition-colors">
            {{ crumb.label }}
          </a>
        }
      }
    </nav>
  `,
})
export class BreadcrumbComponent {
  breadcrumbs = inject(BreadcrumbService).breadcrumbs;
}
