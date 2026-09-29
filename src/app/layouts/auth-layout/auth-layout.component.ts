import { Component } from '@angular/core';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-brand">
          <h1>SIGEL-EGA</h1>
          <p>I.E. Publica EGA</p>
        </div>
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .auth-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #1E3A8A 0%, #0F172A 100%); padding: 1rem; }
    .auth-card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); width: 100%; max-width: 420px; }
    .auth-brand { text-align: center; margin-bottom: 1.5rem; }
    .auth-brand h1 { margin: 0; color: #1E3A8A; }
    .auth-brand p { margin: 0.25rem 0 0; color: #64748b; }
  `],
})
export class AuthLayoutComponent {}
