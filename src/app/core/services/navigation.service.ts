import { Injectable, inject, signal, computed } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

const HISTORY_KEY = 'sigel_navigation_history';
const MAX_HISTORY = 20;

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private router = inject(Router);

  // Historial interno (últimas 20 rutas), persistido para sobrevivir a F5.
  private historySignal = signal<string[]>(this.loadHistoryFromStorage());

  /** Indica si existe una pagina anterior dentro de la aplicacion. */
  readonly canGoBack = computed(() => this.historySignal().length > 1);

  /** Ruta anterior o dashboard como fallback. */
  readonly previousUrl = computed(() => {
    const h = this.historySignal();
    return h.length > 1 ? (h[h.length - 2] ?? '/dashboard') : '/dashboard';
  });

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        const url = event.urlAfterRedirects;

        // Evitar el login y la raíz en el historial.
        if (url === '/login' || url === '/') return;

        // Evitar duplicados consecutivos (también cubre el goBack).
        const current = this.historySignal();
        if (current[current.length - 1] === url) return;

        const newHistory = [...current, url].slice(-MAX_HISTORY);
        this.historySignal.set(newHistory);
        this.saveHistoryToStorage(newHistory);
      });
  }

  /**
   * Vuelve a la pagina anterior dentro de la aplicacion.
   * Si no hay historial, navega al dashboard.
   */
  goBack(): void {
    const history = this.historySignal();
    if (history.length > 1) {
      const newHistory = history.slice(0, -1);
      this.historySignal.set(newHistory);
      this.saveHistoryToStorage(newHistory);
      const previousUrl = newHistory[newHistory.length - 1] ?? '/dashboard';
      this.router.navigateByUrl(previousUrl);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  /** Limpia el historial (útil al cerrar sesión). */
  clearHistory(): void {
    this.historySignal.set([]);
    localStorage.removeItem(HISTORY_KEY);
  }

  private loadHistoryFromStorage(): string[] {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  }

  private saveHistoryToStorage(history: string[]): void {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {
      // Silencioso: el historial es accesorio.
    }
  }
}
