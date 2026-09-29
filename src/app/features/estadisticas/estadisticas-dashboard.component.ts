import { Component, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NgxChartsModule } from '@swimlane/ngx-charts';
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

const LOGRO_COLORS = [
  { name: 'AD', value: '#16a34a' },
  { name: 'A', value: '#2563eb' },
  { name: 'B', value: '#eab308' },
  { name: 'C', value: '#dc2626' },
];

@Component({
  selector: 'app-estadisticas-dashboard',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTableModule,
    MatProgressBarModule,
    NgxChartsModule,
  ],
  templateUrl: './estadisticas-dashboard.component.html',
  styleUrl: './estadisticas-dashboard.component.scss',
})
export class EstadisticasDashboardComponent implements OnInit {
  loading = signal(true);
  periodos = signal<Periodo[]>([]);
  secciones = signal<Seccion[]>([]);
  dashboard = signal<DashboardEstadisticas | null>(null);
  nivelesChart: { name: string; value: number }[] = [];
  logrosChart: { name: string; value: number }[] = [];
  asistenciaChart: { name: string; series: { name: string; value: number }[] }[] = [];
  ocupacion = signal<OcupacionSeccion[]>([]);

  fPeriodo = new FormControl<number | null>(null);
  fSeccion = new FormControl<number | null>(null);

  logroColors = LOGRO_COLORS;
  ocupacionCols = ['seccion', 'grado', 'ocupadas', 'vacantes', 'capacidad', 'ocupacion'];

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

  trackOcupacion(_i: number, r: OcupacionSeccion): string {
    return r.seccion;
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
        this.nivelesChart = r.niveles.map((x) => ({ name: x.nivel, value: x.total }));
        this.logrosChart = r.logros.map((x) => ({ name: x.nivel, value: x.total }));
        this.asistenciaChart = this.aMensual(r.mensual);
        this.ocupacion.set(r.ocupacion);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.snack.open(extractApiError(err, 'No se pudieron cargar las estadisticas'), 'Cerrar', { duration: 4000 });
      },
    });
  }

  private aMensual(rows: AsistenciaMensual[]): { name: string; series: { name: string; value: number }[] }[] {
    return rows.map((r) => ({
      name: r.mes,
      series: [
        { name: 'Presentes', value: r.presentes },
        { name: 'Tardanzas', value: r.tardanzas },
        { name: 'Ausentes', value: r.ausentes },
        { name: 'Justificados', value: r.justificados },
      ],
    }));
  }
}
