/**
 * @fileoverview Типы и интерфейсы для InlineRichEditor
 * @description Содержит основные типы для редактора текста с форматированием
 */

/** Тип медиа: "photo", "video", "audio", "document", "sticker" */
type MediaType = 'photo' | 'video' | 'audio' | 'document' | 'sticker';

/** Тип узла: "user-input", "start", "command", "system", "conditional", "callback_trigger" */
type NodeType = 'user-input' | 'start' | 'command' | 'system' | 'conditional' | 'callback_trigger';

/**
 * Интерфейс для описания переменной, доступной в редакторе
 */
export interface Variable {
  /** Имя переменной */
  name: string;
  /** Идентификатор узла, к которому относится переменная */
  nodeId: string;
  /** Тип узла */
  nodeType: NodeType;
  /** Описание переменной (опционально) */
  description?: string;
  /** Тип медиа для медиапеременных */
  mediaType?: MediaType;
  /** Таблица-источник для системных переменных */
  sourceTable?: string;
  /** Все узлы, где используется эта переменная */
  nodeIds?: string[];
}

/** Режим форматирования текста */
export type FormatMode = 'html' | 'markdown' | 'none';

/**
 * Свойства компонента InlineRichEditor
 */
export interface InlineRichEditorProps {
  /** Текущее значение редактора */
  value: string;
  /** Функция обратного вызова при изменении значения */
  onChange: (value: string) => void;
  /** Текст-заполнитель для пустого редактора */
  placeholder?: string;
  /** Включить поддержку Markdown */
  enableMarkdown?: boolean;
  /** Функция обратного вызова при изменении режима форматирования */
  onFormatModeChange?: (formatMode: FormatMode) => void;
  /** Массив доступных переменных для вставки */
  availableVariables?: Variable[];
  /** Функция обратного вызова при выборе медиапеременной */
  onMediaVariableSelect?: (variableName: string, mediaType: string) => void;
}
