/**
 * @fileoverview Параметры для шаблона hideAfterClick
 * @module templates/hide-after-click/hide-after-click.params
 */

/** Одна кнопка с флагом hideAfterClick */
export interface HideAfterClickButton {
  /** ID кнопки */
  id?: string;
  /** Текст кнопки */
  text?: string;
  /** Цель кнопки */
  target?: string;
}

/** Параметры для генерации обработчика hideAfterClick */
export interface HideAfterClickParams {
  /** Кнопки с флагом hideAfterClick */
  buttons: HideAfterClickButton[];
}
