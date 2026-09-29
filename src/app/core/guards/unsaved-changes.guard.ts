import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { DialogService } from '../services/dialog.service';

/**
 * Interfaz opcional: si el componente la implementa, se le preguntará
 * antes de salir. Si no la implementa, se permite la navegación sin preguntar.
 */
export interface ComponentCanDeactivate {
  canDeactivate: () => boolean | Promise<boolean>;
}

/**
 * Guard que verifica si el componente tiene cambios sin guardar.
 * Acepta tanto `canDeactivate()` como `hasUnsavedChanges()` porque los
 * formularios del proyecto exponen `hasUnsavedChanges()`.
 * Si el componente no implementa ninguna, permite la navegación (no bloquea).
 * Nunca bloquea por error interno.
 */
export const unsavedChangesGuard: CanDeactivateFn<unknown> = async (component) => {
  const candidate = component as Partial<ComponentCanDeactivate> & {
    hasUnsavedChanges?: () => boolean | Promise<boolean>;
  };

  const check =
    typeof candidate?.canDeactivate === 'function'
      ? candidate.canDeactivate.bind(candidate)
      : typeof candidate?.hasUnsavedChanges === 'function'
        ? candidate.hasUnsavedChanges.bind(candidate)
        : null;

  // Sin método de verificación: permitir navegación.
  if (!check) {
    return true;
  }

  try {
    const dirty = await check();
    if (!dirty) {
      return true;
    }
    const dialogs = inject(DialogService);
    return await dialogs.confirm({
      title: 'Cambios sin guardar',
      message: 'Tienes cambios sin guardar. Estas seguro de que quieres salir?',
      confirmText: 'Salir sin guardar',
      cancelText: 'Quedarme',
      type: 'warning',
    });
  } catch (error) {
    console.error('Error en verificación de cambios sin guardar:', error);
    // En caso de error, permitir navegación para no bloquear al usuario.
    return true;
  }
};
