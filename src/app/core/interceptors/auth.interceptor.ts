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
      if (err instanceof HttpErrorResponse && err.status === 401) {
        const mensaje = (err.error as { message?: string } | null)?.message ?? '';
        if (mensaje.toLowerCase().includes('unauthenticated')) {
          localStorage.removeItem('sigel_token');
          localStorage.removeItem('sigel_user');
          inject(Router).navigate(['/login']);
        } else {
          inject(MatSnackBar).open('No tiene permiso para esta acción', 'Cerrar', { duration: 4000 });
        }
      }
      return throwError(() => err);
    })
  );
};
