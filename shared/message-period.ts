/** @fileoverview Проверяемые границы периода сообщений с явным часовым поясом. */
import { z } from 'zod';

/** Поля периода сообщений, применяемые совместно к списку чатов и совпадениям. */
export const messagePeriodFields = {
  /** Нижняя граница времени сообщения включительно. */
  messageFrom: z.string().datetime({ offset: true }).optional(),
  /** Верхняя граница времени сообщения включительно. */
  messageTo: z.string().datetime({ offset: true }).optional(),
};
/** Период с проверкой порядка границ. */
export const messagePeriodSchema = z.object(messagePeriodFields).refine(value =>
  !value.messageFrom || !value.messageTo || Date.parse(value.messageFrom) <= Date.parse(value.messageTo),
{ message: 'Дата «С» должна быть раньше даты «По»' });
/** Проверенный период сообщений. */
export type MessagePeriod = z.infer<typeof messagePeriodSchema>;
