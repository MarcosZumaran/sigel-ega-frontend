import { Injectable, inject } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

export interface Breadcrumb {
  label: string;
  url: string;
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly breadcrumbs = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.buildBreadcrumbs(this.route.root))
    ),
    { initialValue: [] as Breadcrumb[] }
  );

  private buildBreadcrumbs(route: ActivatedRoute, url = '', breadcrumbs: Breadcrumb[] = []): Breadcrumb[] {
    const children: ActivatedRoute[] = route.children;
    if (children.length === 0) return breadcrumbs;

    for (const child of children) {
      const routeURL = child.snapshot.url.map((segment) => segment.path).join('/');
      const nextURL = routeURL ? `${url}/${routeURL}` : url;
      const label = child.snapshot.data['breadcrumb'] as string | undefined;

      if (label) {
        breadcrumbs.push({ label, url: nextURL, isActive: false });
      }

      if (child.children.length > 0) {
        this.buildBreadcrumbs(child, nextURL, breadcrumbs);
      }
    }

    if (breadcrumbs.length > 0) {
      const last = breadcrumbs[breadcrumbs.length - 1];
      if (last) last.isActive = true;
    }

    return breadcrumbs;
  }
}
