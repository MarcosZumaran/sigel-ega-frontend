import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '../../core/guards/unsaved-changes.guard';

export const ESTUDIANTES_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./estudiantes-list.component').then((m) => m.EstudiantesListComponent) },
  { path: 'create', data: { breadcrumb: 'Nuevo' }, canDeactivate: [unsavedChangesGuard], loadComponent: () => import('./estudiantes-form.component').then((m) => m.EstudiantesFormComponent) },
  { path: ':id', data: { breadcrumb: 'Detalle' }, loadComponent: () => import('./estudiantes-show.component').then((m) => m.EstudiantesShowComponent) },
  { path: ':id/edit', data: { breadcrumb: 'Editar' }, canDeactivate: [unsavedChangesGuard], loadComponent: () => import('./estudiantes-form.component').then((m) => m.EstudiantesFormComponent) },
];
