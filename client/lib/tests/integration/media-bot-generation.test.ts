/**
 * @fileoverview Интеграционные тесты для генерации бота с поддержкой медиа
 *
 * Модуль тестирует полную генерацию Python-кода бота с различными
 * конфигурациями медиа-узлов (photo, video, audio, document).
 * Проверяет корректность генерации функций сохранения в БД.
 *
 * @module tests/integration/media-bot-generation.test
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { generateBotCode } from '../../bot-generator';
import type { BotGeneratorContext } from '../../bot-generator/types';

/**
 * Интеграционные тесты для генерации бота с медиа
 */
describe('Integration: MediaBotGeneration', () => {
  let baseContext: BotGeneratorContext;

  /**
   * Базовый контекст для тестов
   */
  beforeEach(() => {
    baseContext = {
      projectId: 123,
      nodes: [],
      groups: [],
      options: {
        userDatabaseEnabled: true,
        enableComments: false,
        enableLogging: true,
      },
    };
  });

  /**
   * Тест: генерация бота с photo input узлом
   */
  it('должна генерировать бота с photo input узлом', () => {
    const context: BotGeneratorContext = {
      ...baseContext,
      nodes: [
        {
          id: 'start',
          type: 'start',
          position: { x: 0, y: 0 },
          data: {
            command: '/start',
            messageText: 'Привет! Отправь мне фото.',
            buttons: [],
            enablePhotoInput: true,
            photoInputVariable: 'user_photo',
            inputTargetNodeId: 'photo_received',
          },
        },
        {
          id: 'photo_received',
          type: 'message',
          position: { x: 0, y: 100 },
          data: {
            messageText: 'Фото получено!',
            buttons: [],
          },
        },
      ],
    };

    const code = generateBotCode(context);

    assert.ok(code, 'код должен быть сгенерирован');
    assert.ok(code.includes('async def handle_photo_input('), 'должен содержать обработчик фото');
    assert.ok(code.includes('save_media_to_db'), 'должен содержать функцию сохранения медиа');
    assert.ok(code.includes('link_media_to_message'), 'должен содержать функцию связи медиа');
    assert.ok(code.includes('file_type="photo"'), 'должен указывать тип photo');
    assert.ok(code.includes('media_kind="photo"'), 'должен указывать media_kind photo');
  });

  /**
   * Тест: генерация бота с video input узлом
   */
  it('должна генерировать бота с video input узлом', () => {
    const context: BotGeneratorContext = {
      ...baseContext,
      nodes: [
        {
          id: 'start',
          type: 'start',
          position: { x: 0, y: 0 },
          data: {
            command: '/start',
            messageText: 'Отправь видео.',
            buttons: [],
            enableVideoInput: true,
            videoInputVariable: 'user_video',
          },
        },
      ],
    };

    const code = generateBotCode(context);

    assert.ok(code.includes('async def handle_video_input('), 'должен содержать обработчик видео');
    assert.ok(code.includes('file_type="video"'), 'должен указывать тип video');
    assert.ok(code.includes('media_kind="video"'), 'должен указывать media_kind video');
    assert.ok(code.includes('mime_type=message.video.mime_type'), 'должен сохранять mime_type');
  });

  /**
   * Тест: генерация бота с audio/voice input узлом
   */
  it('должна генерировать бота с audio/voice input узлом', () => {
    const context: BotGeneratorContext = {
      ...baseContext,
      nodes: [
        {
          id: 'start',
          type: 'start',
          position: { x: 0, y: 0 },
          data: {
            command: '/start',
            messageText: 'Отправь голосовое.',
            buttons: [],
            enableAudioInput: true,
            audioInputVariable: 'user_audio',
          },
        },
      ],
    };

    const code = generateBotCode(context);

    assert.ok(code.includes('@dp.message(F.audio | F.voice)'), 'должен поддерживать audio и voice');
    assert.ok(code.includes('file_type = "voice" if message.voice else "audio"'), 'должен определять тип');
    assert.ok(code.includes('save_media_to_db'), 'должен сохранять медиа');
  });

  /**
   * Тест: генерация бота с document input узлом
   */
  it('должна генерировать бота с document input узлом', () => {
    const context: BotGeneratorContext = {
      ...baseContext,
      nodes: [
        {
          id: 'start',
          type: 'start',
          position: { x: 0, y: 0 },
          data: {
            command: '/start',
            messageText: 'Отправь документ.',
            buttons: [],
            enableDocumentInput: true,
            documentInputVariable: 'user_document',
          },
        },
      ],
    };

    const code = generateBotCode(context);

    assert.ok(code.includes('async def handle_document_input('), 'должен содержать обработчик документов');
    assert.ok(code.includes('file_type="document"'), 'должен указывать тип document');
    assert.ok(code.includes('media_kind="document"'), 'должен указывать media_kind document');
  });

  /**
   * Тест: генерация бота с несколькими типами медиа
   */
  it('должна генерировать бота с несколькими типами медиа', () => {
    const context: BotGeneratorContext = {
      ...baseContext,
      nodes: [
        {
          id: 'start',
          type: 'start',
          position: { x: 0, y: 0 },
          data: {
            command: '/start',
            messageText: 'Выбери что отправить.',
            buttons: [
              { id: 'btn1', text: 'Фото', action: 'goto', target: 'photo_node' },
              { id: 'btn2', text: 'Видео', action: 'goto', target: 'video_node' },
            ],
          },
        },
        {
          id: 'photo_node',
          type: 'message',
          position: { x: 0, y: 100 },
          data: {
            messageText: 'Отправь фото.',
            buttons: [],
            enablePhotoInput: true,
            photoInputVariable: 'photo',
          },
        },
        {
          id: 'video_node',
          type: 'message',
          position: { x: 0, y: 200 },
          data: {
            messageText: 'Отправь видео.',
            buttons: [],
            enableVideoInput: true,
            videoInputVariable: 'video',
          },
        },
      ],
    };

    const code = generateBotCode(context);

    assert.ok(code.includes('handle_photo_input'), 'должен содержать обработчик фото');
    assert.ok(code.includes('handle_video_input'), 'должен содержать обработчик видео');
    assert.ok(code.includes('save_media_to_db'), 'должен содержать функцию сохранения медиа');
    assert.ok(code.includes('INSERT INTO media_files'), 'должен содержать INSERT в media_files');
    assert.ok(code.includes('INSERT INTO bot_message_media'), 'должен содержать INSERT в bot_message_media');
  });

  /**
   * Тест: генерация бота с БД выключенной
   */
  it('не должна генерировать функции БД если userDatabaseEnabled = false', () => {
    const context: BotGeneratorContext = {
      ...baseContext,
      options: {
        ...baseContext.options,
        userDatabaseEnabled: false,
      },
      nodes: [
        {
          id: 'start',
          type: 'start',
          position: { x: 0, y: 0 },
          data: {
            command: '/start',
            messageText: 'Привет.',
            buttons: [],
          },
        },
      ],
    };

    const code = generateBotCode(context);

    assert.ok(code.includes('async def save_message_to_api('), 'должна быть заглушка save_message_to_api');
    assert.ok(code.includes('"""Заглушка - ничего не делает"""'), 'должна быть заглушка');
  });

  /**
   * Тест: генерация с PROJECT_ID
   */
  it('должна использовать PROJECT_ID в функциях сохранения', () => {
    const context: BotGeneratorContext = {
      ...baseContext,
      projectId: 456,
      nodes: [
        {
          id: 'start',
          type: 'start',
          position: { x: 0, y: 0 },
          data: {
            command: '/start',
            messageText: 'Тест.',
            buttons: [],
            enablePhotoInput: true,
          },
        },
      ],
    };

    const code = generateBotCode(context);

    assert.ok(code.includes('PROJECT_ID = 456'), 'должен содержать PROJECT_ID');
    assert.ok(code.includes('PROJECT_ID,'), 'должен использовать PROJECT_ID в функциях');
  });

  /**
   * Тест: генерация с db_pool
   */
  it('должна использовать db_pool для подключения к БД', () => {
    const context: BotGeneratorContext = {
      ...baseContext,
      nodes: [
        {
          id: 'start',
          type: 'start',
          position: { x: 0, y: 0 },
          data: {
            command: '/start',
            messageText: 'Тест.',
            buttons: [],
            enablePhotoInput: true,
          },
        },
      ],
    };

    const code = generateBotCode(context);

    assert.ok(code.includes('async with db_pool.acquire()'), 'должен использовать db_pool.acquire()');
    assert.ok(code.includes('INSERT INTO bot_messages'), 'должен вставлять в bot_messages');
    assert.ok(code.includes('INSERT INTO media_files'), 'должен вставлять в media_files');
  });

  /**
   * Тест: генерация с logging
   */
  it('должна содержать логирование операций', () => {
    const context: BotGeneratorContext = {
      ...baseContext,
      nodes: [
        {
          id: 'start',
          type: 'start',
          position: { x: 0, y: 0 },
          data: {
            command: '/start',
            messageText: 'Тест.',
            buttons: [],
            enablePhotoInput: true,
          },
        },
      ],
    };

    const code = generateBotCode(context);

    assert.ok(code.includes('logging.info'), 'должен содержать logging.info');
    assert.ok(code.includes('logging.error'), 'должен содержать logging.error');
    assert.ok(code.includes('✅'), 'должен содержать emoji успеха');
    assert.ok(code.includes('❌'), 'должен содержать emoji ошибки');
  });

  /**
   * Тест: генерация с обработкой исключений
   */
  it('должна содержать обработку исключений', () => {
    const context: BotGeneratorContext = {
      ...baseContext,
      nodes: [
        {
          id: 'start',
          type: 'start',
          position: { x: 0, y: 0 },
          data: {
            command: '/start',
            messageText: 'Тест.',
            buttons: [],
            enablePhotoInput: true,
          },
        },
      ],
    };

    const code = generateBotCode(context);

    assert.ok(code.includes('try:'), 'должен содержать try');
    assert.ok(code.includes('except Exception'), 'должен содержать except Exception');
  });
});
