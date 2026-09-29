import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./features/auth/register.component').then((m) => m.RegisterComponent) },
  { path: 'dashboard', canActivate: [authGuard], loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent) },
  { path: 'padres', canActivate: [authGuard], data: { breadcrumb: 'Padres de Familia' }, loadChildren: () => import('./features/padres/padres.routes').then((m) => m.PADRES_ROUTES) },
  { path: 'estudiantes', canActivate: [authGuard], data: { breadcrumb: 'Estudiantes' }, loadChildren: () => import('./features/estudiantes/estudiantes.routes').then((m) => m.ESTUDIANTES_ROUTES) },
  { path: 'apoderados', canActivate: [authGuard], data: { breadcrumb: 'Apoderados' }, loadChildren: () => import('./features/apoderados/apoderados.routes').then((m) => m.APODERADOS_ROUTES) },
  { path: 'matriculas', canActivate: [authGuard], data: { breadcrumb: 'Matrículas' }, loadChildren: () => import('./features/matriculas/matriculas.routes').then((m) => m.MATRICULAS_ROUTES) },
  { path: 'notas', canActivate: [authGuard], data: { breadcrumb: 'Notas' }, loadChildren: () => import('./features/notas/notas.routes').then((m) => m.NOTAS_ROUTES) },
  { path: 'asistencias', canActivate: [authGuard], data: { breadcrumb: 'Asistencias' }, loadChildren: () => import('./features/asistencias/asistencias.routes').then((m) => m.ASISTENCIAS_ROUTES) },
  { path: 'periodos', canActivate: [authGuard], data: { breadcrumb: 'Periodos' }, loadChildren: () => import('./features/periodos/periodos.routes').then((m) => m.PERIODOS_ROUTES) },
  { path: 'grados', canActivate: [authGuard], data: { breadcrumb: 'Grados' }, loadChildren: () => import('./features/grados/grados.routes').then((m) => m.GRADOS_ROUTES) },
  { path: 'secciones', canActivate: [authGuard], data: { breadcrumb: 'Secciones' }, loadChildren: () => import('./features/secciones/secciones.routes').then((m) => m.SECCIONES_ROUTES) },
  { path: 'reportes', canActivate: [authGuard], data: { breadcrumb: 'Reportes' }, loadChildren: () => import('./features/reportes/reportes.routes').then((m) => m.REPORTES_ROUTES) },
  { path: 'estadisticas', canActivate: [authGuard], data: { breadcrumb: 'Estadísticas' }, loadChildren: () => import('./features/estadisticas/estadisticas.routes').then((m) => m.ESTADISTICAS_ROUTES) },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
