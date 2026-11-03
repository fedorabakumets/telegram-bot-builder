/** @fileoverview Разрешённые редактируемые метаданные файла без пути и владельца. */
import { z } from 'zod';
/** Безопасное частичное изменение подписи и тегов файла. */
export const updateMediaMetadataSchema = z.object({
  /** Описание файла. */
  description: z.string().max(4000).nullable().optional(),
  /** Метки файла. */
  tags: z.array(z.string().max(100)).max(50).optional(),
  /** Публичность файла, если это поддерживает хранилище. */
  isPublic: z.union([z.literal(0), z.literal(1)]).optional(),
}).strict();
