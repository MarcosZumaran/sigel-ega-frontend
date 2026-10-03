import { Component, computed, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../core/services/auth.service';
import { resolveRoleName } from '../../core/guards/role.guard';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb.component';

interface MenuItem {
  label: string;
  url: string;
  icon: string;
  exact?: boolean;
  /** Si se define, el item solo se muestra a estos roles (hereda la sección si se omite). */
  roles?: string[];
}

interface MenuSeccion {
  titulo: string;
  roles: string[];
  items: MenuItem[];
}

const MENU_COMPLETO: MenuSeccion[] = [
  {
    titulo: 'Alumnado y Padres',
    roles: ['ADMIN', 'DIRECTOR'],
    items: [
      { label: 'Padres de Familia', url: '/padres', icon: 'family_restroom' },
      { label: 'Estudiantes', url: '/estudiantes', icon: 'school' },
      { label: 'Apoderados', url: '/apoderados', icon: 'link' },
    ],
  },
  {
    titulo: 'Gestión Académica',
    roles: ['ADMIN', 'DIRECTOR', 'DOCENTE'],
    items: [
      { label: 'Matrículas', url: '/matriculas', icon: 'app_registration', roles: ['ADMIN', 'DIRECTOR'] },
      { label: 'Notas', url: '/notas', icon: 'grade' },
      { label: 'Asistencias', url: '/asistencias', icon: 'fact_check' },
      { label: 'Historial asistencias', url: '/asistencias/historial', icon: 'history', exact: true },
    ],
  },
  {
    titulo: 'Infraestructura',
    roles: ['ADMIN'],
    items: [
      { label: 'Períodos', url: '/periodos', icon: 'calendar_month' },
      { label: 'Grados', url: '/grados', icon: 'layers' },
      { label: 'Secciones', url: '/secciones', icon: 'view_module' },
    ],
  },
  {
    titulo: 'Reportes',
    roles: ['ADMIN', 'DIRECTOR'],
    items: [
      { label: 'Reportes', url: '/reportes', icon: 'description' },
      { label: 'Estadísticas', url: '/estadisticas', icon: 'bar_chart' },
    ],
  },
];

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatSidenavModule, MatToolbarModule, MatIconModule, MatButtonModule, MatMenuModule, BreadcrumbComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent {
  sidebarOpen = signal(true);

  constructor(public auth: AuthService) {}

  /** Nombre del rol del usuario actual (para toolbar y filtrado). */
  readonly rolNombre = computed(() => resolveRoleName(this.auth.user()));

  /** Secciones e items del menú visibles según el rol. */
  readonly menuFiltrado = computed<MenuSeccion[]>(() => {
    const rol = this.rolNombre();
    if (!rol) return [];
    return MENU_COMPLETO.map((seccion) => ({
      ...seccion,
      items: seccion.items.filter((item) => seccion.roles.includes(rol) && (!item.roles || item.roles.includes(rol))),
    })).filter((seccion) => seccion.roles.includes(rol) && seccion.items.length > 0);
  });

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }
}
