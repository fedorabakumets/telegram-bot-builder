/** @fileoverview Типизированные команды ботов к Telegram-аккаунту проекта. */
import { z } from 'zod';

const target = z.union([
  z.number().int().safe().refine(value => value !== 0),
  z.string().trim().min(1).max(256),
]);
const messageId = z.number().int().min(1).max(2_147_483_647);
const empty = z.object({}).strict();

/** Список операций, которые раннер может выполнить от имени привязанного аккаунта. */
export const projectTelegramExecutionSchema = z.discriminatedUnion('operation', [
  /** Длинное чтение журнала настоящих событий общего клиента без опроса истории. */
  z.object({ operation: z.literal('events_poll'), args: z.object({
    targets: z.array(target).max(30), resolve_targets: z.array(target).max(30).optional(),
    after: z.number().int().safe().nonnegative(),
    wait_seconds: z.number().finite().min(0).max(20),
  }).strict() }).strict(),
  z.object({ operation: z.literal('status'), args: empty }).strict(),
  z.object({ operation: z.literal('get_me'), args: empty }).strict(),
  /** Чтение inline-предложений не выбирает результат и не отправляет его в чат. */
  z.object({ operation: z.literal('inline_query'), args: z.object({
    bot: target, query: z.string().max(256),
  }).strict() }).strict(),
  z.object({
    operation: z.literal('send_message'),
    args: z.object({
      target,
      text: z.string().min(1).max(4096),
      parse_mode: z.enum(['html', 'md']).nullable(),
      link_preview: z.boolean(),
      wait_seconds: z.number().finite().min(0).max(25).optional(),
      response_target: target.optional(),
    }).strict(),
  }).strict(),
  z.object({
    operation: z.literal('get_messages'),
    args: z.object({
      target,
      ids: messageId.optional(),
      limit: z.number().int().min(1).max(30).optional(),
      wait_seconds: z.number().finite().min(0).max(25).optional(),
      after_id: z.number().int().min(0).max(2_147_483_647).optional(),
    }).strict(),
  }).strict(),
  z.object({
    operation: z.literal('click_button'),
    args: z.object({
      target,
      message_id: messageId,
      data_b64: z.string().min(4).max(88).regex(/^[A-Za-z0-9+/]+={0,2}$/),
      wait_seconds: z.number().finite().min(0).max(25).optional(),
      response_mode: z.enum(['new_message', 'edited_message']).optional(),
    }).strict(),
  }).strict(),
  z.object({
    operation: z.literal('inline_send'),
    args: z.object({
      bot: target,
      query: z.string().max(256),
      target,
      index: z.number().int().min(0).max(1000),
    }).strict(),
  }).strict(),
]);

/** Команда раннера к привязанному аккаунту после проверки формата. */
export type ProjectTelegramExecution = z.infer<typeof projectTelegramExecutionSchema>;
