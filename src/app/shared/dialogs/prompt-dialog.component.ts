import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface PromptDialogData {
  title: string;
  message?: string;
  label?: string;
  placeholder?: string;
  initialValue?: string;
  required?: boolean;
  confirmText?: string;
  cancelText?: string;
  subtitle?: string;
  multiline?: boolean;
  rows?: number;
  width?: string;
}

@Component({
  selector: 'app-prompt-dialog',
  standalone: true,
  imports: [FormsModule, MatDialogModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 max-w-md">
      <h2 mat-dialog-title class="!m-0 !p-0 text-lg font-semibold text-slate-900">{{ data.title }}</h2>
      @if (data.subtitle) {
        <p class="text-sm font-medium text-sigel-primary mt-1">{{ data.subtitle }}</p>
      }
      @if (data.message) {
        <p class="text-sm text-slate-600 mt-2">{{ data.message }}</p>
      }

      <mat-dialog-content class="!m-0 !p-0">
        <mat-form-field appearance="outline" class="w-full mt-4">
          @if (data.label) {
            <mat-label>{{ data.label }}</mat-label>
          }
          @if (data.multiline) {
            <textarea
              matInput
              [(ngModel)]="value"
              [placeholder]="data.placeholder ?? ''"
              [required]="data.required ?? false"
              [rows]="data.rows ?? 4"
              class="!min-h-[120px]"
              cdkFocusInitial
            ></textarea>
          } @else {
            <input
              matInput
              [(ngModel)]="value"
              [placeholder]="data.placeholder ?? ''"
              [required]="data.required ?? false"
              cdkFocusInitial
            />
          }
        </mat-form-field>
      </mat-dialog-content>

      <div mat-dialog-actions class="!m-0 !p-0 flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
        <button mat-stroked-button (click)="close(null)" class="!rounded-lg !h-10">
          {{ data.cancelText || 'Cancelar' }}
        </button>
        <button
          mat-flat-button
          [disabled]="(data.required ?? false) && !value"
          (click)="close(value)"
          class="!rounded-lg !h-10 !bg-sigel-primary hover:!bg-sigel-primary-dark !text-white"
        >
          {{ data.confirmText || 'Aceptar' }}
        </button>
      </div>
    </div>
  `,
})
export class PromptDialogComponent {
  protected readonly data: PromptDialogData = inject(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<PromptDialogComponent>);

  value: string = this.data.initialValue ?? '';

  close(result: string | null): void {
    this.dialogRef.close(result);
  }
}
