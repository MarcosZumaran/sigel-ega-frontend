import { Component, OnInit, signal, inject} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ApoderadoService } from './services/apoderado.service';
import { PadreService } from '../padres/services/padre.service';
import { EstudianteService } from '../estudiantes/services/estudiante.service';
import { Apoderado } from '../../core/models/apoderado.model';
import { Padre } from '../../core/models/padre.model';
import { Estudiante } from '../../core/models/estudiante.model';
import { extractApiError } from '../../core/utils/api-error';
import { BackButtonComponent } from '../../shared/components/back-button.component';
import { DialogService } from '../../core/services/dialog.service';

@Component({
  selector: 'app-apoderados-show',
  standalone: true,
  imports: [BackButtonComponent, ReactiveFormsModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule, MatListModule, MatFormFieldModule, MatSelectModule],
  template: `
    <app-back-button />
    <h1>Apoderado #{{ id }}</h1>
    @if (loading()) {
      <div class="loading"><mat-spinner diameter="40"></mat-spinner></div>
    } @else if (apoderado()) {
      <p class="muted">UUID: {{ apoderado()?.uuid }}</p>
      <div class="panels">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Padres vinculados ({{ apoderado()?.padres?.length ?? 0 }})</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (apoderado()?.padres?.length) {
              <mat-list>
                @for (p of apoderado()?.padres; track p.id) {
                  <mat-list-item>
                    <a [routerLink]="['/padres', p.id]">{{ p.nombres }} {{ p.apellidos }}</a>
                    <span class="dni">DNI {{ p.dni }}</span>
                    <span class="spacer"></span>
                    <button mat-icon-button color="warn" (click)="onDetachPadre(p.id)" [disabled]="busy()" title="Desvincular">
                      <mat-icon>link_off</mat-icon>
                    </button>
                  </mat-list-item>
                }
              </mat-list>
            } @else {
              <p class="muted">Sin padres vinculados.</p>
            }
            <div class="add-row">
              <mat-form-field appearance="outline" class="grow">
                <mat-label>Agregar padre libre</mat-label>
                <mat-select [formControl]="selPadre">
                  @for (p of padresLibres(); track p.id) {
                    <mat-option [value]="p.id">{{ p.nombres }} {{ p.apellidos }} (DNI {{ p.dni }})</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <button mat-raised-button color="primary" (click)="onAttachPadre()" [disabled]="!selPadre.value || busy()">Vincular</button>
            </div>
          </mat-card-content>
        </mat-card>
        <mat-card>
          <mat-card-header>
            <mat-card-title>Estudiantes vinculados ({{ apoderado()?.estudiantes?.length ?? 0 }})</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (apoderado()?.estudiantes?.length) {
              <mat-list>
                @for (e of apoderado()?.estudiantes; track e.id) {
                  <mat-list-item>
                    <a [routerLink]="['/estudiantes', e.id]">{{ e.nombres }} {{ e.apellidos }}</a>
                    <span class="dni">DNI {{ e.dni }}</span>
                    <span class="spacer"></span>
                    <button mat-icon-button color="warn" (click)="onDetachEstudiante(e.id)" [disabled]="busy()" title="Desvincular">
                      <mat-icon>link_off</mat-icon>
                    </button>
                  </mat-list-item>
                }
              </mat-list>
            } @else {
              <p class="muted">Sin estudiantes vinculados.</p>
            }
            <div class="add-row">
              <mat-form-field appearance="outline" class="grow">
                <mat-label>Agregar estudiante libre</mat-label>
                <mat-select [formControl]="selEstudiante">
                  @for (e of estudiantesLibres(); track e.id) {
                    <mat-option [value]="e.id">{{ e.nombres }} {{ e.apellidos }} (DNI {{ e.dni }})</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <button mat-raised-button color="primary" (click)="onAttachEstudiante()" [disabled]="!selEstudiante.value || busy()">Vincular</button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
      <div class="actions">
        <a mat-button routerLink="/apoderados">Volver</a>
      </div>
    } @else {
      <p>No se encontro el apoderado.</p>
      <a mat-button routerLink="/apoderados">Volver</a>
    }
  `,
  styles: [`
    h1 { color: #1E3A8A; }
    .muted { color: #64748b; }
    .loading { display: flex; justify-content: center; padding: 2rem; }
    .panels { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1rem; }
    .dni { color: #64748b; font-size: 0.85rem; margin-left: 0.5rem; }
    .spacer { flex: 1 1 auto; }
    .add-row { display: flex; gap: 0.5rem; align-items: center; margin-top: 1rem; }
    .grow { flex: 1 1 auto; }
    .actions { margin-top: 1rem; }
  `],
})
export class ApoderadosShowComponent implements OnInit {
  private dialogs = inject(DialogService);

