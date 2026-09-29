import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '../../core/guards/unsaved-changes.guard';

export const MATRICULAS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./matriculas-list.component').then((m) => m.MatriculasListComponent) },
  { path: 'create', data: { breadcrumb: 'Nueva matrícula' }, loadComponent: () => import('./matriculas-wizard.component').then((m) => m.MatriculasWizardComponent) },
  { path: ':id', data: { breadcrumb: 'Detalle' }, loadComponent: () => import('./matriculas-show.component').then((m) => m.MatriculasShowComponent) },
  { path: ':id/edit', data: { breadcrumb: 'Editar' }, canDeactivate: [unsavedChangesGuard], loadComponent: () => import('./matriculas-form.component').then((m) => m.MatriculasFormComponent) },
];
