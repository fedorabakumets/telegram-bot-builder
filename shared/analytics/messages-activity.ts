/**
 * @fileoverview Общие расчёты активности сообщений для интерфейса и инструментов аналитики.
 */

import { calculateCumulativeGrowth, type UsersGrowthPoint } from './users-growth';

/** Точка активности с разбивкой по направлению сообщения. */
export interface MessagesActivityPoint {
  /** Начало временного интервала в формате ISO. */
  date: string;
  /** Сообщения с типом user. */
  incoming: number;
  /** Сообщения с любым типом, кроме user, как в дневных агрегатах. */
  outgoing: number;
}

/** Сводка активности за выбранное окно и текущих сохранённых сообщений. */
export interface MessagesActivitySummary {
  /** Число сообщений, которые сейчас сохранены, с учётом очистки истории. */
  totalMessages: number;
  /** Число сообщений в выбранных временных интервалах. */
  periodMessages: number;
  /** Число входящих сообщений за период. */
  incomingMessages: number;
  /** Число исходящих сообщений за период. */
  outgoingMessages: number;
  /** Среднее число сохранённых сообщений на текущую запись пользователя бота. */
  averagePerUser: number;
}

/**
 * Преобразует направления в обычные серии для графика, сохраняя нулевые интервалы.
 * @param points - Исходные точки активности.
 * @returns Серии входящих, исходящих и всех сообщений.
 */
export function getMessagesActivitySeries(points: MessagesActivityPoint[]): {
  /** Серия входящих сообщений. */
  incomingPoints: UsersGrowthPoint[];
  /** Серия исходящих сообщений. */
  outgoingPoints: UsersGrowthPoint[];
  /** Серия всех сообщений. */
  totalPoints: UsersGrowthPoint[];
} {
  return {
    incomingPoints: points.map(point => ({ date: point.date, count: point.incoming })),
    outgoingPoints: points.map(point => ({ date: point.date, count: point.outgoing })),
    totalPoints: points.map(point => ({ date: point.date, count: point.incoming + point.outgoing })),
  };
}

/**
 * Рассчитывает сводку без смешивания сохранённой истории и дневных агрегатов.
 * @param points - Точки направлений за выбранное окно.
 * @param totalMessages - Число сейчас сохранённых сообщений.
 * @param totalUsers - Число текущих записей пользователей выбранных ботов.
 * @returns Сводка активности; при отсутствии пользователей среднее равно нулю.
 */
export function getMessagesActivitySummary(
  points: MessagesActivityPoint[], totalMessages: number, totalUsers: number,
): MessagesActivitySummary {
  const incomingMessages = points.reduce((sum, point) => sum + point.incoming, 0);
  const outgoingMessages = points.reduce((sum, point) => sum + point.outgoing, 0);
  return {
    totalMessages, incomingMessages, outgoingMessages,
    periodMessages: incomingMessages + outgoingMessages,
    averagePerUser: totalUsers > 0 ? totalMessages / totalUsers : 0,
  };
}

/**
 * Рассчитывает накопление каждого направления от нуля внутри выбранного периода.
 * @param points - Исходные точки направлений.
 * @returns Отсортированные точки с нарастающими итогами без изменения исходных данных.
 */
export function calculateCumulativeMessages(points: MessagesActivityPoint[]): MessagesActivityPoint[] {
  const { incomingPoints, outgoingPoints } = getMessagesActivitySeries(points);
  const incoming = calculateCumulativeGrowth(incomingPoints);
  const outgoing = calculateCumulativeGrowth(outgoingPoints);
  return incoming.map((point, index) => ({
    date: point.date, incoming: point.count, outgoing: outgoing[index].count,
  }));
}
