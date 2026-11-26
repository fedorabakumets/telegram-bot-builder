/** @fileoverview Таблицы проектных Telegram-аккаунтов и привязок ботов. */
import { boolean, foreignKey, index, integer, jsonb, pgTable, serial, text, timestamp, unique } from 'drizzle-orm/pg-core';
import type { ProjectTelegramAccountProxy, ProjectTelegramSessionKind } from '../../project-telegram-accounts';
import { botProjects } from './bot-projects';
import { botTokens } from './bot-tokens';

/** Telegram-аккаунты, принадлежащие проекту. */
export const projectTelegramAccounts = pgTable('project_telegram_accounts', {
  /** Уникальный идентификатор аккаунта. */
  id: serial('id').primaryKey(),
  /** Проект, которому принадлежит аккаунт. */
  projectId: integer('project_id').references(() => botProjects.id, { onDelete: 'cascade' }).notNull(),
  /** Название карточки аккаунта. */
  name: text('name').notNull(),
  /** Телефон, маскированный для интерфейса. */
  maskedPhone: text('masked_phone'),
  /** Идентификатор аккаунта Telegram в строковом виде. */
  telegramUserId: text('telegram_user_id'),
  /** Имя аккаунта Telegram. */
  telegramName: text('telegram_name'),
  /** Имя пользователя Telegram. */
  telegramUsername: text('telegram_username'),
  /** Способ подключения сессии. */
  sessionKind: text('session_kind').$type<ProjectTelegramSessionKind>(),
  /** Зашифрованный набор параметров доступа к Telegram. */
  sessionSecret: text('session_secret'),
  /** Отпечаток ключа сессии для предотвращения повторного импорта. */
  sessionFingerprint: text('session_fingerprint'),
  /** Telegram подтвердил, что сохранённая сессия авторизована. */
  sessionVerified: boolean('session_verified').notNull().default(false),
  /** Сведения о прокси, которые отображаются пользователю. */
  proxy: jsonb('proxy').$type<ProjectTelegramAccountProxy>(),
  /** Зашифрованные параметры входа в прокси. */
  proxySecret: text('proxy_secret'),
  /** Дата создания карточки. */
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  /** Дата изменения карточки. */
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [
  unique('project_telegram_accounts_project_id_id').on(table.projectId, table.id),
  unique('project_telegram_accounts_session_fingerprint').on(table.sessionFingerprint),
]);

/** Связь нескольких ботов с одним аккаунтом внутри проекта. */
export const projectTelegramAccountBots = pgTable('project_telegram_account_bots', {
  /** Токен может быть привязан только к одному аккаунту. */
  botTokenId: integer('bot_token_id').primaryKey(),
  /** Проект, общий для токена и аккаунта. */
  projectId: integer('project_id').notNull(),
  /** Аккаунт, который использует бот. */
  accountId: integer('account_id').notNull(),
}, table => [
  foreignKey({
    name: 'project_telegram_account_bots_project_account_fk',
    columns: [table.projectId, table.accountId],
    foreignColumns: [projectTelegramAccounts.projectId, projectTelegramAccounts.id],
  }).onDelete('cascade'),
  foreignKey({
    name: 'project_telegram_account_bots_project_token_fk',
    columns: [table.projectId, table.botTokenId],
    foreignColumns: [botTokens.projectId, botTokens.id],
  }).onDelete('cascade'),
  index('project_telegram_account_bots_project_account_idx').on(table.projectId, table.accountId),
]);
