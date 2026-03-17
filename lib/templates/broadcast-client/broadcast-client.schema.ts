/**
 * @fileoverview Zod схема для валидации параметров рассылки Client API
 * @module templates/broadcast-client/broadcast-client.schema
 */

import { z } from 'zod';

export const broadcastNodeSchema = z.object({
  id: z.string(),
  text: z.string().default(''),
  formatMode: z.string().default('none'),
  imageUrl: z.string().default(''),
  audioUrl: z.string().default(''),
  videoUrl: z.string().default(''),
  documentUrl: z.string().default(''),
  attachedMedia: z.array(z.string()).default([]),
  autoTransitionTo: z.string().default(''),
});

export const broadcastClientParamsSchema = z.object({
  nodeId: z.string(),
  idSourceType: z.enum(['user_ids', 'bot_users', 'both']).default('bot_users'),
  successMessage: z.string().default(''),
  errorMessage: z.string().default(''),
  broadcastNodes: z.array(broadcastNodeSchema).default([]),
});

export type BroadcastClientParams = z.infer<typeof broadcastClientParamsSchema>;