  loading = signal(true);
  busy = signal(false);
  id = 0;
  apoderado = signal<Apoderado | null>(null);
  padresLibres = signal<Padre[]>([]);
  estudiantesLibres = signal<Estudiante[]>([]);
  selPadre = new FormControl<number | null>(null);
  selEstudiante = new FormControl<number | null>(null);

  constructor(
    private service: ApoderadoService,
    private padres: PadreService,
    private estudiantes: EstudianteService,
    private route: ActivatedRoute,
    private snack: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.service.getById(this.id).subscribe({
      next: (a) => {
        this.apoderado.set(a);
        this.loading.set(false);
        this.loadLibres();
      },
      error: (err) => {
        this.loading.set(false);
        this.snack.open(extractApiError(err, 'No se pudo cargar el apoderado'), 'Cerrar', { duration: 4000 });
      },
    });
  }

  private loadLibres(): void {
    this.padres.getAll().subscribe({
      next: (res) => this.padresLibres.set((Array.isArray(res) ? res : []).filter((p) => p.apoderado_id !== this.id)),
      error: () => this.padresLibres.set([]),
    });
    this.estudiantes.getAll().subscribe({
      next: (res) => this.estudiantesLibres.set((Array.isArray(res) ? res : []).filter((e) => e.apoderado_id !== this.id)),
      error: () => this.estudiantesLibres.set([]),
    });
  }

  onAttachPadre(): void {
    const padreId = this.selPadre.value;
    if (!padreId) return;
    this.busy.set(true);
    this.service.attachPadre(this.id, padreId).subscribe({
      next: () => {
        this.busy.set(false);
        this.selPadre.reset();
        this.snack.open('Padre vinculado correctamente', 'Cerrar', { duration: 3000 });
        this.reload();
      },
      error: (err) => {
        this.busy.set(false);
        this.snack.open(extractApiError(err, 'No se pudo vincular el padre'), 'Cerrar', { duration: 4000 });
      },
    });
  }

  async onDetachPadre(padreId: number): Promise<void> {
    const confirmed = await this.dialogs.confirm({
      title: 'Confirmar desvinculacion',
      message: 'Desvincular este padre del apoderado?',
      confirmText: 'Desvincular',
      cancelText: 'Cancelar',
      type: 'danger',
      icon: 'delete',
    });
    if (!confirmed) return;
    this.busy.set(true);
    this.service.detachPadre(this.id, padreId).subscribe({
      next: (res) => {
        this.busy.set(false);
        this.snack.open(res.message ?? 'Padre desvinculado', 'Cerrar', { duration: 3000 });
        this.reload();
      },
      error: (err) => {
        this.busy.set(false);
        this.snack.open(extractApiError(err, 'No se pudo desvincular el padre'), 'Cerrar', { duration: 4000 });
      },
    });
  }

  onAttachEstudiante(): void {
    const estudianteId = this.selEstudiante.value;
    if (!estudianteId) return;
    this.busy.set(true);
    this.service.attachEstudiante(this.id, estudianteId).subscribe({
      next: () => {
        this.busy.set(false);
        this.selEstudiante.reset();
        this.snack.open('Estudiante vinculado correctamente', 'Cerrar', { duration: 3000 });
        this.reload();
      },
      error: (err) => {
        this.busy.set(false);
        this.snack.open(extractApiError(err, 'No se pudo vincular el estudiante'), 'Cerrar', { duration: 4000 });
      },
    });
  }

  async onDetachEstudiante(estudianteId: number): Promise<void> {
    const confirmed = await this.dialogs.confirm({
      title: 'Confirmar desvinculacion',
      message: 'Desvincular este estudiante del apoderado?',
      confirmText: 'Desvincular',
      cancelText: 'Cancelar',
      type: 'danger',
      icon: 'delete',
    });
    if (!confirmed) return;
    this.busy.set(true);
    this.service.detachEstudiante(this.id, estudianteId).subscribe({
      next: (res) => {
        this.busy.set(false);
        this.snack.open(res.message ?? 'Estudiante desvinculado', 'Cerrar', { duration: 3000 });
        this.reload();
      },
      error: (err) => {
        this.busy.set(false);
        this.snack.open(extractApiError(err, 'No se pudo desvincular el estudiante'), 'Cerrar', { duration: 4000 });
      },
    });
  }
}
