/**
 * @fileoverview Параметры для шаблона reply-hide-after-click
 * @module templates/handlers/reply-hide-after-click/reply-hide-after-click.params
 */

import type { Node } from '@shared/schema';

/** Кнопка с флагом hideAfterClick */
export interface HideAfterClickButton {
  text: string;
  nodeId: string;
}

/** Параметры для генерации кода обработки hideAfterClick */
export interface ReplyHideAfterClickTemplateParams {
  /** Все узлы для поиска кнопок с флагом hideAfterClick */
  nodes: Node[];
  /** Уровень отступа */
  indentLevel?: string;
}
