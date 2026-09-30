import { Component, OnInit, OnDestroy, ViewChild, ElementRef, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BackButtonComponent } from '../../shared/components/back-button.component';
import { InformeService, InformeProgreso } from './services/informe.service';
import { extractApiError } from '../../core/utils/api-error';

@Component({
  selector: 'app-notas-informe',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule, BackButtonComponent],
  template: `
    <app-back-button />
    <h1>Informe de Progreso</h1>
    @if (loading()) {
      <mat-spinner diameter="40"></mat-spinner>
    } @else if (informe()) {
      <div class="informe-head no-print">
        <div>
          <h2>{{ informe()!.estudiante.nombres }} {{ informe()!.estudiante.apellidos }}</h2>
          <p>DNI {{ informe()!.estudiante.dni }} — Período {{ informe()!.periodo.nombre }}</p>
        </div>
        <div class="informe-actions">
          <button mat-raised-button color="primary" (click)="descargarPdf()"><mat-icon>download</mat-icon> Descargar PDF</button>
          <button mat-stroked-button (click)="imprimirPdf()"><mat-icon>print</mat-icon> Imprimir</button>
          <a mat-stroked-button [routerLink]="['/notas/estudiante', id]"><mat-icon>arrow_back</mat-icon> Volver</a>
        </div>
      </div>
      @if (pdfUrl()) {
        <iframe #pdfFrame [src]="pdfUrl()" class="pdf-visor" title="Informe de progreso en PDF"></iframe>
      } @else {
        <p>Cargando visor del PDF…</p>
      }
    } @else {
      <p>No se pudo cargar el informe.</p>
    }
  `,
  styles: [`
    .informe-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem; }
    .informe-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .pdf-visor { width: 100%; height: 80vh; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; }
    @media print {
      .no-print, app-back-button { display: none !important; }
      .pdf-visor { height: 100vh; border: none; }
    }
  `],
})
export class NotasInformeComponent implements OnInit, OnDestroy {
  loading = signal(true);
  informe = signal<InformeProgreso | null>(null);
  pdfUrl = signal<SafeResourceUrl | null>(null);
  private pdfBlob: Blob | null = null;
  id = 0;
  private rawPdfUrl: string | null = null;

  @ViewChild('pdfFrame') pdfFrame?: ElementRef<HTMLIFrameElement>;

  constructor(private route: ActivatedRoute, private svc: InformeService, private snack: MatSnackBar, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('estudianteId'));
    this.svc.getInforme(this.id).subscribe({
      next: (d) => { this.informe.set(d); this.loading.set(false); },
      error: (e) => { this.loading.set(false); this.snack.open(extractApiError(e, 'No se pudo cargar el informe'), 'Cerrar', { duration: 4000 }); },
    });
    this.svc.descargarPdf(this.id).subscribe({
      next: (blob) => {
        this.pdfBlob = blob;
        this.rawPdfUrl = URL.createObjectURL(blob);
        this.pdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.rawPdfUrl));
      },
      error: (e) => this.snack.open(extractApiError(e, 'No se pudo cargar el visor del PDF'), 'Cerrar', { duration: 4000 }),
    });
  }

  ngOnDestroy(): void {
    if (this.rawPdfUrl) {
      URL.revokeObjectURL(this.rawPdfUrl);
      this.rawPdfUrl = null;
    }
  }

  descargarPdf(): void {
    if (!this.pdfBlob) return;
    const url = URL.createObjectURL(this.pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `informe-progreso-${this.id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  imprimirPdf(): void {
    const frame = this.pdfFrame?.nativeElement;
    try {
      if (frame?.contentWindow) {
        frame.contentWindow.focus();
        frame.contentWindow.print();
        return;
      }
    } catch {
      // CSP o cross-origin: fallback a descarga
    }
    this.descargarPdf();
  }
}
