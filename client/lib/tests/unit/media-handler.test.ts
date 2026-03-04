/**
 * @fileoverview Тесты для генераторов MediaHandler
 *
 * Модуль тестирует функции генерации обработчиков медиа:
 * - generatePhotoHandlerCode
 * - generateVideoHandlerCode
 * - generateAudioHandlerCode
 * - generateDocumentHandlerCode
 *
 * @module tests/unit/media-handler.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generatePhotoHandlerCode } from '../../bot-generator/MediaHandler/photo-handler';
import { generateVideoHandlerCode } from '../../bot-generator/MediaHandler/video-handler';
import { generateAudioHandlerCode } from '../../bot-generator/MediaHandler/audio-handler';
import { generateDocumentHandlerCode } from '../../bot-generator/MediaHandler/document-handler';

/**
 * Тестирование генерации обработчика фото
 */
describe('GeneratePhotoHandlerCode', () => {
  const code = generatePhotoHandlerCode();

  it('должна возвращать строку с Python-кодом', () => {
    assert.strictEqual(typeof code, 'string', 'должна возвращать строку');
    assert.ok(code.length > 0, 'код не должен быть пустым');
  });

  it('должна содержать обработчик @dp.message(F.photo)', () => {
    assert.ok(code.includes('@dp.message(F.photo)'), 'должна содержать декоратор @dp.message');
    assert.ok(code.includes('async def handle_photo_input('), 'должна содержать функцию handle_photo_input');
  });

  it('должна содержать проверку waiting_for_input', () => {
    assert.ok(code.includes('waiting_for_input'), 'должна содержать проверку waiting_for_input');
    assert.ok(code.includes('type') && code.includes('photo'), 'должна проверять тип photo');
  });

  it('должна сохранять сообщение через save_message_to_api', () => {
    assert.ok(code.includes('save_message_to_api'), 'должна использовать save_message_to_api');
  });

  it('должна сохранять медиа через save_media_to_db', () => {
    assert.ok(code.includes('save_media_to_db'), 'должна использовать save_media_to_db');
    assert.ok(code.includes('file_type="photo"'), 'должна указывать тип photo');
  });

  it('должна связывать медиа с сообщением через link_media_to_message', () => {
    assert.ok(code.includes('link_media_to_message'), 'должна использовать link_media_to_message');
    assert.ok(code.includes('media_kind="photo"'), 'должна указывать media_kind photo');
  });

  it('должна сохранять photo_data в user_data', () => {
    assert.ok(code.includes('photo_data'), 'должна создавать photo_data');
    assert.ok(code.includes('user_data[user_id][photo_variable]'), 'должна сохранять в user_data');
  });

  it('должна использовать update_user_data_in_db', () => {
    assert.ok(code.includes('update_user_data_in_db'), 'должна использовать update_user_data_in_db');
  });

  it('должна очищать waiting_for_input', () => {
    assert.ok(code.includes('del user_data[user_id]["waiting_for_input"]'), 'должна очищать waiting_for_input');
  });
});

/**
 * Тестирование генерации обработчика видео
 */
describe('GenerateVideoHandlerCode', () => {
  const code = generateVideoHandlerCode();

  it('должна возвращать строку с Python-кодом', () => {
    assert.strictEqual(typeof code, 'string', 'должна возвращать строку');
    assert.ok(code.length > 0, 'код не должен быть пустым');
  });

  it('должна содержать обработчик @dp.message(F.video)', () => {
    assert.ok(code.includes('@dp.message(F.video)'), 'должна содержать декоратор @dp.message');
    assert.ok(code.includes('async def handle_video_input('), 'должна содержать функцию handle_video_input');
  });

  it('должна сохранять медиа через save_media_to_db', () => {
    assert.ok(code.includes('save_media_to_db'), 'должна использовать save_media_to_db');
    assert.ok(code.includes('file_type="video"'), 'должна указывать тип video');
  });

  it('должна связывать медиа с сообщением', () => {
    assert.ok(code.includes('link_media_to_message'), 'должна использовать link_media_to_message');
    assert.ok(code.includes('media_kind="video"'), 'должна указывать media_kind video');
  });

  it('должна сохранять video_data в user_data', () => {
    assert.ok(code.includes('video_data'), 'должна создавать video_data');
    assert.ok(code.includes('videoUrl'), 'должна содержать videoUrl');
  });
});

