/**
 * @fileoverview Параметры для шаблона safe_edit_or_send
 * @module templates/safe-edit-or-send/safe-edit-or-send.params
 */

/** Параметры для генерации функции safe_edit_or_send */
export interface SafeEditOrSendTemplateParams {
  /** Есть ли inline кнопки или специальные узлы */
  hasInlineButtonsOrSpecialNodes?: boolean;
  /** Есть ли автопереходы */
  hasAutoTransitions?: boolean;
}
