/**
 * @fileoverview Функция рендеринга шаблона голосового сообщения
 * @module templates/voice/voice.renderer
 */

import type { VoiceTemplateParams } from './voice.params';
import { voiceParamsSchema } from './voice.schema';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Генерация Python обработчика голосового сообщения с валидацией параметров
 * @param params - Параметры голосового сообщения
 * @returns Сгенерированный Python код обработчика
 *
 * @example
 * ```typescript
 * const code = generateVoice({
 *   nodeId: 'voice_1',
 *   voiceUrl: 'https://example.com/voice.ogg',
 *   mediaCaption: 'Привет!',
 *   mediaDuration: 30,
 * });
 * ```
 */
export function generateVoice(params: VoiceTemplateParams): string {
  const validated = voiceParamsSchema.parse({
    ...params,
    disableNotification: params.disableNotification ?? false,
  });
  return renderPartialTemplate('voice/voice.py.jinja2', validated);
}
