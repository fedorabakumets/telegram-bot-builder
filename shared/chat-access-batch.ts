/** @fileoverview Сводная проверка личных чатов всех ботов проекта без секретов. */
import type { ChatAccessCheckJobView, ChatAccessCheckStatus } from './project-sync/project-event';
/** Сохранённая группа параллельных проверок с отдельной очередью каждого бота. */
export interface ChatAccessBatch {
  /** Номер группы. */ id: number;
  /** Разрешённый проект. */ projectId: number;
  /** Состояние всей группы. */ status: ChatAccessCheckStatus;
  /** Отдельные задачи ботов с собственными счётчиками. */ jobs: ChatAccessCheckJobView[];
}
