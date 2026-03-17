/**
 * @fileoverview Zod схема для валидации параметров шаблона navigate-to-node
 * @module templates/navigation/navigate-to-node.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров навигации к узлу (параметры не нужны — функция статическая) */
export const navigateToNodeParamsSchema = z.object({});

export type NavigateToNodeParams = z.infer<typeof navigateToNodeParamsSchema>;
