import { Component, OnInit, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { EstadisticaService } from './services/estadistica.service';
import { CatalogosService } from '../../core/services/catalogos.service';
import { extractApiError } from '../../core/utils/api-error';
import {
  AsistenciaMensual,
  DashboardEstadisticas,
  LogroCneb,
  MatriculasPorNivel,
  OcupacionSeccion,
} from '../../core/models/estadistica.model';
import { Periodo } from '../../core/models/periodo.model';
import { Seccion } from '../../core/models/seccion.model';

type NivelCneb = 'AD' | 'A' | 'B' | 'C';

@Component({
  selector: 'app-estadisticas-dashboard',
  standalone: true,
  imports: [
    NgClass,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './estadisticas-dashboard.component.html',
  styleUrl: './estadisticas-dashboard.component.scss',
})
export class EstadisticasDashboardComponent implements OnInit {
  loading = signal(true);
  periodos = signal<Periodo[]>([]);
  secciones = signal<Seccion[]>([]);
  dashboard = signal<DashboardEstadisticas | null>(null);
  niveles: MatriculasPorNivel[] = [];
  nivelMax = 0;
  logros: LogroCneb[] = [];
  mensual: AsistenciaMensual[] = [];
  ocupacion = signal<OcupacionSeccion[]>([]);

  fPeriodo = new FormControl<number | null>(null);
  fSeccion = new FormControl<number | null>(null);

  constructor(
    private stats: EstadisticaService,
    private catalogos: CatalogosService,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.catalogos.getPeriodos().subscribe({
      next: (p) => {
        this.periodos.set(p);
        this.catalogos.getSecciones().subscribe({ next: (s) => this.secciones.set(s) });
        this.stats.getDashboard().subscribe({
          next: (d) => {
            this.dashboard.set(d);
            this.fPeriodo.setValue(d.periodo_activo?.id ?? p[0]?.id ?? null);
            this.cargarGraficos();
          },
          error: (err) => {
            this.loading.set(false);
            this.snack.open(extractApiError(err, 'No se pudo cargar el dashboard'), 'Cerrar', { duration: 4000 });
          },
        });
      },
      error: (err) => {
        this.loading.set(false);
        this.snack.open(extractApiError(err, 'No se pudieron cargar los periodos'), 'Cerrar', { duration: 4000 });
      },
    });
  }

  onFiltroChange(): void {
    this.cargarGraficos();
  }

  pctNivel(total: number): number {
    return this.nivelMax ? Math.round((total / this.nivelMax) * 100) : 0;
  }

  conteoNivel(nivel: NivelCneb): number {
    return this.logros.find((x) => x.nivel === nivel)?.total ?? 0;
  }

  pctOcupacion(r: OcupacionSeccion): number {
    return r.capacidad ? Math.round((r.ocupadas / r.capacidad) * 100) : 0;
  }

  claseOcupacion(r: OcupacionSeccion): 'ocupacion-alta' | 'ocupacion-media' | 'ocupacion-baja' {
    const pct = this.pctOcupacion(r);
    if (pct > 80) return 'ocupacion-alta';
    if (pct >= 50) return 'ocupacion-media';
    return 'ocupacion-baja';
  }

  private cargarGraficos(): void {
    const periodoId = this.fPeriodo.value;
    if (!periodoId) return;
    this.loading.set(true);
    const seccionId = this.fSeccion.value ?? undefined;
    forkJoin({
      niveles: this.stats.getMatriculasPorNivel(periodoId),
      logros: this.stats.getLogrosCneb(periodoId, seccionId),
      mensual: this.stats.getAsistenciaMensual(periodoId),
      ocupacion: this.stats.getOcupacionSecciones(periodoId),
    }).subscribe({
      next: (r) => {
        this.niveles = r.niveles;
        this.nivelMax = Math.max(0, ...r.niveles.map((x) => x.total));
        this.logros = r.logros;
        this.mensual = r.mensual;
        this.ocupacion.set(r.ocupacion);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.snack.open(extractApiError(err, 'No se pudieron cargar las estadisticas'), 'Cerrar', { duration: 4000 });
      },
    });
  }
}
