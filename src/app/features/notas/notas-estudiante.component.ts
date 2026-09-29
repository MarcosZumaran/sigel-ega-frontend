import { Component, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { EstudianteService } from '../estudiantes/services/estudiante.service';
import { MatriculaService } from '../matriculas/services/matricula.service';
import { CalificacionService } from './services/calificacion.service';
import { BimestreService } from './services/bimestre.service';
import { extractApiError } from '../../core/utils/api-error';
import { notaANivel } from '../../core/utils/ministerio-equivalencia';
import { BackButtonComponent } from '../../shared/components/back-button.component';
import type { Estudiante } from '../../core/models/estudiante.model';
import type { Calificacion, NivelLogro } from '../../core/models/calificacion.model';
import type { Bimestre } from '../../core/models/bimestre.model';

const NIVEL_NUM: Record<string, number> = { AD: 4, A: 3, B: 2, C: 1 };

interface BimestreCard {
  id: number;
  num: number;
  nombre: string;
  activo: boolean;
  nivel: NivelLogro | null;
  evaluadas: number;
  total: number;
  fecha_inicio: string | null;
  fecha_fin: string | null;
}

@Component({
  selector: 'app-notas-estudiante',
  standalone: true,
  imports: [
    RouterLink, DatePipe, MatCardModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatProgressBarModule, MatSnackBarModule, BackButtonComponent,
  ],
  templateUrl: './notas-estudiante.component.html',
  styleUrl: './notas-estudiante.component.scss',
})
export class NotasEstudianteComponent implements OnInit {
  estudiante = signal<Estudiante | null>(null);
  cards = signal<BimestreCard[]>([]);
  loading = signal(true);

  private estudianteId = 0;

  constructor(
    private route: ActivatedRoute,
    private estudiantes: EstudianteService,
    private matriculasSvc: MatriculaService,
    private califs: CalificacionService,
    private bimestres: BimestreService,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.estudianteId = Number(this.route.snapshot.paramMap.get('estudianteId'));
    this.loading.set(true);
    forkJoin({
      est: this.estudiantes.getById(this.estudianteId),
      mats: this.matriculasSvc.getAll(),
      califs: this.califs.getAll(),
    }).subscribe({
      next: ({ est, mats, califs }) => {
        this.estudiante.set(est);
        const periodoId =
          est.matricula_activa?.periodo_id ??
          mats.find((m) => m.estudiante_id === est.id)?.periodo_id;
        this.bimestres.getByPeriodo(periodoId).subscribe({
          next: (bims) => this.buildCards(est, mats, califs, bims),
          error: () => this.buildCards(est, mats, califs, []),
        });
      },
      error: (err) => {
        this.loading.set(false);
        this.snack.open(extractApiError(err, 'No se pudo cargar el estudiante'), 'Cerrar', { duration: 4000 });
      },
    });
  }

  private buildCards(
    est: Estudiante,
    mats: { id: number; estudiante_id: number }[],
    califs: Calificacion[],
    bims: Bimestre[]
  ): void {
    const matIds = new Set(mats.filter((m) => m.estudiante_id === est.id).map((m) => m.id));
    this.cards.set(
      bims.map((b) => {
        const propias = califs.filter(
          (c: Calificacion) => matIds.has(c.matricula_id) && c.bimestre_id === b.id
        );
        const evaluadas = new Set(propias.map((c: Calificacion) => c.area_id)).size;
        return {
          id: b.id,
          num: b.numero,
          nombre: b.nombre,
          activo: b.activo,
          nivel: this.nivelGeneral(propias),
          evaluadas,
          total: evaluadas,
          fecha_inicio: b.fecha_inicio ?? null,
          fecha_fin: b.fecha_fin ?? null,
        };
      })
    );
    this.loading.set(false);
  }

  private nivelGeneral(califs: Calificacion[]): NivelLogro | null {
    if (!califs.length) return null;
    const vals = califs.map((c) => NIVEL_NUM[c.nivel_logro ?? notaANivel(c.nota ?? 0)] ?? 0).filter((v) => v > 0);
    if (!vals.length) return null;
    return notaANivel(Math.round((vals.reduce((a, b) => a + b, 0) / vals.length / 4) * 20));
  }

  nombreCompleto(): string {
    const e = this.estudiante();
    return e ? `${e.nombres} ${e.apellidos}` : '';
  }
}
