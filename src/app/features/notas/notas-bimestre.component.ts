import { Component, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { CalificacionService } from './services/calificacion.service';
import { MatriculaService } from '../matriculas/services/matricula.service';
import { EstudianteService } from '../estudiantes/services/estudiante.service';
import { CatalogosService } from '../../core/services/catalogos.service';
import { BimestreService } from './services/bimestre.service';
import { DialogService } from '../../core/services/dialog.service';
import { extractApiError } from '../../core/utils/api-error';
import { notaANivel, esCoherente } from '../../core/utils/ministerio-equivalencia';

type NivelBim = 'AD' | 'A' | 'B' | 'C';
import { Calificacion, CalificacionPayload } from '../../core/models/calificacion.model';
import { Area } from '../../core/models/calificacion.model';
import { Estudiante } from '../../core/models/estudiante.model';
import { BackButtonComponent } from '../../shared/components/back-button.component';

interface FilaBim {
  competencia: Area;
  areaPadre: Area | null;
  calificacionId: number | null;
  nota: number | null;
  nivel: NivelBim | null;
  conclusion: string;
  dirty: boolean;
}

@Component({
  selector: 'app-notas-bimestre',
  standalone: true,
  imports: [
    RouterLink, DatePipe, MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatProgressSpinnerModule, MatSnackBarModule, BackButtonComponent,
  ],
  templateUrl: './notas-bimestre.component.html',
  styleUrl: './notas-bimestre.component.scss',
  providers: [DatePipe],
})
export class NotasBimestreComponent implements OnInit {
  loading = signal(true);
  saving = signal(false);
  estudiante = signal<Estudiante | null>(null);
  estudianteId = signal(0);
  bimestre = signal(0);
  bimestreId = signal(0);
  bimestreNombre = signal('');
  bimestreRango = signal('');
  hayBimestres = signal(true);
  esCerrado = signal(false);
  filas = signal<FilaBim[]>([]);
  seccionId = signal(0);
  periodoId = signal(0);

  constructor(
    private route: ActivatedRoute,
    private califs: CalificacionService,
    private matriculasSvc: MatriculaService,
    private estudiantesSvc: EstudianteService,
    private catalogos: CatalogosService,
    private bimestres: BimestreService,
    private snack: MatSnackBar,
    private dialogs: DialogService,
    private datePipe: DatePipe,
  ) {}

  ngOnInit(): void {
    this.estudianteId.set(Number(this.route.snapshot.paramMap.get('estudianteId') ?? 0));
    this.bimestreId.set(Number(this.route.snapshot.paramMap.get('bimestreId') ?? 0));
    this.bimestre.set(0);
    this.load();
  }

  nombreCompleto(): string {
    const e = this.estudiante();
    return e ? `${e.nombres} ${e.apellidos}` : '';
  }

  pendientes(): number {
    return this.filas().filter((f) => f.dirty).length;
  }

  onNotaInput(fila: FilaBim, raw: string): void {
    const v = raw.trim() === '' ? null : Number(raw);
    if (v !== null && (isNaN(v) || v < 0 || v > 20)) return;
    fila.nota = v === null ? null : Math.round(v * 10) / 10;
    fila.nivel = v === null ? null : notaANivel(v);
    fila.dirty = true;
    if (fila.nivel === 'C' && !fila.conclusion.trim()) {
      this.pedirConclusion(fila);
    }
  }

  private modalConclusionAbierto = false;

  async pedirConclusion(fila: FilaBim): Promise<void> {
    if (this.modalConclusionAbierto) return;
    this.modalConclusionAbierto = true;
    try {
      const texto = await this.dialogs.prompt({
        title: 'Conclusión descriptiva',
        subtitle: fila.competencia.nombre,
        label: 'Describa el avance del estudiante (obligatorio para nivel C)',
        placeholder: 'Ej.: Requiere apoyo para...',
        required: true,
        multiline: true,
        rows: 4,
        width: '600px',
      });
      if (texto !== null) {
        fila.conclusion = texto.trim();
        fila.dirty = true;
      }
    } finally {
      this.modalConclusionAbierto = false;
    }
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

  async saveAll(): Promise<void> {    const cambiadas = this.filas().filter((f) => f.dirty);
    if (!cambiadas.length || this.saving()) return;
    for (const f of cambiadas) {
      if (f.nota !== null && (f.nota < 0 || f.nota > 20)) {
        await this.dialogs.alert({ title: 'Nota inválida', message: `${f.competencia.nombre}: la nota debe estar entre 0 y 20.`, type: 'warning' });
        return;
      }
      if (f.nota !== null && f.nivel && !esCoherente(f.nota, f.nivel)) {
        await this.dialogs.alert({ title: 'Nivel incoherente', message: `${f.competencia.nombre}: el nivel ${f.nivel} no corresponde a la nota ${f.nota}.`, type: 'warning' });
        return;
      }
      if (f.nivel === 'C' && !f.conclusion.trim()) {
        await this.dialogs.alert({ title: 'Falta conclusión', message: `${f.competencia.nombre}: el nivel C exige conclusión descriptiva.`, type: 'warning' });
        await this.pedirConclusion(f);
        return;
      }
    }
    this.saving.set(true);
    const reqs = cambiadas.map((f) =>
      f.calificacionId
        ? this.califs.update(f.calificacionId, { nota: f.nota, nivel_logro: f.nivel })
        : this.califs.create(this.payloadDe(f))
    );
    forkJoin(reqs).subscribe({
      next: () => {
        this.saving.set(false);
        this.snack.open(`Se guardaron ${cambiadas.length} calificaciones`, 'Cerrar', { duration: 3000 });
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.snack.open(extractApiError(err, 'No se pudo guardar'), 'Cerrar', { duration: 4000 });
      },
    });
  }

  private payloadDe(f: FilaBim): CalificacionPayload {
    const mat = this.matriculaId();
    return {
      matricula_id: mat,
      area_id: f.competencia.id,
      tipo_evaluacion_id: this.tipoId(),
      bimestre_id: this.bimestreId(),
      nota: f.nota,
      nivel_logro: f.nivel,
      es_nota_c: f.nivel === 'C',
      motivo_nota_c: f.nivel === 'C' ? f.conclusion || null : null,
    };
  }

  private matriculaId = signal(0);
  private tipoId = signal(0);

  private load(): void {
    this.loading.set(true);
    forkJoin({
      est: this.estudiantesSvc.getById(this.estudianteId()),
      mats: this.matriculasSvc.getAll(),
      califs: this.califs.getAll({ bimestre_id: this.bimestreId() }),
      areas: this.catalogos.getAreas(),
      tipos: this.catalogos.getTiposEvaluacion(),
    }).subscribe({
      next: ({ est, mats, califs, areas, tipos }) => {
        this.estudiante.set(est);
        const mat = mats.find((m) => m.estudiante_id === this.estudianteId());
        this.matriculaId.set(mat?.id ?? 0);
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
        const bim = tipos.find((t) => t.nombre.toLowerCase().includes('bimestral')) ?? tipos[0];
        this.tipoId.set(bim?.id ?? 0);
        const comps = areas.filter((a) => a.tipo === 'competencia');
        const propias = califs.filter((c) => c.matricula_id === (mat?.id ?? -1));
        this.filas.set(
          comps.map((c) => {
            const cal = propias.find((p) => p.area_id === c.id) ?? null;
            return {
              competencia: c,
              areaPadre: areas.find((a) => a.id === c.area_padre_id) ?? null,
              calificacionId: cal?.id ?? null,
              nota: cal?.nota ?? null,
              nivel: (cal?.nivel_logro as NivelBim | null) ?? null,
              conclusion: cal?.motivo_nota_c ?? '',
              dirty: false,
            };
          })
        );
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.snack.open(extractApiError(err, 'No se pudo cargar'), 'Cerrar', { duration: 4000 });
      },
    });
  }
}
