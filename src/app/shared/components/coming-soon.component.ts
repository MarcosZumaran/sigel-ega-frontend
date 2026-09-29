import { Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-coming-soon',
  standalone: true,
  imports: [MatCardModule],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>{{ title() }}</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <p>Modulo en migracion desde Vue. Conectara con la API del backend.</p>
      </mat-card-content>
    </mat-card>
  `,
})
export class ComingSoonComponent {
  title = input('Modulo');
}
