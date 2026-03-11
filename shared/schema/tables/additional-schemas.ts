/**
 * @fileoverview Дополнительные схемы
 * @module shared/schema/tables/additional-schemas
 */

import { z } from "zod";
import type { Node } from "./node-schema";

/** Компонент для drag-and-drop */
export interface ComponentDefinition {
  /** Уникальный идентификатор */
  id: string;
  /** Тип узла */
  type: Node['type'];
  /** Название */
  name: string;
  /** Описание */
  description: string;
  /** Иконка */
  icon: string;
  /** Цвет */
  color: string;
  /** Данные по умолчанию */
  defaultData?: any;
  [key: string]: any;
}

/** Схема для отправки сообщения пользователю из панели администратора */
export const sendMessageSchema = z.object({
  /** Текст сообщения */
  messageText: z.string().min(1, "Message text is required").max(4096, "Message text is too long"),
  /** ID узла для отправки */
  nodeId: z.string().optional(),
  /** Данные пользователя для замены переменных */
  userData: z.record(z.unknown()).optional(),
});

/** Тип для отправки сообщения */
export type SendMessage = z.infer<typeof sendMessageSchema>;
