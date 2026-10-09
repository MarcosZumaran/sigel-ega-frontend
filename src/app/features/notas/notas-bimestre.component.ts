import { Component, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { forkJoin } from 'rxjs';
import { CalificacionService } from './services/calificacion.service';
import { ActividadService } from './services/actividad.service';
import { MatriculaService } from '../matriculas/services/matricula.service';
import { EstudianteService } from '../estudiantes/services/estudiante.service';
import { CatalogosService } from '../../core/services/catalogos.service';
import { BimestreService } from './services/bimestre.service';
import { ActividadFormDialogComponent } from './actividad-form-dialog.component';
import { extractApiError } from '../../core/utils/api-error';

type NivelBim = 'AD' | 'A' | 'B' | 'C';
import { Area } from '../../core/models/calificacion.model';
import { Estudiante } from '../../core/models/estudiante.model';
import { BackButtonComponent } from '../../shared/components/back-button.component';

/** Nivel de competencia del estudiante (solo lectura: se gestiona desde actividades). */
interface NivelCompetencia {
  competencia: Area;
  areaPadre: Area | null;
  calificacionId: number | null;
  nivel: NivelBim | null;
  conclusion: string;
}

@Component({
  selector: 'app-notas-bimestre',
  standalone: true,
  imports: [
    RouterLink, DatePipe, MatCardModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatDialogModule, BackButtonComponent,
  ],
  templateUrl: './notas-bimestre.component.html',
  styleUrl: './notas-bimestre.component.scss',
  providers: [DatePipe],
})
export class NotasBimestreComponent implements OnInit {
  loading = signal(true);
  estudiante = signal<Estudiante | null>(null);
  estudianteId = signal(0);
  bimestre = signal(0);
  bimestreId = signal(0);
  bimestreNombre = signal('');
  bimestreRango = signal('');
  hayBimestres = signal(true);
  esCerrado = signal(false);
  niveles = signal<NivelCompetencia[]>([]);
  seccionId = signal(0);
  periodoId = signal(0);
  actividadesPorCompetencia = signal<Record<number, number>>({});

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private califs: CalificacionService,
    private actividades: ActividadService,
    private matriculasSvc: MatriculaService,
    private estudiantesSvc: EstudianteService,
    private catalogos: CatalogosService,
    private bimestres: BimestreService,
    private snack: MatSnackBar,
    private dialog: MatDialog,
    private datePipe: DatePipe,
  ) {}

  ngOnInit(): void {
    this.estudianteId.set(Number(this.route.snapshot.paramMap.get('estudianteId') ?? 0));
    this.bimestreId.set(Number(this.route.snapshot.paramMap.get('bimestreId') ?? 0));
    this.bimestre.set(0);
    this.load();
    // Recargar actividades al volver de la matricial
    this.route.queryParams.subscribe(() => {
      if (this.seccionId()) {
        this.cargarActividades();
      }
    });
  }

  nombreCompleto(): string {
    const e = this.estudiante();
    return e ? `${e.nombres} ${e.apellidos}` : '';
  }

  exportar(formato: 'xlsx' | 'pdf'): void {
    if (!this.seccionId() || !this.periodoId()) {
      this.snack.open('Sin matrícula para exportar', 'Cerrar', { duration: 3000 });
      return;
    }
    this.califs.exportSiagie(this.seccionId(), this.periodoId(), formato).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `siagie_bim${this.bimestre()}.${formato === 'xlsx' ? 'xlsx' : 'pdf'}`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: (err) => this.snack.open(extractApiError(err, 'No se pudo exportar'), 'Cerrar', { duration: 4000 }),
    });
  }

  agregarActividad(fila: NivelCompetencia): void {
    this.dialog
      .open(ActividadFormDialogComponent, {
        width: '520px',
        data: {
          competencia_id: fila.competencia.id,
          bimestre_id: this.bimestreId(),
          seccion_id: this.seccionId(),
        },
      })
      .afterClosed()
      .subscribe((creada) => {
        if (creada) this.cargarActividades();
      });
  }

  verActividades(fila: NivelCompetencia): void {
    this.router.navigate(['/notas/actividades/matricial'], {
      queryParams: {
        competencia_id: fila.competencia.id,
        bimestre_id: this.bimestreId(),
        seccion_id: this.seccionId(),
      },
    });
  }

  actividadesDe(competenciaId: number): number {
    return this.actividadesPorCompetencia()[competenciaId] ?? 0;
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({
      est: this.estudiantesSvc.getById(this.estudianteId()),
      mats: this.matriculasSvc.getAll(),
      califs: this.califs.getAll({ bimestre_id: this.bimestreId() }),
      areas: this.catalogos.getAreas(),
    }).subscribe({
      next: ({ est, mats, califs, areas }) => {
        this.estudiante.set(est);
        const mat = mats.find((m) => m.estudiante_id === this.estudianteId());
        this.seccionId.set(mat?.seccion_id ?? 0);
        this.periodoId.set(mat?.periodo_id ?? 0);
        this.bimestres.getByPeriodo(mat?.periodo_id).subscribe({
          next: (bims) => {
            const bim = bims.find((b) => b.id === this.bimestreId()) ?? null;
            this.bimestreNombre.set(bim?.nombre ?? '');
            const fmt = (f: string | null | undefined): string =>
              f ? (this.datePipe.transform(f, 'dd/MM/yyyy', '+0000') ?? f) : '';
            this.bimestreRango.set(
              bim?.fecha_inicio && bim?.fecha_fin ? `${fmt(bim.fecha_inicio)} – ${fmt(bim.fecha_fin)}` : ''
            );
            this.bimestre.set(bim?.numero ?? 0);
            this.esCerrado.set(bim ? !bim.activo : false);
            this.hayBimestres.set(bims.length > 0);
          },
          error: () => {
            this.hayBimestres.set(false);
            this.esCerrado.set(false);
          },
        });
        const comps = areas.filter((a) => a.tipo === 'competencia');
        const propias = califs.filter((c) => c.matricula_id === (mat?.id ?? -1));
        this.niveles.set(
          comps.map((c) => {
            const cal = propias.find((p) => p.area_id === c.id) ?? null;
            return {
              competencia: c,
              areaPadre: areas.find((a) => a.id === c.area_padre_id) ?? null,
              calificacionId: cal?.id ?? null,
              nivel: (cal?.nivel_logro as NivelBim | null) ?? null,
              conclusion: cal?.motivo_nota_c ?? '',
            };
          })
        );
        this.loading.set(false);
        this.cargarActividades();
      },
      error: (err) => {
        this.loading.set(false);
        this.snack.open(extractApiError(err, 'No se pudo cargar'), 'Cerrar', { duration: 4000 });
      },
    });
  }

  private cargarActividades(): void {
    const seccionId = this.seccionId();
    if (!seccionId) {
      this.actividadesPorCompetencia.set({});
      return;
    }
    this.actividades.getAll({
      seccion_id: seccionId,
      bimestre_id: this.bimestreId(),
    }).subscribe({
      next: (acts) => {
        const conteo: Record<number, number> = {};
        for (const a of acts) {
          conteo[a.competencia_id] = (conteo[a.competencia_id] ?? 0) + 1;
        }
        this.actividadesPorCompetencia.set(conteo);
      },
      error: () => this.actividadesPorCompetencia.set({}),
    });
  }
}
