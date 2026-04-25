/**
 * @fileoverview Параметры для шаблона обработчиков узла edit_message
 * @module templates/edit-message/edit-message.params
 */

/**
 * Один узел edit_message
 */
export interface EditMessageEntry {
  /** ID узла edit_message */
  nodeId: string;
  /** ID следующего узла */
  targetNodeId: string;
  /** Тип следующего узла */
  targetNodeType: string;
  /** Режим редактирования: 'text' | 'markup' | 'both' */
  editMode: string;
  /** Новый текст сообщения (поддерживает {var}) */
  editMessageText: string;
  /** Режим форматирования: 'html' | 'markdown' | 'none' */
  editFormatMode: string;
  /** Источник ID сообщения: 'last_bot_message' | 'custom' */
  editMessageIdSource: string;
  /** ID сообщения вручную или {переменная} */
  editMessageIdManual: string;
  /** Режим клавиатуры: 'keep' | 'remove' | 'node' */
  editKeyboardMode: string;
  /** ID keyboard-узла (если editKeyboardMode === 'node') */
  editKeyboardNodeId: string;
  /** Кнопки keyboard-узла (предварительно разрешённые из графа) */
  keyboardButtons?: Array<{
    /** ID кнопки */
    id: string;
    /** Текст кнопки */
    text: string;
    /** Действие: goto, url и т.д. */
    action: string;
    /** Целевой узел */
    target?: string;
    /** URL для url-кнопок */
    url?: string;
    /** Кастомный callback_data */
    customCallbackData?: string;
    /** Стиль кнопки */
    style?: string;
  }>;
  /** Конфигурация динамических кнопок keyboard-узла */
  keyboardDynamicButtons?: {
    /** Имя переменной с данными */
    sourceVariable: string;
    /** Путь к массиву */
    arrayPath: string;
    /** Шаблон текста */
    textTemplate: string;
    /** Шаблон callback */
    callbackTemplate: string;
    /** Количество колонок */
    columns: number;
  } | null;
  /** Включены ли динамические кнопки */
  keyboardEnableDynamicButtons?: boolean;
}

/**
 * Параметры для генерации обработчиков узла edit_message
 */
export interface EditMessageTemplateParams {
  /** Массив узлов edit_message */
  entries: EditMessageEntry[];
}
