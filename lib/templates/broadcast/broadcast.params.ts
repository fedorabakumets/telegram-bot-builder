/**
 * @fileoverview Параметры для шаблона рассылки
 * @module templates/broadcast/broadcast.params
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

/** Параметры для генерации обработчика рассылки */
export interface BroadcastTemplateParams {
  /** Уникальный идентификатор узла */
  nodeId: string;
  /** Тип API: 'bot' или 'client' */
  broadcastApiType?: 'bot' | 'client';
  /** Источник ID: 'user_ids', 'bot_users', 'both' */
  idSourceType?: 'user_ids' | 'bot_users' | 'both';
  /** Сообщение об успехе */
  successMessage?: string;
  /** Сообщение об ошибке */
  errorMessage?: string;
  /** Список узлов сообщений для рассылки (предварительно собранных из графа) */
  broadcastNodes?: BroadcastNode[];
  // Устаревшие поля — оставлены для обратной совместимости
  broadcastTargetNode?: string;
  enableBroadcast?: boolean;
  enableConfirmation?: boolean;
  confirmationText?: string;
  messageText?: string;
}
