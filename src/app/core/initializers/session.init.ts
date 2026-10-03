import { APP_INITIALIZER } from '@angular/core';
import { AuthService } from '../services/auth.service';

export function verifySessionFactory(auth: AuthService) {
  return () => {
    // Si hay token guardado, verificar con el backend
    if (auth.getToken()) {
      return auth.verifySession();
    }
    return Promise.resolve(true);
  };
}

export const SESSION_INITIALIZER = {
  provide: APP_INITIALIZER,
  useFactory: verifySessionFactory,
  deps: [AuthService],
  multi: true,
};
