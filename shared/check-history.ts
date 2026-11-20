/** @fileoverview Публичная история проверок Telegram без секретных токенов и сырых ответов. */
import type { ChatAccessCheckJobView, ChatAccessCheckStatus } from './project-sync/project-event';
import type { TelegramBotCheckItem } from './telegram-bot-check';
/** Два вида сохраняемых проверок. */
export type CheckHistoryKind = 'private-chats' | 'telegram-bots';
/** Снимок подписи участника проверки. */
export interface CheckHistoryBot {
  /** Идентификатор записи бота. */ tokenId: number;
  /** Имя на момент запуска. */ name: string;
  /** Публичный username на момент запуска. */ username: string | null;
}
/** Область запуска не меняется при фильтрации истории по одному боту. */
export interface CheckHistoryScope {
  /** Общая либо выбранная область. */ mode: 'all_bots' | 'selected_bot';
  /** Выбранный бот, иначе null. */ tokenId: number | null;
  /** Название проекта на момент запуска. */ projectName?: string;
  /** Снимок имени выбранного бота для компактного списка. */ name?: string | null;
  /** Снимок username выбранного бота для компактного списка. */ username?: string | null;
  /** Подписи участников в деталях; список истории может их не включать. */ bots?: CheckHistoryBot[];
}
/** Счётчики личных чатов считают пары бот–чат, а не уникальных людей проекта. */
export interface PrivateChatHistorySummary {
  /** Единица подсчёта. */ unit: 'bot_chats';
  /** Всего ботов. */ botsTotal: number;
  /** Завершившие работу боты. */ botsFinished: number;
  /** Размер очереди. */ total: number;
  /** Проверено пар бот–чат. */ processed: number;
  /** Доступные чаты. */ available: number;
  /** Пользователи заблокировали бота. */ blocked: number;
  /** Удалённые аккаунты. */ deleted: number;
  /** Ошибки проверок. */ errors: number;
}
/** Итоги проверки самих ботов. */
export interface BotHistorySummary {
  /** Единица подсчёта. */ unit: 'bots';
  /** Всего ботов. */ total: number;
  /** Получено результатов. */ processed: number;
  /** Проверка пройдена. */ available: number;
  /** Заморожены Telegram. */ frozen: number;
  /** Недействительные токены. */ invalidToken: number;
  /** Прочие подтверждённые ограничения. */ otherUnavailable: number;
  /** Неопределённые результаты. */ errors: number;
}
/** Общие метаданные сохранённого запуска. */
export interface CheckHistoryBase {
  /** Составной публичный идентификатор запуска. */ id: string;
  /** Разрешённый проект. */ projectId: number;
  /** Состояние очереди, а не доступность проверенных объектов. */ status: ChatAccessCheckStatus;
  /** Время создания, ISO UTC. */ createdAt: string;
  /** Время начала, ISO UTC. */ startedAt: string | null;
  /** Время завершения, ISO UTC. */ finishedAt: string | null;
  /** Неизменяемая область запуска. */ scope: CheckHistoryScope;
  /** Безопасная машинная причина остановки. */ failureReason?: string | null;
}
/** Карточка истории с различимым по виду содержимым счётчиков. */
export type CheckHistoryEntry = CheckHistoryBase & (
  { /** Вид проверки. */ kind: 'private-chats'; /** Итоги личных чатов. */ summary: PrivateChatHistorySummary }
  | { /** Вид проверки. */ kind: 'telegram-bots'; /** Итоги ботов. */ summary: BotHistorySummary }
);
/** Страница истории от новых запусков к старым. */
export interface CheckHistoryPage {
  /** Запуски страницы. */ items: CheckHistoryEntry[];
  /** Непрозрачный курсор следующей страницы. */ nextCursor: string | null;
}
/** Подробности сохранённого запуска; произвольные ответы Telegram сюда не попадают. */
export interface CheckHistoryDetail {
  /** Сводка выбранного запуска. */ run: CheckHistoryEntry;
  /** Подробности по ботам выбранной проверки. */ details: {
    /** Задачи проверки личных чатов и безопасная причина их остановки. */ jobs?: Array<ChatAccessCheckJobView & { /** Машинная причина остановки задачи. */ failureReason?: string | null }>;
    /** Ответы проверки самих ботов. */ items?: TelegramBotCheckItem[];
  };
}
