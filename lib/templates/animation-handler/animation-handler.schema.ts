/**
 * @fileoverview Zod схема для валидации параметров шаблона animation-handler
 * @module templates/animation-handler/animation-handler.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров обработчика анимации */
export const animationHandlerParamsSchema = z.object({
  /** URL анимации (GIF) */
  animationUrl: z.string().optional(),
  /** ID узла */
  nodeId: z.string().optional(),
  /** Уровень отступа */
  indentLevel: z.string().optional(),
  /** Флаг: animationUrl является локальным путём /uploads/ */
  isLocalAnimationUrl: z.boolean().optional(),
});

export type AnimationHandlerParams = z.infer<typeof animationHandlerParamsSchema>;
