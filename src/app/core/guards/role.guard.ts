import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import type { User } from '../models/user.model';

/** Fallback legacy cuando el backend no incluye la relación `rol`. */
const ROL_POR_ID: Record<number, string> = { 1: 'ADMIN', 2: 'DOCENTE' };

/**
 * Resuelve el nombre del rol del usuario.
 * Fuente primaria: relación `rol.nombre` (viene de /auth/me).
 * Fallback: mapeo del `rol_id` legacy.
 */
export function resolveRoleName(user: User | null | undefined): string | null {
  if (!user) return null;
  return user.rol?.nombre ?? ROL_POR_ID[user.rol_id] ?? null;
}

/**
 * Guard que verifica que el usuario autenticado tenga uno de los roles permitidos.
 *
 * Uso en rutas:
 *   canActivate: [authGuard, roleGuard(['ADMIN'])]
 */
export function roleGuard(rolesPermitidos: string[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    const user = auth.user();
    if (!user) {
      router.navigate(['/login']);
      return false;
    }

    const rolNombre = resolveRoleName(user);
    if (!rolNombre || !rolesPermitidos.includes(rolNombre)) {
      router.navigate(['/dashboard']);
      return false;
    }

    return true;
  };
}
