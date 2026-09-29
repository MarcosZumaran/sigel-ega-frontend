import { Component, computed, inject } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MainLayoutComponent, AuthLayoutComponent],
  template: `
    @if (layout() === 'auth') {
      <app-auth-layout>
        <router-outlet></router-outlet>
      </app-auth-layout>
    } @else {
      <app-main-layout>
        <router-outlet></router-outlet>
      </app-main-layout>
    }
  `,
})
export class App {
  private router = inject(Router);
  private currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  layout = computed(() => {
    const url = this.currentUrl() ?? '/';
    const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];
    return authRoutes.some((r) => url.startsWith(r)) ? 'auth' : 'main';
  });
}
