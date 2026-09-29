import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '../../core/guards/unsaved-changes.guard';

export const PADRES_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./padres-list.component').then((m) => m.PadresListComponent) },
  { path: 'create', data: { breadcrumb: 'Nuevo' }, canDeactivate: [unsavedChangesGuard], loadComponent: () => import('./padres-form.component').then((m) => m.PadresFormComponent) },
  { path: ':id', data: { breadcrumb: 'Detalle' }, loadComponent: () => import('./padres-show.component').then((m) => m.PadresShowComponent) },
  { path: ':id/edit', data: { breadcrumb: 'Editar' }, canDeactivate: [unsavedChangesGuard], loadComponent: () => import('./padres-form.component').then((m) => m.PadresFormComponent) },
];
