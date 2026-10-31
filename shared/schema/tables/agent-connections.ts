/** @fileoverview Постоянные подключения доверенного Telegram-агента. */
import { pgTable, serial, text, bigint, boolean, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { telegramUsers } from './telegram-users';

/** Связь агента с профилем; отключение запрещает повторную автоматическую выдачу PAT. */
export const agentConnections = pgTable('agent_connections', {
  /** Идентификатор подключения */
  id: serial('id').primaryKey(),
  /** Идентификатор доверенного агента */
  agentId: text('agent_id').notNull(),
  /** Telegram ID владельца */
  ownerId: bigint('owner_id', { mode: 'number' }).notNull().references(() => telegramUsers.id, { onDelete: 'cascade' }),
  /** Разрешена ли выдача доступа */
  enabled: boolean('enabled').notNull().default(true),
  /** Время создания */
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  /** Время изменения */
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  /** Один профиль на доверенного агента */
  agentOwner: uniqueIndex('agent_connections_agent_owner_idx').on(table.agentId, table.ownerId),
}));
