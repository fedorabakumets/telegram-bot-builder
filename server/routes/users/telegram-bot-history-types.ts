/** @fileoverview Безопасные контракты постоянного журнала проверок ботов. */
import type { TelegramBotCheckResult } from '@shared/telegram-bot-check';
/** Сохранённая проверка без секретов и служебной аренды процесса. */
export interface BotHistoryRun {
  /** Номер запуска. */ id: number;
  /** Разрешённый проект. */ projectId: number;
  /** Снимок названия проекта. */ projectName: string | null;
  /** Выбранный бот либо весь проект. */ scopeTokenId: number | null;
  /** Снимок названия выбранного бота. */ scopeName: string | null;
  /** Состояние выполнения. */ status: 'running' | 'completed' | 'failed';
  /** Время создания. */ createdAt: string;
  /** Время запуска. */ startedAt: string;
  /** Время последнего сохранения. */ updatedAt: string;
  /** Время завершения. */ finishedAt: string | null;
  /** Безопасная причина остановки. */ failureReason: string | null;
  /** Размер области. */ total: number;
  /** Уже сохранённые результаты. */ result: TelegramBotCheckResult;
}
/** Данные резервирования области до обращения к Telegram. */
export interface CreateBotHistoryRun {
  /** Проект. */ projectId: number;
  /** Снимок названия проекта. */ projectName?: string | null;
  /** Выбранный бот либо весь проект. */ scopeTokenId: number | null;
  /** Снимок названия бота. */ scopeName?: string | null;
  /** Владелец аренды. */ workerId: string;
  /** Только безопасные подписи ботов. */ tokens: Array<{
    /** Исторический номер. */ id: number;
    /** Снимок названия. */ name: string;
    /** Снимок публичного имени. */ botUsername?: string | null;
  }>;
}
/** Пересечение областей уже выполняющейся проверки. */
export class BotHistoryConflictError extends Error {
  /** HTTP-код без раскрытия чужих данных. */ readonly status = 409;
  /** Создаёт понятную ошибку занятой области. */
  constructor() { super('Для части выбранных ботов уже выполняется проверка'); }
}
/** Аренда переживает максимальное ожидание одного метода и обновляется worker. */
export const BOT_HISTORY_LEASE_SECONDS = 60;
