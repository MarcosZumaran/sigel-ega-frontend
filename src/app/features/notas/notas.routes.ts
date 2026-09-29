import { Routes } from '@angular/router';

export const NOTAS_ROUTES: Routes = [
  { path: '', data: { breadcrumb: 'Selector' }, loadComponent: () => import('./notas-selector.component').then((m) => m.NotasSelectorComponent) },
  { path: 'listado', data: { breadcrumb: 'Listado' }, loadComponent: () => import('./notas-listado.component').then((m) => m.NotasListadoComponent) },
  { path: 'estudiante/:estudianteId', data: { breadcrumb: 'Estudiante' }, loadComponent: () => import('./notas-estudiante.component').then((m) => m.NotasEstudianteComponent) },
  { path: 'estudiante/:estudianteId/bimestre/:bimestreId', data: { breadcrumb: 'Bimestre' }, loadComponent: () => import('./notas-bimestre.component').then((m) => m.NotasBimestreComponent) },
  { path: 'consolidado', data: { breadcrumb: 'Consolidado' }, loadComponent: () => import('./notas-consolidado.component').then((m) => m.NotasConsolidadoComponent) },
  { path: 'estudiante/:estudianteId/informe', data: { breadcrumb: 'Informe' }, loadComponent: () => import('./notas-informe.component').then((m) => m.NotasInformeComponent) },
  { path: ':id', data: { breadcrumb: 'Detalle' }, loadComponent: () => import('./notas-show.component').then((m) => m.NotasShowComponent) },
];
