import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NavigationService } from '../../core/services/navigation.service';

@Component({
  selector: 'app-back-button',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <button
      mat-stroked-button
      (click)="navigationService.goBack()"
      class="!rounded-lg !h-10 !text-sm !border-slate-300 hover:!bg-slate-50"
      aria-label="Volver a la página anterior"
    >
      <mat-icon>arrow_back</mat-icon>
      <span class="ml-1">Volver</span>
    </button>
  `,
})
export class BackButtonComponent {
  navigationService = inject(NavigationService);
}
