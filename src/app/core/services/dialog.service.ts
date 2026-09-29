import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { AlertDialogComponent, AlertDialogData } from '../../shared/dialogs/alert-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/dialogs/confirm-dialog.component';
import { PromptDialogComponent, PromptDialogData } from '../../shared/dialogs/prompt-dialog.component';

@Injectable({ providedIn: 'root' })
export class DialogService {
  private dialog = inject(MatDialog);

  /**
   * Muestra una alerta informativa. Retorna Promise<void> cuando se cierra.
   */
  async alert(data: AlertDialogData): Promise<void> {
    const ref = this.dialog.open(AlertDialogComponent, {
      data,
      panelClass: 'sigel-dialog',
      disableClose: false,
      autoFocus: true,
      restoreFocus: true,
      maxWidth: '95vw',
    });
    await firstValueFrom(ref.afterClosed());
  }

  /**
   * Muestra una confirmación (sí/no). Retorna Promise<boolean>.
   * - true: el usuario confirmó.
   * - false: el usuario canceló.
   */
  async confirm(data: ConfirmDialogData): Promise<boolean> {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data,
      panelClass: 'sigel-dialog',
      disableClose: false,
      autoFocus: true,
      restoreFocus: true,
      maxWidth: '95vw',
    });
    const result = await firstValueFrom(ref.afterClosed());
    return result === true;
  }

  /**
   * Muestra un input simple. Retorna Promise<string | null>.
   * - string: el usuario aceptó con ese valor.
   * - null: el usuario canceló.
   */
  async prompt(data: PromptDialogData): Promise<string | null> {
    const ref = this.dialog.open(PromptDialogComponent, {
      data,
      panelClass: 'sigel-dialog',
      disableClose: false,
      autoFocus: true,
      restoreFocus: true,
      width: data.width ?? '480px',
      maxWidth: '95vw',
    });
    return await firstValueFrom(ref.afterClosed());
  }

  /**
   * Atajos semánticos para casos comunes.
   */
  async error(message: string, title = 'Error'): Promise<void> {
    await this.alert({ title, message, type: 'error' });
  }

  async success(message: string, title = 'Exito'): Promise<void> {
    await this.alert({ title, message, type: 'success' });
  }

  async deleteConfirm(itemName: string): Promise<boolean> {
    return this.confirm({
      title: 'Confirmar eliminacion',
      message: `Estas seguro de que quieres eliminar "${itemName}"? Esta accion no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
      icon: 'delete',
    });
  }
}
