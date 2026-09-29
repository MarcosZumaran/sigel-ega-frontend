import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('sigel_token');
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  // Los endpoints de autenticación gestionan sus propios errores.
  if (req.url.includes('/auth/')) {
    return next(req);
  }

  return next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse) {
        const snack = inject(MatSnackBar);
        const mensaje = String((err.error as { message?: unknown } | null)?.message ?? '').toLowerCase();

        if (err.status === 401) {
          if (mensaje.includes('unauthenticated') || mensaje.includes('unauthorized') || mensaje.includes('token')) {
            localStorage.removeItem('sigel_token');
            localStorage.removeItem('sigel_user');
            inject(Router).navigate(['/login']);
          } else {
            snack.open('No tiene permiso para esta acción', 'Cerrar', {
              duration: 4000,
              panelClass: ['snack-warn'],
            });
          }
        } else if (err.status === 403) {
          snack.open('Acceso denegado: no tiene permisos suficientes', 'Cerrar', {
            duration: 4000,
            panelClass: ['snack-error'],
          });
        } else if (err.status >= 500) {
          snack.open('Error del servidor. Intente nuevamente', 'Cerrar', {
            duration: 4000,
            panelClass: ['snack-error'],
          });
        }
      }
      return throwError(() => err);
    })
  );
};
