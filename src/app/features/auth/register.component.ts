import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink, MatButtonModule],
  template: `
    <h2>Registro</h2>
    <p>El registro publico esta deshabilitado. Solicite una cuenta al administrador.</p>
    <a mat-button color="primary" routerLink="/login">Volver al login</a>
  `,
})
export class RegisterComponent {}
