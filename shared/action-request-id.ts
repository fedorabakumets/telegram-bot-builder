/** @fileoverview Общий идентификатор повторяемого внешнего действия HTTP и MCP. */
import { z } from 'zod';
/** Идентификатор одной попытки; повтор с другим содержимым запрещён. */
export const actionRequestIdSchema = z.string().uuid();
/** Необязательный идентификатор для совместимости старых HTTP-клиентов. */
export const optionalActionRequestIdSchema = actionRequestIdSchema.optional();
