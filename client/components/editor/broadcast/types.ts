/**
 * @fileoverview Типы клиентской части панели рассылок
 * @module client/components/editor/broadcast/types
 */

export type {
  Broadcast,
  BroadcastResult,
  BroadcastFilters,
  BroadcastCampaign,
  BroadcastCampaignStatus,
} from '@shared/schema';

import type { Button } from '@shared/schema';

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
  /** Идентификатор большой рассылки, если рассылка идёт по нескольким ботам */
  campaignId?: number;
  /** Количество отправленных сообщений */
  sentCount: number;
  /** Количество доставленных сообщений */
  deliveredCount: number;
  /** Количество ошибок (прочие, не блокировка и не удалённый аккаунт) */
  failedCount: number;
  /** Заблокировали бота */
  blockedCount: number;
  /** Аккаунт удалён / недоступен */
  deletedCount: number;
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
  /** Обработчик выбора токена */
  onSelectToken?: (tokenId: number | null) => void;
  /** Список всех проектов для переключателя */
  allProjects?: Array<{ id: number; name: string }>;
  /** Обработчик смены проекта */
  onProjectChange?: (projectId: number) => void;
}

/**
 * Данные формы wizard создания рассылки
 */
export interface NewBroadcastFormData {
  /** Название рассылки (необязательно; пустое → дата + начало текста) */
  name: string;
  /** HTML-текст сообщения */
  messageText: string;
  /** URL прикреплённых медиафайлов */
  mediaUrls: string[];
  /** Инлайн-кнопки сообщения рассылки */
  buttons?: Button[];
  /** Кол-во кнопок в ряду (0 = все в один ряд) */
  buttonsPerRow?: number;
  /** Идентификаторы ботов, от имени которых уйдёт рассылка */
  tokenIds: number[];
  /** Группы по ботам: tokenId → Telegram chat_id[] */
  groupsByTokenId?: Record<number, string[]>;
  /** Фильтры аудитории */
  filters: {
    /** Тип аудитории */
    audienceType: 'all' | 'tags' | 'date' | 'activity' | 'manual';
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
    /** Массив userId выбранных вручную пользователей */
    userIds?: string[];
    /** Массив groupId (Telegram chat_id) — режим одного бота / legacy */
    groupIds?: string[];
  };
}
