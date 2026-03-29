/**
 * @fileoverview Типы данных узлов бота
 *
 * Модуль определяет структуру данных для различных типов узлов графа бота.
 * Включает типы для сообщений, команд, медиа, переходов и других элементов.
 *
 * @module bot-generator/types/node-data.types
 */

import type { Button } from './button-types';

/**
 * Тип клавиатуры для узла
 * 
 * @example
 * const keyboardType: KeyboardType = 'inline';
 */
export type KeyboardType = 'inline' | 'reply' | 'none';

/**
 * Режим форматирования текста
 * 
 * @example
 * const formatMode: FormatMode = 'html';
 */
export type FormatMode = 'html' | 'markdown' | 'none';

/**
 * Тип ввода данных от пользователя
 * 
 * @example
 * const inputType: InputType = 'text';
 */
export type InputType = 
  | 'text'          /** Текстовый ввод */
  | 'photo'         /** Фотография */
  | 'video'         /** Видео */
  | 'audio'         /** Аудио */
  | 'voice'         /** Голосовое сообщение */
  | 'document'      /** Документ */
  | 'sticker'       /** Стикеры */
  | 'contact'       /** Контакт */
  | 'location'      /** Геолокация */
  | 'poll'          /** Опрос */
  | 'dice'          /** Кубик */
  | 'any';         /** Любой тип */

/**
 * Данные узла бота
 *
 * @example
 * const data: NodeData = {
 *   text: 'Привет!',
 *   buttons: [],
 *   keyboardType: 'inline'
 * };
 */
export interface NodeData {
  /** Кнопки узла */
  buttons?: Button[];
  /** Тип клавиатуры */
  keyboardType?: KeyboardType;
  /** ID С‚РѕС‡РєРё РїСЂРёРІСЏР·РєРё keyboard-ноды РІ canvas-РјРѕРґРµР»Рё */
  keyboardNodeId?: string;
  /** Текст сообщения */
  text?: string;
  /** Режим форматирования текста */
  formatMode?: FormatMode;
  /** Использовать Markdown */
  markdown?: boolean;

  /** URL изображения */
  imageUrl?: string;
  /** Переменная URL изображения */
  imageUrlVar?: string;
  /** URL видео */
  videoUrl?: string;
  /** URL аудио */
  audioUrl?: string;
  /** URL документа */
  documentUrl?: string;

  /** Разрешить множественный выбор */
  allowMultipleSelection?: boolean;
  /** Цель для кнопки продолжения */
  continueButtonTarget?: string;

  /** Включить автопереход */
  enableAutoTransition?: boolean;
  /** Цель автоперехода */
  autoTransitionTo?: string;

  /** Собирать ввод пользователя */
  collectUserInput?: boolean;
  /** Тип ввода */
  inputType?: InputType;
  /** Цель ввода */
  inputTargetNodeId?: string;
  /** Пропускать сбор данных */
  skipDataCollection?: boolean;

  /** Команда узла */
  command?: string;
  /** Описание команды */
  description?: string;

  /** Переменные условия */
  conditionalVariables?: Array<{
    variableName: string;
    condition: string;
    value: string;
  }>;

  /** Прикреплённые медиа */
  attachedMedia?: string[];

  // --- Отображение в меню ---
  /** Показывать команду в меню BotFather */
  showInMenu?: boolean;

  // --- Текст и уведомления ---
  /** Текст сообщения (альтернативное поле) */
  messageText?: string;
  /** Отключить уведомление */
  disableNotification?: boolean;

  // --- Синонимы ---
  /** Синонимы для команды/сообщения */
  synonyms?: string[];

  // --- Условные сообщения ---
  /** Включить условные сообщения */
  enableConditionalMessages?: boolean;
  /** Условные сообщения */
  conditionalMessages?: Array<{
    condition?: string;
    message?: string;
    buttons?: Button[];
    [key: string]: unknown;
  }>;
  /** Запасное сообщение */
  fallbackMessage?: string;

  // --- Клавиатура ---
  /** Одноразовая клавиатура */
  oneTimeKeyboard?: boolean;
  /** Изменить размер клавиатуры */
  resizeKeyboard?: boolean;
  /** Раскладка клавиатуры */
  keyboardLayout?: {
    rows?: Array<{ buttonIds?: string[] }>;
    autoLayout?: boolean;
    columns?: number;
  };

