/**
 * @fileoverview Параметры для шаблона рассылки Bot API
 * @module templates/broadcast-bot/broadcast-bot.params
 */

/** Узел сообщения для рассылки */
export interface BroadcastNode {
  // --- Идентификация ---
  /** ID узла */
  id: string;

  // --- Контент ---
  /** Текст сообщения */
  text: string;
  /** Режим форматирования */
  formatMode?: string;

  // --- Медиа ---
  /** URL изображения */
  imageUrl?: string;
  /** URL аудио */
  audioUrl?: string;
  /** URL видео */
  videoUrl?: string;
  /** URL документа */
  documentUrl?: string;
  /** Прикреплённые медиафайлы */
  attachedMedia?: string[];

  // --- Автопереход ---
  /** ID узла для автоперехода (FakeCallbackQuery) */
  autoTransitionTo?: string;
}

/** Параметры для генерации обработчика рассылки Bot API */
export interface BroadcastBotTemplateParams {
  // --- Идентификация ---
  /** Уникальный идентификатор узла */
  nodeId: string;

  // --- Источник ---
  /** Источник ID: 'user_ids', 'bot_users', 'both' */
  idSourceType?: 'user_ids' | 'bot_users' | 'both';

  // --- Сообщения ---
  /** Сообщение об успехе */
  successMessage?: string;
  /** Сообщение об ошибке */
  errorMessage?: string;
  /** Список узлов сообщений для рассылки */
  broadcastNodes?: BroadcastNode[];
}
