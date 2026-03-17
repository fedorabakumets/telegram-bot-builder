/**
 * @fileoverview Параметры для шаблона сбора пользовательского ввода
 * @module templates/user-input/user-input.params
 */

/** Тип валидации вводимых данных */
export type InputValidationType = 'none' | 'email' | 'phone' | 'number';

/** Тип ожидаемого ввода */
export type InputType = 'text' | 'button';

/** Параметры для генерации блока waiting_for_input */
export interface UserInputTemplateParams {
  /** ID узла */
  nodeId: string;
  /** Безопасное имя (safe_name от nodeId) */
  safeName: string;

  // --- Переменная ---
  /** Имя переменной для сохранения ответа */
  inputVariable: string;
  /** Режим добавления (не перезаписывать) */
  appendVariable?: boolean;

  // --- Навигация ---
  /** ID следующего узла после ввода */
  inputTargetNodeId?: string;

  // --- Тип ввода ---
  /** Основной тип ввода: text (по умолчанию) или button */
  inputType?: InputType;

  // --- Типы ввода (медиа) ---
  /** Принимать текстовый ввод */
  enableTextInput?: boolean;
  /** Принимать фото */
  enablePhotoInput?: boolean;
  /** Переменная для фото */
  photoInputVariable?: string;
  /** Принимать видео */
  enableVideoInput?: boolean;
  /** Переменная для видео */
  videoInputVariable?: string;
  /** Принимать аудио */
  enableAudioInput?: boolean;
  /** Переменная для аудио */
  audioInputVariable?: string;
  /** Принимать документы */
  enableDocumentInput?: boolean;
  /** Переменная для документов */
  documentInputVariable?: string;

  // --- Кнопки пропуска ---
  /** Кнопки skipDataCollection: [{text, target}] */
  skipButtons?: Array<{ text: string; target: string }>;

  // --- Валидация ---
  /** Тип валидации */
  validationType?: InputValidationType;
  /** Минимальная длина текста (0 = без ограничений) */
  minLength?: number;
  /** Максимальная длина текста (0 = без ограничений) */
  maxLength?: number;

  // --- Сообщения ---
  /** Сообщение при ошибке валидации */
  retryMessage?: string;
  /** Сообщение при успешном сохранении */
  successMessage?: string;

  // --- Сохранение ---
  /** Сохранять в базу данных */
  saveToDatabase?: boolean;
}
