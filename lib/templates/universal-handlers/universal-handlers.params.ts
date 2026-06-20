/**
 * @fileoverview Параметры для шаблона универсальных обработчиков
 * @module templates/universal-handlers/universal-handlers.params
 */

import type { NodeItem } from '../handle-user-input/handle-user-input.params';

/** Параметры для генерации универсальных обработчиков */
export interface UniversalHandlersTemplateParams {
  /** Включена ли база данных пользователей */
  userDatabaseEnabled?: boolean;
  /** Все узлы бота */
  nodes?: NodeItem[];
  /** Узлы с командами (start/command) */
  commandNodes?: NodeItem[];
  /** Есть ли URL кнопки в проекте */
  hasUrlButtons?: boolean;
  /** Есть ли в проекте хотя бы одна кнопка с skipDataCollection=true */
  hasSkipDataCollectionButtons?: boolean;
  /** Все ID узлов */
  allNodeIds?: string[];
  /**
   * Генерировать catch-all обработчики (handle_unhandled_message,
   * handle_unhandled_photo, fallback_callback_handler). По умолчанию true.
   * При false эти обработчики не попадают в сгенерированный код.
   */
  generateCatchAll?: boolean;
}
