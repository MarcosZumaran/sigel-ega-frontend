import { Component, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { LowerCasePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BackButtonComponent } from '../../shared/components/back-button.component';
import { ConsolidadoService } from './services/consolidado.service';
import { CatalogosService } from '../../core/services/catalogos.service';
import { BimestreService } from './services/bimestre.service';
import { DialogService } from '../../core/services/dialog.service';
import { extractApiError } from '../../core/utils/api-error';
import { Periodo } from '../../core/models/periodo.model';
import { Seccion } from '../../core/models/seccion.model';
import { Bimestre } from '../../core/models/bimestre.model';
import {
  AreaConsolidado,
  ConsolidadoItem,
  ConsolidadoResponse,
  EstudianteConsolidado,
} from '../../core/models/consolidado.model';
import { NivelLogro } from '../../core/models/calificacion.model';

interface Celda {
  nivel: NivelLogro | null;
  conclusion: string | null;
  guardado: NivelLogro | null;
  dirty: boolean;
}

const NIVELES: NivelLogro[] = ['AD', 'A', 'B', 'C'];

@Component({
  selector: 'app-notas-consolidado',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    LowerCasePipe,
    BackButtonComponent,
  ],
  templateUrl: './notas-consolidado.component.html',
  styleUrl: './notas-consolidado.component.scss',
})
export class NotasConsolidadoComponent implements OnInit {
  loading = signal(true);
  saving = signal(false);
  periodos = signal<Periodo[]>([]);
  secciones = signal<Seccion[]>([]);
  bimestres = signal<Bimestre[]>([]);
  data = signal<ConsolidadoResponse | null>(null);
  celdas = new Map<string, Celda>();

  fPeriodo = new FormControl<number | null>(null);
  fSeccion = new FormControl<number | null>(null);
  fBimestre = new FormControl<number | null>(null);

  niveles = NIVELES;

  constructor(
    private consolidado: ConsolidadoService,
    private catalogos: CatalogosService,
    private bimestresSvc: BimestreService,
    private dialogs: DialogService,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.catalogos.getPeriodos().subscribe({
      next: (p) => {
        this.periodos.set(p);
        const activo = p.find((x) => x.activo) ?? p[0];
        if (activo) {
          this.fPeriodo.setValue(activo.id, { emitEvent: false });
          this.cargarBimestres(activo.id);
        }
        this.catalogos.getSecciones().subscribe({
          next: (s) => this.secciones.set(s),
          error: (e) => this.snack.open(extractApiError(e, 'Error cargando secciones'), 'Cerrar', { duration: 4000 }),
        });
        this.fPeriodo.valueChanges.subscribe((id) => {
          if (id) this.cargarBimestres(id);
        });
        this.loading.set(false);
      },
      error: (e) => {
        this.loading.set(false);
        this.snack.open(extractApiError(e, 'Error cargando periodos'), 'Cerrar', { duration: 4000 });
      },
    });
  }

  esCerrado(): boolean {
    const d = this.data();
    return !!d && !d.bimestre.activo;
  }

  cambios(): number {
    let n = 0;
    this.celdas.forEach((c) => { if (c.dirty) n++; });
    return n;
  }

  areas(): AreaConsolidado[] {
    return this.data()?.areas ?? [];
  }

  filas(): EstudianteConsolidado[] {
    return this.data()?.estudiantes ?? [];
  }

  competencias(area: AreaConsolidado): { id: number; nombre: string }[] {
    return (area.areas_hijas ?? []).map((h) => ({ id: h.id, nombre: h.nombre }));
  }

  celda(matriculaId: number, competenciaId: number): Celda | undefined {
    return this.celdas.get(`${matriculaId}|${competenciaId}`);
  }