/**
 * Тестирование генерации обработчика аудио
 */
describe('GenerateAudioHandlerCode', () => {
  const code = generateAudioHandlerCode();

  it('должна возвращать строку с Python-кодом', () => {
    assert.strictEqual(typeof code, 'string', 'должна возвращать строку');
    assert.ok(code.length > 0, 'код не должен быть пустым');
  });

  it('должна содержать обработчик @dp.message(F.audio | F.voice)', () => {
    assert.ok(code.includes('@dp.message(F.audio | F.voice)'), 'должна поддерживать audio и voice');
    assert.ok(code.includes('async def handle_audio_input('), 'должна содержать функцию handle_audio_input');
  });

  it('должна определять тип аудио (audio или voice)', () => {
    assert.ok(code.includes('message.audio'), 'должна проверять message.audio');
    assert.ok(code.includes('message.voice'), 'должна проверять message.voice');
  });

  it('должна сохранять медиа через save_media_to_db', () => {
    assert.ok(code.includes('save_media_to_db'), 'должна использовать save_media_to_db');
    assert.ok(code.includes('file_type = "voice" if message.voice else "audio"'), 'должна определять тип');
  });

  it('должна связывать медиа с сообщением', () => {
    assert.ok(code.includes('link_media_to_message'), 'должна использовать link_media_to_message');
  });

  it('должна сохранять audio_data в user_data', () => {
    assert.ok(code.includes('audio_data'), 'должна создавать audio_data');
    assert.ok(code.includes('audioUrl'), 'должна содержать audioUrl');
  });
});

/**
 * Тестирование генерации обработчика документов
 */
describe('GenerateDocumentHandlerCode', () => {
  const code = generateDocumentHandlerCode();

  it('должна возвращать строку с Python-кодом', () => {
    assert.strictEqual(typeof code, 'string', 'должна возвращать строку');
    assert.ok(code.length > 0, 'код не должен быть пустым');
  });

  it('должна содержать обработчик @dp.message(F.document)', () => {
    assert.ok(code.includes('@dp.message(F.document)'), 'должна содержать декоратор @dp.message');
    assert.ok(code.includes('async def handle_document_input('), 'должна содержать функцию handle_document_input');
  });

  it('должна сохранять медиа через save_media_to_db', () => {
    assert.ok(code.includes('save_media_to_db'), 'должна использовать save_media_to_db');
    assert.ok(code.includes('file_type="document"'), 'должна указывать тип document');
  });

  it('должна связывать медиа с сообщением', () => {
    assert.ok(code.includes('link_media_to_message'), 'должна использовать link_media_to_message');
    assert.ok(code.includes('media_kind="document"'), 'должна указывать media_kind document');
  });

  it('должна сохранять document_data в user_data', () => {
    assert.ok(code.includes('document_data'), 'должна создавать document_data');
    assert.ok(code.includes('documentUrl'), 'должна содержать documentUrl');
  });
});

/**
 * Тестирование функции hasPhotoInput
 */
describe('HasPhotoInput', () => {
  it('должна возвращать true если есть узлы с enablePhotoInput', async () => {
    const { hasPhotoInput } = await import('../../bot-generator/MediaHandler/photo-handler');
    const nodes = [
      { data: { enablePhotoInput: true } },
      { data: { enablePhotoInput: false } }
    ];

    assert.strictEqual(hasPhotoInput(nodes), true, 'должна возвращать true');
  });

  it('должна возвращать false если нет узлов с enablePhotoInput', async () => {
    const { hasPhotoInput } = await import('../../bot-generator/MediaHandler/photo-handler');
    const nodes = [
      { data: { enablePhotoInput: false } },
      { data: { enableTextInput: true } }
    ];

    assert.strictEqual(hasPhotoInput(nodes), false, 'должна возвращать false');
  });

  it('должна возвращать false для пустого массива', async () => {
    const { hasPhotoInput } = await import('../../bot-generator/MediaHandler/photo-handler');
    assert.strictEqual(hasPhotoInput([]), false, 'должна возвращать false для пустого массива');
  });

  it('должна возвращать false для null/undefined', async () => {
    const { hasPhotoInput } = await import('../../bot-generator/MediaHandler/photo-handler');
    assert.strictEqual(hasPhotoInput(null as any), false, 'должна возвращать false для null');
    assert.strictEqual(hasPhotoInput(undefined as any), false, 'должна возвращать false для undefined');
  });
});
