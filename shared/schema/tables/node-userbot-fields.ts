/** @fileoverview Поля узлов Telethon, сохраняемые в данных сценария. */
import { z } from 'zod';

/** Настройки отправки сообщений, нажатия кнопок и триггера юзербота. */
export const nodeUserbotFields = z.object({
  /** Чат или пользователь юзербота. */
  userbotEntity: z.string().optional(),
  /** Источник идентификатора получателя. */
  userbotEntitySource: z.string().optional(),
  /** Переменная с идентификатором получателя. */
  userbotEntityVariable: z.string().optional(),
  /** Список получателей сообщения. */
  userbotRecipients: z.array(z.string()).optional(),
  /** Идентификатор сообщения для нажатия кнопки. */
  messageId: z.string().optional(),
  /** Способ поиска кнопки. */
  clickMode: z.enum(['text', 'data', 'index']).optional(),
  /** Способ выполнения нажатия. */
  clickDelivery: z.enum(['fire_and_forget', 'await']).optional(),
  /** Текст, callback_data или индекс кнопки. */
  clickValue: z.string().optional(),
  /** Стратегия выбора или ожидания ответа. */
  responseStrategy: z.enum(['first', 'longest', 'regex_match', 'last', 'edit', 'new_message']).optional(),
  /** Время ожидания ответа в секундах. */
  responseWaitSeconds: z.number().optional(),
  /** Регулярное выражение для ответа. */
  responseFilterRegex: z.string().optional(),
  /** Переменная с нижней границей ID ответа. */
  responseFloorMessageIdVar: z.string().optional(),
  /** Переменная для сообщения alert. */
  saveAlertTo: z.string().optional(),
  /** Переменная для кнопок ответа. */
  saveButtonsTo: z.string().optional(),
  /** Переменная для признака наличия медиа. */
  saveHasMediaTo: z.string().optional(),
  /** Переменная для полученного медиа. */
  saveMediaTo: z.string().optional(),
  /** Переменная для идентификатора ответа. */
  saveResponseIdTo: z.string().optional(),
  /** Переменная для текста ответа. */
  saveResponseTextTo: z.string().optional(),
  /** Имя бота для inline-запроса. */
  botUsername: z.string().optional(),
  /** Чат для отправки результата inline-запроса. */
  targetChat: z.string().optional(),
  /** Отправлять результат в чат с исходным ботом. */
  sendToSameChat: z.boolean().optional(),
  /** Индекс результата inline-запроса. */
  resultIndex: z.string().optional(),
  /** Переменная для заголовка результата. */
  saveResultTitleTo: z.string().optional(),
  /** Переменная для описания результата. */
  saveResultDescTo: z.string().optional(),
  /** Способ фильтрации редактируемых сообщений. */
  filterType: z.enum(['any', 'contains', 'regex']).optional(),
  /** Значение фильтра редактируемых сообщений. */
  filterValue: z.string().optional(),
  /** Переменная для текста отредактированного сообщения. */
  saveTextTo: z.string().optional(),
  /** Переменная для идентификатора чата. */
  saveChatIdTo: z.string().optional(),
  /** Переменная для идентификатора отправителя. */
  saveSenderIdTo: z.string().optional(),
});
