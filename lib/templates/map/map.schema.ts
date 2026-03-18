/**
 * @fileoverview Zod схема для валидации параметров шаблона геолокации
 * @module templates/map/map.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров обработчика геолокации */
export const mapParamsSchema = z.object({
  // --- Идентификация ---
  nodeId: z.string(),

  // --- Контент ---
  messageText: z.string().optional(),
  formatMode: z.enum(['html', 'markdown', 'none']).optional(),

  // --- Геолокация ---
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  locationTitle: z.string().optional(),
  locationAddress: z.string().optional(),
  requestUserLocation: z.boolean().optional(),
  locationVariable: z.string().optional(),

  // --- Доступ ---
  isPrivateOnly: z.boolean().optional(),
  adminOnly: z.boolean().optional(),
  requiresAuth: z.boolean().optional(),
  userDatabaseEnabled: z.boolean().optional(),

  // --- Клавиатура ---
  keyboardType: z.enum(['inline', 'reply', 'none']).optional(),
  buttons: z.array(z.object({
    text: z.string(),
    action: z.string(),
    target: z.string(),
    id: z.string(),
  })).optional(),
  oneTimeKeyboard: z.boolean().optional(),
  resizeKeyboard: z.boolean().optional(),

  // --- Автопереход ---
  enableAutoTransition: z.boolean().optional(),
  autoTransitionTo: z.string().optional(),
});

/** Тип параметров обработчика геолокации (выведен из схемы) */
export type MapParams = z.infer<typeof mapParamsSchema>;
