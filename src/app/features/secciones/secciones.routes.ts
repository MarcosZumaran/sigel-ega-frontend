import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '../../core/guards/unsaved-changes.guard';

export const SECCIONES_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./secciones-list.component').then((m) => m.SeccionesListComponent) },
  { path: 'create', data: { breadcrumb: 'Nuevo' }, canDeactivate: [unsavedChangesGuard], loadComponent: () => import('./secciones-form.component').then((m) => m.SeccionesFormComponent) },
  { path: ':id', data: { breadcrumb: 'Detalle' }, loadComponent: () => import('./secciones-show.component').then((m) => m.SeccionesShowComponent) },
  { path: ':id/edit', data: { breadcrumb: 'Editar' }, canDeactivate: [unsavedChangesGuard], loadComponent: () => import('./secciones-form.component').then((m) => m.SeccionesFormComponent) },
];
