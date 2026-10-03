import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { forkJoin } from 'rxjs';
import { AsistenciaService } from './services/asistencia.service';
import { MatriculaService } from '../matriculas/services/matricula.service';
import { CatalogosService } from '../../core/services/catalogos.service';
import { DialogService } from '../../core/services/dialog.service';
import { extractApiError } from '../../core/utils/api-error';
import { Asistencia, BatchAsistenciaItem, EstadoAsistencia } from '../../core/models/asistencia.model';
import { Matricula } from '../../core/models/matricula.model';
import { Seccion } from '../../core/models/seccion.model';
import { Periodo } from '../../core/models/periodo.model';
import { JustificarDialogComponent } from './justificar-dialog.component';
import { BackButtonComponent } from '../../shared/components/back-button.component';

type Celda = '' | EstadoAsistencia;

interface Fila {
  matricula: Matricula;
  celdas: Celda[];
  resumen: Record<EstadoAsistencia, number>;
}

interface MenuCtx {
  f: number;
  d: number;
  x: number;
  y: number;
}

const CICLO: Celda[] = ['presente', 'ausente', 'tardia', 'justificado', ''];
const LETRA: Record<Celda, string> = { presente: 'P', ausente: 'A', tardia: 'T', justificado: 'J', '': '' };

