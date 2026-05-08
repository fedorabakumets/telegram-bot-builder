/**
 * @fileoverview Типы клиентской части панели рассылок
 * @module client/components/editor/broadcast/types
 */

export type {
  Broadcast,
  BroadcastResult,
  BroadcastFilters,
} from '@shared/schema';

/**
 * WS-событие прогресса рассылки (broadcast-progress)
 */
export interface BroadcastProgressEvent {
  /** Тип события */
  type: 'broadcast-progress';
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор рассылки */
  broadcastId: number;
  /** Количество отправленных сообщений */
  sentCount: number;
  /** Количество доставленных сообщений */
  deliveredCount: number;
  /** Количество ошибок */
  failedCount: number;
  /** Всего получателей */
  totalCount: number;
  /** Текущий статус рассылки */
  status: 'running' | 'stopped' | 'done';
}

/**
 * Пропсы главной панели рассылок
 */
export interface BroadcastPanelProps {
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор выбранного токена (опционально) */
  selectedTokenId?: number | null;
}

/**
 * Данные формы wizard создания рассылки
 */
export interface NewBroadcastFormData {
  /** Название рассылки */
  name: string;
  /** HTML-текст сообщения */
  messageText: string;
  /** Фильтры аудитории */
  filters: {
    /** Тип аудитории */
    audienceType: 'all' | 'tags' | 'date' | 'activity';
    /** Теги для фильтрации */
    tags?: string[];
    /** Дата регистрации от (ISO) */
    registeredFrom?: string;
    /** Дата регистрации до (ISO) */
    registeredTo?: string;
    /** Последняя активность от (ISO) */
    activeFrom?: string;
    /** Последняя активность до (ISO) */
    activeTo?: string;
  };
}
