import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '../../core/guards/unsaved-changes.guard';

export const ASISTENCIAS_ROUTES: Routes = [
  { path: '', data: { breadcrumb: 'Asistencias' }, loadComponent: () => import('./asistencias-matricial.component').then((m) => m.AsistenciasMatricialComponent) },
  { path: 'matricial', redirectTo: '', pathMatch: 'full' },
  { path: 'lista', redirectTo: 'historial', pathMatch: 'full' },
  { path: 'historial', data: { breadcrumb: 'Historial' }, loadComponent: () => import('./asistencias-list.component').then((m) => m.AsistenciasListComponent) },
  { path: 'create', data: { breadcrumb: 'Registrar' }, canDeactivate: [unsavedChangesGuard], loadComponent: () => import('./asistencias-form.component').then((m) => m.AsistenciasFormComponent) },
  { path: ':id', data: { breadcrumb: 'Detalle' }, loadComponent: () => import('./asistencias-show.component').then((m) => m.AsistenciasShowComponent) },
];