@Component({
  selector: 'app-asistencias-matricial',
  standalone: true,
  imports: [ReactiveFormsModule, MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatSelectModule, MatInputModule, MatProgressSpinnerModule, MatSnackBarModule, MatTooltipModule, BackButtonComponent],
  templateUrl: './asistencias-matricial.component.html',
  styleUrl: './asistencias-matricial.component.scss',
})
export class AsistenciasMatricialComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(AsistenciaService);
  private matriculasSvc = inject(MatriculaService);
  private catalogos = inject(CatalogosService);
  private snack = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private dialogs = inject(DialogService);

  loading = signal(true);
  saving = signal(false);
  periodos = signal<Periodo[]>([]);
  secciones = signal<Seccion[]>([]);
  seccion = signal<Seccion | null>(null);
  mes = signal('');
  dias: { fecha: string; num: number; dow: string }[] = [];
  filas = signal<Fila[]>([]);
  cambios = signal(0);
  foco = signal<{ f: number; d: number } | null>(null);
  menu = signal<MenuCtx | null>(null);

  fPeriodo = new FormControl<number | null>(null);
  fSeccion = new FormControl<number | null>(null);
  fMes = new FormControl<string>(new Date().toISOString().slice(0, 7), { nonNullable: true });

  stats = computed(() => {
    const t = { presente: 0, ausente: 0, tardia: 0, justificado: 0 };
    for (const f of this.filas()) for (const c of f.celdas) if (c) t[c]++;
    return t;
  });
  tituloMes = computed(() => {
    if (!this.mes()) return '';
    const [y, m] = this.mes().split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
  });
  nombreAlumno = (f: Fila): string => {
    const e = f.matricula.estudiante;
    return e ? `${e.apellidos}, ${e.nombres}` : `Matrícula #${f.matricula.id}`;
  };
  letra = (c: Celda): string => LETRA[c];
  guardadoInicial = new Map<string, Asistencia>();
  motivosPendientes = new Map<string, string>();

  ngOnInit(): void {
    forkJoin({ periodos: this.catalogos.getPeriodos(), secciones: this.catalogos.getSecciones() }).subscribe({
      next: ({ periodos, secciones }) => {
        this.periodos.set(periodos);
        this.secciones.set(secciones);
        const activo = periodos.find((p) => p.activo);
        this.fPeriodo.setValue(activo?.id ?? periodos[0]?.id ?? null);
        const q = this.route.snapshot.queryParamMap;
        const sid = Number(q.get('seccion_id'));
        const mes = q.get('mes');
        if (sid) this.fSeccion.setValue(sid);
        if (mes && /^\d{4}-\d{2}$/.test(mes)) this.fMes.setValue(mes);
        if (this.fSeccion.value) {
          this.cargar();
        } else {
          this.loading.set(false);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.snack.open(extractApiError(err, 'No se pudieron cargar los filtros'), 'Cerrar', { duration: 4000 });
      },
    });
  }

  aplicarFiltros(): void {
    const sid = this.fSeccion.value;
    const mes = this.fMes.value;
    this.router.navigate([], { queryParams: sid ? { seccion_id: sid, mes } : {}, replaceUrl: true });
    if (sid && mes) {
      this.cargar();
    } else {
      this.seccion.set(null);
      this.filas.set([]);
      this.cambios.set(0);
    }
  }

  private cargar(): void {
    const seccionId = this.fSeccion.value!;
    const mes = this.fMes.value;
    this.mes.set(mes);
    this.loading.set(true);
    this.cerrarMenu();
    const [y, m] = mes.split('-').map(Number);
    const n = new Date(y, m, 0).getDate();
    const dows = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
    this.dias = Array.from({ length: n }, (_, i) => ({
      fecha: `${mes}-${String(i + 1).padStart(2, '0')}`,
      num: i + 1,
      dow: dows[new Date(y, m - 1, i + 1).getDay()],
    }));
    forkJoin({
      asistencias: this.service.getAll({ seccion_id: seccionId, desde: `${mes}-01`, hasta: `${mes}-${n}` }),
      matriculas: this.matriculasSvc.getAll(),
    }).subscribe({
      next: ({ asistencias, matriculas }) => {
        const s = this.secciones().find((x) => x.id === seccionId) ?? null;
        this.seccion.set(s);
        this.guardadoInicial.clear();
        this.motivosPendientes.clear();
        for (const a of asistencias) this.guardadoInicial.set(`${a.matricula_id}|${a.fecha}`, a);
        const porMat = new Map<number, Asistencia[]>();
        for (const a of asistencias) {
          const l = porMat.get(a.matricula_id) ?? [];
          l.push(a);
          porMat.set(a.matricula_id, l);
        }
        this.filas.set(
          matriculas
            .filter((mt) => mt.seccion_id === seccionId)
            .sort((a, b) => (a.estudiante?.apellidos ?? '').localeCompare(b.estudiante?.apellidos ?? ''))
            .map((matricula) => this.aFila(matricula, porMat.get(matricula.id) ?? []))
        );
        this.recontar();
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.snack.open(extractApiError(err, 'No se pudo cargar la grilla'), 'Cerrar', { duration: 4000 });
      },
    });
  }

  private aFila(matricula: Matricula, regs: Asistencia[]): Fila {
    const resumen: Record<EstadoAsistencia, number> = { presente: 0, ausente: 0, tardia: 0, justificado: 0 };
    const celdas: Celda[] = this.dias.map((d) => {
      const r = regs.find((x) => x.fecha === d.fecha);
      const c: Celda = r ? r.estado : '';
      if (c) resumen[c]++;
      return c;
    });
    return { matricula, celdas, resumen };
  }

  private marcar(f: number, d: number, valor: Celda): void {
    this.filas.update((filas) => {
      const fila = filas[f];
      const ant = fila.celdas[d];
      if (ant === valor) return filas;
      const celdas = [...fila.celdas];
      celdas[d] = valor;
      const resumen = { ...fila.resumen };
      if (ant) resumen[ant]--;
      if (valor) resumen[valor]++;
      const nf = [...filas];
      nf[f] = { ...fila, celdas, resumen };
      return nf;
    });
    this.recontar();
  }

  private recontar(): void {
    let n = 0;
    this.filas().forEach((f) => {
      this.dias.forEach((d, di) => {
        const key = `${f.matricula.id}|${d.fecha}`;
        const orig: Celda = this.guardadoInicial.get(key)?.estado ?? '';
        if (f.celdas[di] !== orig) n++;
      });
    });
    this.cambios.set(n);
  }

  ciclar(f: number, d: number, reversa: boolean): void {
    const actual = this.filas()[f].celdas[d];
    const i = CICLO.indexOf(actual);
    this.marcar(f, d, CICLO[(i + (reversa ? CICLO.length - 1 : 1)) % CICLO.length]);
  }

  jPendiente(f: number, d: number): boolean {
    const fila = this.filas()[f];
    if (fila.celdas[d] !== 'justificado') return false;
    const key = `${fila.matricula.id}|${this.dias[d].fecha}`;
    return !(this.motivosPendientes.get(key) ?? this.guardadoInicial.get(key)?.motivo_justificacion);
  }

  private contarJPendientes(): number {
    let n = 0;
    this.filas().forEach((_, fi) => {
      this.dias.forEach((_, di) => {
        if (this.jPendiente(fi, di)) n++;
      });
    });
    return n;
  }

  abrirJustificar(f: number, d: number): void {
    const fila = this.filas()[f];
    const key = `${fila.matricula.id}|${this.dias[d].fecha}`;
    const orig = this.guardadoInicial.get(key);
    const ref = this.dialog.open(JustificarDialogComponent, {
      width: '420px',
      data: { alumno: this.nombreAlumno(fila), fecha: this.dias[d].fecha, motivo: this.motivosPendientes.get(key) ?? orig?.motivo_justificacion ?? '' },
    });
    ref.afterClosed().subscribe((motivo: string | undefined) => {
      if (motivo === undefined) return;
      if (!motivo.trim()) {
        this.snack.open('El motivo es obligatorio para justificar', 'Cerrar', { duration: 3000 });
        return;
      }
      this.marcar(f, d, 'justificado');
      this.motivosPendientes.set(key, motivo.trim());
      this.recontar();
    });
  }

  abrirMenu(f: number, d: number, x: number, y: number): void {
    this.foco.set({ f, d });
    this.menu.set({
      f, d,
      x: Math.min(x, window.innerWidth - 240),
      y: Math.min(y, window.innerHeight - 280),
    });
  }

  cerrarMenu(): void {
    this.menu.set(null);
  }

  opcionMenu(valor: Celda): void {
    const m = this.menu();
    if (!m) return;
    this.cerrarMenu();
    if (valor === 'justificado') {
      this.abrirJustificar(m.f, m.d);
      return;
    }
    this.marcar(m.f, m.d, valor);
  }

  menuKey(ev: KeyboardEvent): void {
    if (ev.key === 'Escape') {
      this.cerrarMenu();
      ev.stopPropagation();
      return;
    }
    if (ev.key !== 'ArrowDown' && ev.key !== 'ArrowUp') return;
    ev.preventDefault();
    const btns = Array.from(document.querySelectorAll<HTMLButtonElement>('.menu-ctx .menu-opcion'));
    if (!btns.length) return;
    const i = btns.indexOf(document.activeElement as HTMLButtonElement);
    const sig = ev.key === 'ArrowDown' ? (i + 1) % btns.length : (i - 1 + btns.length) % btns.length;
    btns[sig].focus();
  }

  onKey(f: number, d: number, ev: KeyboardEvent): void {
    if (ev.key === 'F10' && ev.shiftKey) {
      const el = document.querySelector<HTMLElement>(`[data-celda="${f}-${d}"]`);
      const r = el?.getBoundingClientRect();
      this.abrirMenu(f, d, (r?.left ?? 0) + 20, (r?.bottom ?? 0) + 4);
      ev.preventDefault();
      return;
    }
    const maxF = this.filas().length - 1;
    const maxD = this.dias.length - 1;
    let nf = f;
    let nd = d;
    switch (ev.key) {
      case 'ArrowUp': nf = Math.max(0, f - 1); break;
      case 'ArrowDown': nf = Math.min(maxF, f + 1); break;
      case 'ArrowLeft': nd = Math.max(0, d - 1); break;
      case 'ArrowRight': nd = Math.min(maxD, d + 1); break;
      case 'Enter':
        if (ev.shiftKey) {
          const el = document.querySelector<HTMLElement>(`[data-celda="${f}-${d}"]`);
          const r = el?.getBoundingClientRect();
          this.abrirMenu(f, d, (r?.left ?? 0) + 20, (r?.bottom ?? 0) + 4);
        } else {
          this.ciclar(f, d, false);
        }
        ev.preventDefault();
        return;
      case ' ':
        if (ev.shiftKey) {
          const el = document.querySelector<HTMLElement>(`[data-celda="${f}-${d}"]`);
          const r = el?.getBoundingClientRect();
          this.abrirMenu(f, d, (r?.left ?? 0) + 20, (r?.bottom ?? 0) + 4);
        } else {
          this.ciclar(f, d, false);
        }
        ev.preventDefault();
        return;
      case 'm':
      case 'M': this.abrirJustificar(f, d); return;
      default: return;
    }
    ev.preventDefault();
    this.foco.set({ f: nf, d: nd });
    document.querySelector<HTMLElement>(`[data-celda="${nf}-${nd}"]`)?.focus();
  }

  async guardar(): Promise<void> {
    if (!this.cambios() || this.saving()) return;
    const pendientes = this.contarJPendientes();
    if (pendientes) {
      await this.dialogs.alert({
        title: 'Justificativos pendientes',
        message: `Hay ${pendientes} celda(s) marcada(s) como Justificado sin motivo. Haz clic derecho sobre cada una y registra el motivo antes de guardar.`,
        type: 'warning',
      });
      return;
    }
    const items: BatchAsistenciaItem[] = [];
    this.filas().forEach((f) => {
      this.dias.forEach((d, di) => {
        const key = `${f.matricula.id}|${d.fecha}`;
        const orig = this.guardadoInicial.get(key);
        const actual = f.celdas[di];
        const origVal: Celda = orig?.estado ?? '';
        if (actual === origVal) return;
        if (actual === '') return;
        items.push({
          matricula_id: f.matricula.id,
          fecha: d.fecha,
          estado: actual,
          motivo_justificacion: actual === 'justificado' ? (this.motivosPendientes.get(key) ?? orig?.motivo_justificacion ?? '') : null,
        });
      });
    });
    if (!items.length) {
      this.snack.open('Sin cambios por guardar', 'Cerrar', { duration: 3000 });
      return;
    }
    this.saving.set(true);
    this.service.guardarBatch(items).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.snack.open(`Se guardaron ${res.creados + res.actualizados} (C ${res.creados}, M ${res.actualizados})`, 'Cerrar', { duration: 4000 });
        this.guardadoInicial.clear();
        this.motivosPendientes.clear();
        this.service.getAll({ seccion_id: this.seccion()!.id, desde: `${this.mes()}-01`, hasta: this.dias[this.dias.length - 1].fecha }).subscribe({
          next: (asistencias) => {
            for (const a of asistencias) this.guardadoInicial.set(`${a.matricula_id}|${a.fecha}`, a);
            this.filas.update((filas) =>
              filas.map((f) => {
                const regs = asistencias.filter((a) => a.matricula_id === f.matricula.id);
                return this.aFila(f.matricula, regs);
              })
            );
            this.recontar();
          },
        });
      },
      error: (err) => {
        this.saving.set(false);
        this.snack.open(extractApiError(err, 'No se pudo guardar'), 'Cerrar', { duration: 5000 });
      },
    });
  }

  async exportarExcel(): Promise<void> {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SIGEL-EGA';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Asistencia', {
      pageSetup: { orientation: 'landscape', fitToPage: true },
    });
    sheet.views = [{ state: 'frozen', ySplit: 1 }];

    const head = ['DNI', 'Apellidos y nombres', ...this.dias.map((d) => `${d.num}/${d.dow}`), 'P', 'A', 'T', 'J'];
    sheet.addRow(head);

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    // Fill por celda (no a nivel de fila): el estilo de fila no siempre se
    // propaga a todas las celdas al abrir en LibreOffice/Excel.
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E3A8A' },
      };
    });
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

    const fills: Record<string, string> = {
      P: 'FF22C55E', // verde: presente
      A: 'FFEF4444', // rojo: ausente
      T: 'FFEAB308', // amarillo: tardía
      J: 'FF3B82F6', // azul: justificado
    };

    for (const f of this.filas()) {
      const row = sheet.addRow([
        f.matricula.estudiante?.dni ?? '',
        this.nombreAlumno(f),
        ...f.celdas.map((c) => this.letra(c)),
        f.resumen.presente, f.resumen.ausente, f.resumen.tardia, f.resumen.justificado,
      ]);
      row.eachCell((cell, colNumber) => {
        if (colNumber <= 2) return;
        const letra = String(cell.value ?? '');
        const argb = fills[letra];
        if (argb) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb } };
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });
    }

    sheet.columns = [
      { width: 12 }, { width: 32 },
      ...this.dias.map(() => ({ width: 7 })),
      { width: 5 }, { width: 5 }, { width: 5 }, { width: 5 },
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asistencia_${this.seccion()?.id}_${this.mes()}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async exportarPdf(): Promise<void> {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(14);
    doc.text('I.E. Pública EGA — Registro de asistencia', 14, 14);
    doc.setFontSize(10);
    doc.text(`${this.seccion()?.grado?.nombre ?? ''} ${this.seccion()?.nombre ?? ''} — ${this.tituloMes()}`, 14, 21);
    let y = 30;
    doc.setFontSize(8);
    for (const f of this.filas()) {
      const linea = `${f.matricula.estudiante?.dni ?? ''}  ${this.nombreAlumno(f)}  P:${f.resumen.presente} A:${f.resumen.ausente} T:${f.resumen.tardia} J:${f.resumen.justificado}`;
      doc.text(linea, 14, y);
      y += 6;
      if (y > 190) { doc.addPage(); y = 15; }
    }
    doc.save(`asistencia_${this.seccion()?.id}_${this.mes()}.pdf`);
  }
}