  cargar(): void {
    const seccionId = this.fSeccion.value;
    const bimestreId = this.fBimestre.value;
    if (!seccionId || !bimestreId) {
      this.snack.open('Seleccione sección y bimestre', 'Cerrar', { duration: 3000 });
      return;
    }
    this.loading.set(true);
    this.consolidado.getConsolidado(seccionId, bimestreId, this.fPeriodo.value ?? undefined).subscribe({
      next: (d) => {
        this.loading.set(false);
        this.data.set(d);
        this.celdas.clear();
        for (const est of d.estudiantes) {
          for (const n of est.niveles) {
            const nivel = n.guardado ?? n.propuesto;
            this.celdas.set(`${est.matricula_id}|${n.competencia_id}`, {
              nivel,
              conclusion: n.conclusion,
              guardado: n.guardado,
              dirty: false,
            });
          }
        }
      },
      error: (e) => {
        this.loading.set(false);
        this.snack.open(extractApiError(e, 'Error cargando consolidado'), 'Cerrar', { duration: 4000 });
      },
    });
  }

  onNivelSelect(matriculaId: number, competenciaId: number, nivel: NivelLogro | null, compNombre: string): void {
    if (this.esCerrado()) return;
    const key = `${matriculaId}|${competenciaId}`;
    const c = this.celdas.get(key);
    if (!c) return;
    c.nivel = nivel;
    c.dirty = nivel !== c.guardado || (nivel === 'C' && !c.conclusion);
    if (nivel === 'C' && !c.conclusion) {
      void this.pedirConclusion(matriculaId, competenciaId, compNombre);
    }
  }

  async pedirConclusion(matriculaId: number, competenciaId: number, compNombre: string): Promise<void> {
    const key = `${matriculaId}|${competenciaId}`;
    const c = this.celdas.get(key);
    if (!c) return;
    const texto = await this.dialogs.prompt({
      title: 'Conclusión descriptiva',
      subtitle: compNombre,
      label: 'Conclusión (obligatoria para nivel C)',
      placeholder: 'Describa el logro del estudiante...',
      initialValue: c.conclusion ?? '',
      required: true,
      multiline: true,
      rows: 4,
      width: '600px',
    });
    if (texto !== null) {
      c.conclusion = texto;
      c.dirty = true;
    }
  }

  async saveAll(): Promise<void> {
    const d = this.data();
    const bimestreId = this.fBimestre.value;
    if (!d || !bimestreId || this.esCerrado()) return;

    const items: ConsolidadoItem[] = [];
    for (const est of d.estudiantes) {
      for (const n of est.niveles) {
        const c = this.celdas.get(`${est.matricula_id}|${n.competencia_id}`);
        if (!c || !c.dirty || !c.nivel) continue;
        if (c.nivel === 'C' && !c.conclusion) {
          await this.dialogs.alert({
            title: 'Conclusión pendiente',
            message: `Hay niveles C sin conclusión descriptiva. Complételos antes de guardar.`,
            type: 'warning',
          });
          return;
        }
        items.push({
          matricula_id: est.matricula_id,
          competencia_id: n.competencia_id,
          nivel: c.nivel,
          conclusion: c.conclusion,
        });
      }
    }

    if (items.length === 0) {
      this.snack.open('Sin cambios por guardar', 'Cerrar', { duration: 3000 });
      return;
    }

    this.saving.set(true);
    this.consolidado.guardarBatch(bimestreId, items).subscribe({
      next: (r) => {
        this.saving.set(false);
        this.snack.open(`Se guardaron ${r.guardados} niveles`, 'Cerrar', { duration: 4000 });
        this.cargar();
      },
      error: (e) => {
        this.saving.set(false);
        this.snack.open(extractApiError(e, 'Error al guardar'), 'Cerrar', { duration: 5000 });
      },
    });
  }

  private cargarBimestres(periodoId: number): void {
    this.bimestresSvc.getByPeriodo(periodoId).subscribe({
      next: (b) => {
        this.bimestres.set(b);
        const activo = b.find((x) => x.activo);
        this.fBimestre.setValue(activo?.id ?? null);
      },
      error: (e) => this.snack.open(extractApiError(e, 'Error cargando bimestres'), 'Cerrar', { duration: 4000 }),
    });
  }
}
