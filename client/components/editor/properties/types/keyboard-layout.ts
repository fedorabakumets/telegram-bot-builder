/**
 * @fileoverview Типы для раскладки клавиатуры
 * @module components/editor/properties/types/keyboard-layout
 */

/** Конфигурация одного ряда клавиатуры */
export interface KeyboardRow {
  /** Массив ID кнопок в ряду */
  buttonIds: string[];
}

/** Раскладка клавиатуры */
export interface KeyboardLayout {
  /** Массив рядов кнопок */
  rows: KeyboardRow[];
  /** Количество колонок (1-6) */
  columns: number;
  /** Использовать автоматическую раскладку */
  autoLayout: boolean;
}

/** Пресет раскладки клавиатуры */
export interface KeyboardPreset {
  /** Название пресета */
  name: string;
  /** Количество колонок */
  columns: number;
  /** Описание пресета */
  description: string;
}

/** Конфигурация динамических кнопок */
export interface DynamicButtonsConfig {
  [key: string]: unknown;
  /** Имя переменной с HTTP-ответом */
  sourceVariable: string;
  /** Путь к массиву внутри ответа */
  arrayPath: string;
  /** Шаблон текста кнопки, например {name} */
  textTemplate: string;
  /** Шаблон callback_data, например project_{id} */
  callbackTemplate: string;
  /** Источник стиля кнопки */
  styleMode: 'field' | 'template' | 'none';
  /** Поле для стиля кнопки, когда styleMode=field */
  styleField: string;
  /** Шаблон стиля кнопки, когда styleMode=template */
  styleTemplate: string;
  /** Количество колонок (1-6) */
  columns: number;
  /** Legacy alias for backward compatibility */
  variable?: string;
  /** Legacy alias for backward compatibility */
  arrayField?: string;
  /** Legacy alias for backward compatibility */
  textField?: string;
  /** Legacy alias for backward compatibility */
  callbackField?: string;
}
