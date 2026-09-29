import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  icon?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 max-w-md">
      <div class="flex items-start gap-4">
        <div [class]="iconBgClass()" class="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
          <mat-icon [class]="iconColorClass()">{{ iconName() }}</mat-icon>
        </div>
        <div class="flex-1">
          <h2 mat-dialog-title class="!m-0 !p-0 text-lg font-semibold text-slate-900">{{ data.title }}</h2>
          <p class="text-sm text-slate-600 mt-2 leading-relaxed">{{ data.message }}</p>
        </div>
      </div>

      <div mat-dialog-actions class="!m-0 !p-0 flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
        <button mat-stroked-button (click)="close(false)" class="!rounded-lg !h-10">
          {{ data.cancelText || 'Cancelar' }}
        </button>
        <button
          mat-flat-button
          [class]="confirmBtnClass()"
          (click)="close(true)"
          cdkFocusInitial
          class="!rounded-lg !h-10 !text-white"
        >
          {{ data.confirmText || 'Confirmar' }}
        </button>
      </div>
    </div>
  `,
})
export class ConfirmDialogComponent {
  protected readonly data: ConfirmDialogData = inject(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);

  close(result: boolean): void {
    this.dialogRef.close(result);
  }

  iconName(): string {
    if (this.data.icon) return this.data.icon;
    const map: Record<string, string> = {
      danger: 'warning',
      warning: 'warning_amber',
      info: 'info',
      success: 'check_circle',
    };
    return map[this.data.type ?? 'info'] ?? 'info';
  }

  iconBgClass(): string {
    const map: Record<string, string> = {
      danger: 'bg-red-100',
      warning: 'bg-amber-100',
      info: 'bg-blue-100',
      success: 'bg-emerald-100',
    };
    return map[this.data.type ?? 'info'] ?? 'bg-blue-100';
  }

  iconColorClass(): string {
    const map: Record<string, string> = {
      danger: '!text-red-600',
      warning: '!text-amber-600',
      info: '!text-blue-600',
      success: '!text-emerald-600',
    };
    return map[this.data.type ?? 'info'] ?? '!text-blue-600';
  }

  confirmBtnClass(): string {
    const map: Record<string, string> = {
      danger: '!bg-red-600 hover:!bg-red-700',
      warning: '!bg-amber-600 hover:!bg-amber-700',
      info: '!bg-sigel-primary hover:!bg-sigel-primary-dark',
      success: '!bg-emerald-600 hover:!bg-emerald-700',
    };
    return map[this.data.type ?? 'info'] ?? '';
  }
}
