/**
 * @fileoverview Zod схема для валидации параметров триггера участника
 * @module templates/member-trigger/member-trigger.schema
 */

import { z } from 'zod';

/**
 * Схема одного триггера входа/выхода участника.
 * Поля nodeId, targetNodeId, targetNodeType — обязательные.
 */
const memberTriggerEntrySchema = z.object({
  /** ID узла member_trigger */
  nodeId: z.string(),
  /** ID целевого узла */
  targetNodeId: z.string(),
  /** Тип целевого узла */
  targetNodeType: z.string(),
  /** Тип события: join, leave или both */
  memberEventType: z.enum(['join', 'leave', 'both']),
  /** ID группы для фильтрации */
  groupChatId: z.string().optional(),
  /** Источник ID группы */
  groupChatIdSource: z.enum(['manual', 'variable']),
  /** Имя переменной с ID группы */
  groupChatVariableName: z.string().optional(),
  /** Переменная для user.id вошедшего участника */
  saveJoinedUserIdTo: z.string().optional(),
  /** Переменная для username вошедшего участника */
  saveJoinedUsernameTo: z.string().optional(),
  /** Переменная для user.id вышедшего участника */
  saveLeftUserIdTo: z.string().optional(),
  /** Переменная для username вышедшего участника */
  saveLeftUsernameTo: z.string().optional(),
  /** Применять ли фильтр по ID группы */
  hasGroupChatFilter: z.boolean(),
});

/**
 * Схема параметров шаблона триггера участника
 */
export const memberTriggerParamsSchema = z.object({
  /** Массив триггеров входа/выхода участника */
  entries: z.array(memberTriggerEntrySchema),
});

export type MemberTriggerParams = z.infer<typeof memberTriggerParamsSchema>;
