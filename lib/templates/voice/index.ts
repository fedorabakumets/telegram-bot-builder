/**
 * @fileoverview Экспорт модуля голосового сообщения
 * @module templates/voice/index
 */

export type { VoiceTemplateParams } from './voice.params';
export type { VoiceParams } from './voice.schema';
export { voiceParamsSchema } from './voice.schema';
export { generateVoice } from './voice.renderer';
export * from './voice.fixture';
