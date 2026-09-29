import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '../../core/guards/unsaved-changes.guard';

export const PERIODOS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./periodos-list.component').then((m) => m.PeriodosListComponent) },
  { path: 'create', data: { breadcrumb: 'Nuevo' }, canDeactivate: [unsavedChangesGuard], loadComponent: () => import('./periodos-form.component').then((m) => m.PeriodosFormComponent) },
  { path: ':id/bimestres', data: { breadcrumb: 'Bimestres' }, loadComponent: () => import('./periodos-bimestres.component').then((m) => m.PeriodosBimestresComponent) },
  { path: ':id', data: { breadcrumb: 'Detalle' }, loadComponent: () => import('./periodos-show.component').then((m) => m.PeriodosShowComponent) },
  { path: ':id/edit', data: { breadcrumb: 'Editar' }, canDeactivate: [unsavedChangesGuard], loadComponent: () => import('./periodos-form.component').then((m) => m.PeriodosFormComponent) },
];