  // --- Мультивыбор ---
  /** Переменная для мультивыбора */
  multiSelectVariable?: string;
  /** Текст кнопки продолжения */
  continueButtonText?: string;

  // --- Доступ ---
  /** Только для администраторов */
  adminOnly?: boolean;
  /** Требует авторизации */
  requiresAuth?: boolean;

  // --- Медиа (специфичные типы) ---
  /** URL стикера */
  stickerUrl?: string;
  /** ID файла стикера */
  stickerFileId?: string;
  /** Название набора стикеров */
  stickerSetName?: string;
  /** URL голосового сообщения */
  voiceUrl?: string;
  /** Подпись к медиа */
  mediaCaption?: string;
  /** Длительность медиа */
  mediaDuration?: number;

  // --- Ввод пользователя (расширенный) ---
  /** Переменная для хранения ввода */
  inputVariable?: string;
  /** Добавлять к существующей переменной */
  appendVariable?: boolean;
  /** Включить текстовый ввод */
  enableTextInput?: boolean;
  /** Включить ввод фото */
  enablePhotoInput?: boolean;
  /** Переменная для фото */
  photoInputVariable?: string;
  /** Включить ввод видео */
  enableVideoInput?: boolean;
  /** Переменная для видео */
  videoInputVariable?: string;
  /** Включить ввод аудио */
  enableAudioInput?: boolean;
  /** Переменная для аудио */
  audioInputVariable?: string;
  /** Включить ввод документа */
  enableDocumentInput?: boolean;
  /** Переменная для документа */
  documentInputVariable?: string;
  /** Включить ввод геолокации */
  enableLocationInput?: boolean;
  /** Переменная для геолокации */
  locationInputVariable?: string;
  /** Включить ввод контакта */
  enableContactInput?: boolean;
  /** Переменная для контакта */
  contactInputVariable?: string;
  /** Тип валидации */
  validationType?: string;
  /** Минимальная длина */
  minLength?: number;
  /** Максимальная длина */
  maxLength?: number;
  /** Сообщение при ошибке */
  retryMessage?: string;
  /** Сообщение при успехе */
  successMessage?: string;
  /** Необязательный промпт для отдельного input-узла */
  inputPrompt?: string;
  /** Обязателен ли ответ */
  inputRequired?: boolean;
  /** Сохранять в базу данных */
  saveToDatabase?: boolean;
  /** Тип ответа */
  responseType?: string;
  /** Варианты ответа */
  responseOptions?: Array<{ text: string; target?: string; [key: string]: unknown }>;
  /** Разрешить пропуск */
  allowSkip?: boolean;

  // --- Управление пользователями (mute/ban) ---
  /** ID целевой группы */
  targetGroupId?: string;
  /** Причина */
  reason?: string;
  /** Дата окончания */
  untilDate?: number;
  /** Длительность */
  duration?: number;
  /** Разрешить отправку сообщений */
  canSendMessages?: boolean;
  /** Разрешить отправку медиа */
  canSendMediaMessages?: boolean;
  /** Разрешить отправку опросов */
  canSendPolls?: boolean;
  /** Разрешить отправку других сообщений */
  canSendOtherMessages?: boolean;
  /** Разрешить предпросмотр ссылок */
  canAddWebPagePreviews?: boolean;
  /** Разрешить изменение информации группы */
  canChangeGroupInfo?: boolean;
  /** Разрешить приглашение пользователей (v2) */
  canInviteUsers2?: boolean;
  /** Разрешить закрепление сообщений (v2) */
  canPinMessages2?: boolean;
  /** Разрешить изменение информации */
  canChangeInfo?: boolean;
  /** Разрешить удаление сообщений */
  canDeleteMessages?: boolean;
  /** Разрешить приглашение пользователей */
  canInviteUsers?: boolean;
  /** Разрешить ограничение участников */
  canRestrictMembers?: boolean;
  /** Разрешить закрепление сообщений */
  canPinMessages?: boolean;
  /** Разрешить продвижение участников */
  canPromoteMembers?: boolean;
  /** Разрешить управление видеочатами */
  canManageVideoChats?: boolean;
  /** Разрешить управление темами */
  canManageTopics?: boolean;
  /** Анонимный администратор */
  isAnonymous?: boolean;
}
