/**
 * @fileoverview Zod схема для валидации параметров шаблона animation-handler
 * @module templates/animation-handler/animation-handler.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров шага анимации */
export const animationHandlerParamsSchema = z.object({
  /** URL анимации (GIF) или путь /uploads/ */
  animationUrl: z.string().optional(),
  /** ID узла */
  nodeId: z.string().optional(),
  /** Уровень отступа (совместимость, в шаблон не подставляется) */
  indentLevel: z.string().optional(),
  /** Флаг: animationUrl является локальным путём /uploads/ */
  isLocalAnimationUrl: z.boolean().optional(),
  /** Подпись к GIF */
  mediaCaption: z.string().optional(),
  /** ID следующего узла автоперехода */
  autoTransitionTo: z.string().optional(),
});

export type AnimationHandlerParams = z.infer<typeof animationHandlerParamsSchema>;
