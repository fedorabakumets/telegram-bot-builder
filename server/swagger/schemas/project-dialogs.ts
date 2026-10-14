/** @fileoverview Публичный формат списка диалогов и сохранённых состояний доступа. */
import { z } from 'zod';

/** Описание одного известного панели диалога. */
export const ProjectDialogSchema = z.object({
  /** Идентификатор Telegram, включая отрицательные значения. */
  chat_id: z.string(),
  /** Тип чата. */
  chat_type: z.enum(['private', 'group', 'supergroup', 'channel']),
  /** Сохранённое название или полное имя. */
  title: z.string().nullable(),
  /** Название для показа, при отсутствии названия — ID. */
  display_name: z.string(),
  /** Сохранённое имя пользователя или публичной группы. */
  username: z.string().nullable(),
  /** Последняя активность в UTC. */
  last_activity_at: z.string().datetime().nullable(),
  /** Последнее сообщение; отсутствует у пользователей без истории. */
  last_message: z.object({
    /** Превью текста не длиннее 200 символов. */
    preview: z.string().max(200),
    /** Направление сообщения. */
    direction: z.enum(['incoming', 'outgoing']),
    /** Время сохранения сообщения в UTC. */
    created_at: z.string().datetime().nullable(),
  }).nullable(),
  /** Количество сообщений, ещё находящихся в сохранённой истории. */
  retained_message_count: z.number().int().nonnegative(),
  /** Последний результат проверки, без нового обращения к Telegram. */
  access_status: z.enum(['unknown', 'available', 'kicked', 'error']),
  /** Время последней проверки или отсутствие проверки. */
  access_checked_at: z.string().datetime().nullable(),
});

/** Ответ страницы диалогов. */
export const ProjectDialogsResponseSchema = z.object({
  /** Признак успешного чтения. */
  ok: z.literal(true),
  /** Идентификатор проекта. */
  project_id: z.number().int().positive(),
  /** Идентификатор выбранного токена. */
  token_id: z.number().int().positive(),
  /** Диалоги в порядке последней активности. */
  dialogs: z.array(ProjectDialogSchema),
  /** Наличие следующей страницы. */
  has_more: z.boolean(),
  /** Непрозрачный курсор продолжения. */
  next_cursor: z.string().nullable(),
});
