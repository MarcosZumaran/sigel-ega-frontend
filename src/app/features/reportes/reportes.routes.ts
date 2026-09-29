import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '../../core/guards/unsaved-changes.guard';

export const REPORTES_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./reportes-list.component').then((m) => m.ReportesListComponent) },
  { path: 'create', data: { breadcrumb: 'Generar' }, canDeactivate: [unsavedChangesGuard], loadComponent: () => import('./reportes-form.component').then((m) => m.ReportesFormComponent) },
  { path: ':id', data: { breadcrumb: 'Detalle' }, loadComponent: () => import('./reportes-show.component').then((m) => m.ReportesShowComponent) },
];
