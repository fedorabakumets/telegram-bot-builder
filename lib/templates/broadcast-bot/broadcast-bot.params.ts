/**
 * @fileoverview Параметры для шаблона рассылки Bot API
 * @module templates/broadcast-bot/broadcast-bot.params
 */

/** Узел сообщения для рассылки */
export interface BroadcastNode {
  id: string;
  text: string;
  formatMode?: string;
  imageUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
  documentUrl?: string;
  attachedMedia?: string[];
  autoTransitionTo?: string;
}

/** Параметры для генерации обработчика рассылки Bot API */
export interface BroadcastBotTemplateParams {
  /** Уникальный идентификатор узла */
  nodeId: string;
  /** Источник ID: 'user_ids', 'bot_users', 'both' */
  idSourceType?: 'user_ids' | 'bot_users' | 'both';
  /** Сообщение об успехе */
  successMessage?: string;
  /** Сообщение об ошибке */
  errorMessage?: string;
  /** Список узлов сообщений для рассылки */
  broadcastNodes?: BroadcastNode[];
}
