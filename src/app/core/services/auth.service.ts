import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { tap, finalize, Observable } from 'rxjs';
import { ApiService } from './api.service';
import { NavigationService } from './navigation.service';

export interface User {
  id: number;
  name: string;
  email: string;
  rol_id: number;
  estado_id: number;
}

export interface LoginResponse {
  token: string;
  token_type: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey = 'sigel_token';
  private userKey = 'sigel_user';
  private _user = signal<User | null>(this.loadUserFromStorage());

  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => !!this._user());

  constructor(private api: ApiService, private router: Router, private navigation: NavigationService) {}

  login(email: string, password: string): Observable<LoginResponse> {
    return this.api.post<LoginResponse>('/auth/login', { email, password }).pipe(
      tap((res) => {
        localStorage.setItem(this.tokenKey, res.token);
        localStorage.setItem(this.userKey, JSON.stringify(res.user));
        this._user.set(res.user);
      })
    );
  }

  logout(): Observable<unknown> {
    return this.api.post('/auth/logout', {}).pipe(
      finalize(() => {
        this.clearSession();
      })
    );
  }

  logoutLocal(): void {
    this.clearSession();
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private clearSession(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this._user.set(null);
    this.navigation.clearHistory();
    this.router.navigate(['/login']);
  }

  private loadUserFromStorage(): User | null {
    try {
      const raw = localStorage.getItem(this.userKey);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }
}
