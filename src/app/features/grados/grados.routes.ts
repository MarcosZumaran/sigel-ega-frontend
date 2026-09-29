import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '../../core/guards/unsaved-changes.guard';

export const GRADOS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./grados-list.component').then((m) => m.GradosListComponent) },
  { path: 'create', data: { breadcrumb: 'Nuevo' }, canDeactivate: [unsavedChangesGuard], loadComponent: () => import('./grados-form.component').then((m) => m.GradosFormComponent) },
  { path: ':id', data: { breadcrumb: 'Detalle' }, loadComponent: () => import('./grados-show.component').then((m) => m.GradosShowComponent) },
  { path: ':id/edit', data: { breadcrumb: 'Editar' }, canDeactivate: [unsavedChangesGuard], loadComponent: () => import('./grados-form.component').then((m) => m.GradosFormComponent) },
];
