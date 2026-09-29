import { Routes } from '@angular/router';

export const ESTADISTICAS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./estadisticas-dashboard.component').then((m) => m.EstadisticasDashboardComponent),
  },
];
