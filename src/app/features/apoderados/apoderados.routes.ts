import { Routes } from '@angular/router';

export const APODERADOS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./apoderados-list.component').then((m) => m.ApoderadosListComponent) },
  { path: ':id', data: { breadcrumb: 'Detalle' }, loadComponent: () => import('./apoderados-show.component').then((m) => m.ApoderadosShowComponent) },
];
