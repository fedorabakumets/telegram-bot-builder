/**
 * @fileoverview Тесты для шаблона обработчиков входящих медиафайлов
 * @module templates/media-input-handlers/media-input-handlers.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateMediaInputHandlers } from './media-input-handlers.renderer';

describe('generateMediaInputHandlers()', () => {
  it('использует photo_variable из waiting_for_input для фото', () => {
    const r = generateMediaInputHandlers({
      hasPhotoInput: true,
      hasVideoInput: false,
      hasAudioInput: false,
      hasDocumentInput: false,
      navigationCode: 'pass',
    });

    assert.ok(r.includes('waiting_config.get("photo_variable") or waiting_config.get("variable") or "user_photo"'));
  });

  it('поддерживает photo через modes даже если основной type=text', () => {
    const r = generateMediaInputHandlers({
      hasPhotoInput: true,
      hasVideoInput: false,
      hasAudioInput: false,
      hasDocumentInput: false,
      navigationCode: 'pass',
    });

    assert.ok(r.includes('"photo" in waiting_modes'));
  });

  it('использует video_variable из waiting_for_input для видео', () => {
    const r = generateMediaInputHandlers({
      hasPhotoInput: false,
      hasVideoInput: true,
      hasAudioInput: false,
      hasDocumentInput: false,
      navigationCode: 'pass',
    });

    assert.ok(r.includes('waiting_config.get("video_variable") or waiting_config.get("variable") or "user_video"'));
  });

  it('использует audio_variable из waiting_for_input для аудио', () => {
    const r = generateMediaInputHandlers({
      hasPhotoInput: false,
      hasVideoInput: false,
      hasAudioInput: true,
      hasDocumentInput: false,
      navigationCode: 'pass',
    });

    assert.ok(r.includes('waiting_config.get("audio_variable") or waiting_config.get("variable") or "user_audio"'));
  });

  it('использует document_variable из waiting_for_input для документа', () => {
    const r = generateMediaInputHandlers({
      hasPhotoInput: false,
      hasVideoInput: false,
      hasAudioInput: false,
      hasDocumentInput: true,
      navigationCode: 'pass',
    });

    assert.ok(r.includes('waiting_config.get("document_variable") or waiting_config.get("variable") or "user_document"'));
  });

  it('не генерирует код, если медиа-ввод нигде не включён', () => {
    const r = generateMediaInputHandlers({
      hasPhotoInput: false,
      hasVideoInput: false,
      hasAudioInput: false,
      hasDocumentInput: false,
      navigationCode: 'pass',
    });

    assert.strictEqual(r, '');
  });
});
