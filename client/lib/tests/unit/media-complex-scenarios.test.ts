/**
 * @fileoverview Тесты для сложных сценариев работы с медиа
 *
 * Модуль тестирует различные сценарии использования медиа:
 * - Комбинированные типы (photo+text, video+audio)
 * - Несколько медиа в одном сообщении
 * - Последовательная отправка медиа
 * - Медиа с conditional messages
 *
 * @module tests/unit/media-complex-scenarios.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateSaveMediaToDb } from '../../bot-generator/MediaHandler/save-media-to-db';
import { generatePhotoHandlerCode } from '../../bot-generator/MediaHandler/photo-handler';
import { generateVideoHandlerCode } from '../../bot-generator/MediaHandler/video-handler';
import { generateAudioHandlerCode } from '../../bot-generator/MediaHandler/audio-handler';
import { generateDocumentHandlerCode } from '../../bot-generator/MediaHandler/document-handler';

/**
 * Тесты для сложных сценариев с медиа
 */
describe('MediaComplexScenarios', () => {
  /**
   * Сценарий: Фото с текстовым описанием
   */
  describe('PhotoWithText', () => {
    const code = generatePhotoHandlerCode();

    it('должен сохранять фото и текст в БД', () => {
      assert.ok(code.includes('save_message_to_api'), 'должен сохранять сообщение');
      assert.ok(code.includes('message_text="[Фото ответ]"'), 'должен указывать тип сообщения');
      assert.ok(code.includes('message_data={"photo":'), 'должен сохранять данные фото');
    });

    it('должен сохранять photo_data с URL', () => {
      assert.ok(code.includes('photo_data = {'), 'должен создавать photo_data');
      assert.ok(code.includes('"value": photo_file_id'), 'должен сохранять file_id');
      assert.ok(code.includes('"type": "photo"'), 'должен указывать тип');
      assert.ok(code.includes('"photoUrl":'), 'должен сохранять URL');
      assert.ok(code.includes('"timestamp":'), 'должен сохранять временную метку');
    });

    it('должен очищать waiting_for_input после сохранения', () => {
      assert.ok(code.includes('del user_data[user_id]["waiting_for_input"]'), 'должен очищать состояние');
    });
  });

  /**
   * Сценарий: Видео с автовоспроизведением
   */
  describe('VideoWithAutoTransition', () => {
    const code = generateVideoHandlerCode();

    it('должен сохранять видео с mime_type', () => {
      assert.ok(code.includes('mime_type=message.video.mime_type or "video/mp4"'), 'должен сохранять mime_type');
    });

    it('должен сохранять video_data', () => {
      assert.ok(code.includes('video_data = {'), 'должен создавать video_data');
      assert.ok(code.includes('"videoUrl":'), 'должен сохранять URL');
    });

    it('должен поддерживать переход к следующему узлу', () => {
      assert.ok(code.includes('if next_node_id:'), 'должен проверять next_node_id');
      assert.ok(code.includes('Переходим к следующему узлу'), 'должен логировать переход');
    });
  });

  /**
   * Сценарий: Аудио и голосовые сообщения
   */
  describe('AudioAndVoice', () => {
    const code = generateAudioHandlerCode();

    it('должен поддерживать audio и voice', () => {
      assert.ok(code.includes('@dp.message(F.audio | F.voice)'), 'должен поддерживать оба типа');
    });

    it('должен определять тип медиа динамически', () => {
      assert.ok(code.includes('file_type = "voice" if message.voice else "audio"'), 'должен определять тип');
    });

    it('должен сохранять file_size для audio', () => {
      assert.ok(code.includes('file_size=(message.audio.file_size if message.audio'), 'должен сохранять размер');
    });

    it('должен сохранять file_size для voice', () => {
      assert.ok(code.includes('else message.voice.file_size)'), 'должен сохранять размер voice');
    });

    it('должен устанавливать правильный mime_type', () => {
      assert.ok(code.includes('mime_type=(message.audio.mime_type if message.audio else "audio/ogg")'), 'должен устанавливать mime_type');
    });
  });

  /**
   * Сценарий: Документы с разными MIME-типами
   */
  describe('DocumentWithMimeTypes', () => {
    const code = generateDocumentHandlerCode();

    it('должен сохранять document с mime_type', () => {
      assert.ok(code.includes('mime_type=message.document.mime_type or "application/octet-stream"'), 'должен сохранять mime_type');
    });

    it('должен сохранять document_data', () => {
      assert.ok(code.includes('document_data = {'), 'должен создавать document_data');
      assert.ok(code.includes('"documentUrl":'), 'должен сохранять URL');
    });
  });

  /**
   * Сценарий: Обработка ошибок при сохранении
   */
  describe('ErrorHandling', () => {
    const saveCode = generateSaveMediaToDb();

    it('должен содержать try-catch для save_media_to_db', () => {
      assert.ok(saveCode.includes('try:'), 'должен содержать try');
      assert.ok(saveCode.includes('except Exception as e:'), 'должен содержать except');
    });

    it('должен логировать ошибку', () => {
      assert.ok(saveCode.includes('logging.error(f"❌ Ошибка сохранения медиа в БД: {e}")'), 'должен логировать ошибку');
    });

    it('должен возвращать None при ошибке', () => {
      assert.ok(saveCode.includes('return None'), 'должен возвращать None');
    });

    it('должен содержать try-catch для link_media_to_message', () => {
      assert.ok(saveCode.includes('except Exception as e:'), 'должен содержать except для link');
      assert.ok(saveCode.includes('logging.error(f"❌ Ошибка связи медиа с сообщением: {e}")'), 'должен логировать ошибку link');
    });
  });

  /**
   * Сценарий: Возврат значений из БД
   */
  describe('DatabaseReturnValues', () => {
    const saveCode = generateSaveMediaToDb();

    it('должен возвращать id, file_name, file_type, url', () => {
      assert.ok(saveCode.includes('return {"id": result["id"]'), 'должен возвращать id');
      assert.ok(saveCode.includes('"file_name": result["file_name"]'), 'должен возвращать file_name');
      assert.ok(saveCode.includes('"file_type": result["file_type"]'), 'должен возвращать file_type');
      assert.ok(saveCode.includes('"url": result["url"]}'), 'должен возвращать url');
    });

    it('должен использовать RETURNING в SQL', () => {
      assert.ok(saveCode.includes('RETURNING id, file_name, file_type, url'), 'должен использовать RETURNING');
    });
  });

  /**
   * Сценарий: Связь медиа с сообщением
   */
  describe('MediaMessageLinking', () => {
    const saveCode = generateSaveMediaToDb();

    it('должен вставлять в bot_message_media', () => {
      assert.ok(saveCode.includes('INSERT INTO bot_message_media'), 'должен вставлять в bot_message_media');
      assert.ok(saveCode.includes('message_id'), 'должен использовать message_id');
      assert.ok(saveCode.includes('media_file_id'), 'должен использовать media_file_id');
      assert.ok(saveCode.includes('media_kind'), 'должен использовать media_kind');
      assert.ok(saveCode.includes('order_index'), 'должен использовать order_index');
    });

    it('должен обновлять primary_media_id', () => {
      assert.ok(saveCode.includes('UPDATE bot_messages SET primary_media_id'), 'должен обновлять primary_media_id');
    });

    it('должен использовать параметры запроса', () => {
      assert.ok(saveCode.includes('message_id,'), 'должен передавать message_id');
      assert.ok(saveCode.includes('media_id,'), 'должен передавать media_id');
      assert.ok(saveCode.includes('media_kind,'), 'должен передавать media_kind');
      assert.ok(saveCode.includes('order_index'), 'должен передавать order_index');
    });
  });

  /**
   * Сценарий: Логирование успешных операций
   */
  describe('SuccessLogging', () => {
    const saveCode = generateSaveMediaToDb();

    it('должен логировать успешное сохранение', () => {
      assert.ok(saveCode.includes('logging.info(f"✅ Медиа сохранено в БД: {file_type}'), 'должен логировать сохранение');
    });

    it('должен логировать успешную связь', () => {
      assert.ok(saveCode.includes('logging.info(f"🔗 Медиа связано с сообщением {message_id}")'), 'должен логировать связь');
    });
  });

  /**
   * Сценарий: Проверка типов данных в функциях
   */
  describe('TypeAnnotations', () => {
    const saveCode = generateSaveMediaToDb();

    it('должен содержать аннотации типов для save_media_to_db', () => {
      assert.ok(saveCode.includes('file_id: str'), 'должен содержать file_id: str');
      assert.ok(saveCode.includes('file_type: str'), 'должен содержать file_type: str');
      assert.ok(saveCode.includes('file_name: str = None'), 'должен содержать file_name: str = None');
      assert.ok(saveCode.includes('file_size: int = None'), 'должен содержать file_size: int = None');
      assert.ok(saveCode.includes('mime_type: str = None'), 'должен содержать mime_type: str = None');
    });

    it('должен содержать аннотации типов для link_media_to_message', () => {
      assert.ok(saveCode.includes('message_id: int'), 'должен содержать message_id: int');
      assert.ok(saveCode.includes('media_id: int'), 'должен содержать media_id: int');
      assert.ok(saveCode.includes('media_kind: str'), 'должен содержать media_kind: str');
      assert.ok(saveCode.includes('order_index: int'), 'должен содержать order_index: int');
    });
  });

  /**
   * Сценарий: Docstring документация
   */
  describe('Docstrings', () => {
    const saveCode = generateSaveMediaToDb();

    it('должен содержать docstring для save_media_to_db', () => {
      assert.ok(saveCode.includes('"""Сохраняет информацию о медиа-файле в базу данных напрямую'), 'должен содержать описание');
      assert.ok(saveCode.includes('Args:'), 'должен содержать раздел Args');
      assert.ok(saveCode.includes('Returns:'), 'должен содержать раздел Returns');
    });

    it('должен содержать docstring для link_media_to_message', () => {
      assert.ok(saveCode.includes('"""Связывает медиа с сообщением в базе данных'), 'должен содержать описание link');
    });

    it('должен описывать каждый параметр', () => {
      assert.ok(saveCode.includes('file_id: ID файла в Telegram'), 'должен описывать file_id');
      assert.ok(saveCode.includes('file_type: Тип медиа'), 'должен описывать file_type');
      assert.ok(saveCode.includes('message_id: ID сообщения в БД'), 'должен описывать message_id');
      assert.ok(saveCode.includes('media_id: ID медиа в БД'), 'должен описывать media_id');
    });
  });

  /**
   * Сценарий: Консистентность между разными типами медиа
   */
  describe('ConsistencyAcrossTypes', () => {
    const photoCode = generatePhotoHandlerCode();
    const videoCode = generateVideoHandlerCode();
    const audioCode = generateAudioHandlerCode();
    const documentCode = generateDocumentHandlerCode();

    it('все обработчики должны использовать save_media_to_db', () => {
      assert.ok(photoCode.includes('save_media_to_db'), 'photo должен использовать');
      assert.ok(videoCode.includes('save_media_to_db'), 'video должен использовать');
      assert.ok(audioCode.includes('save_media_to_db'), 'audio должен использовать');
      assert.ok(documentCode.includes('save_media_to_db'), 'document должен использовать');
    });

    it('все обработчики должны использовать link_media_to_message', () => {
      assert.ok(photoCode.includes('link_media_to_message'), 'photo должен использовать');
      assert.ok(videoCode.includes('link_media_to_message'), 'video должен использовать');
      assert.ok(audioCode.includes('link_media_to_message'), 'audio должен использовать');
      assert.ok(documentCode.includes('link_media_to_message'), 'document должен использовать');
    });

    it('все обработчики должны сохранять в user_data', () => {
      assert.ok(photoCode.includes('user_data[user_id][photo_variable]'), 'photo должен сохранять');
      assert.ok(videoCode.includes('user_data[user_id][video_variable]'), 'video должен сохранять');
      assert.ok(audioCode.includes('user_data[user_id][audio_variable]'), 'audio должен сохранять');
      assert.ok(documentCode.includes('user_data[user_id][document_variable]'), 'document должен сохранять');
    });

    it('все обработчики должны использовать update_user_data_in_db', () => {
      assert.ok(photoCode.includes('update_user_data_in_db'), 'photo должен использовать');
      assert.ok(videoCode.includes('update_user_data_in_db'), 'video должен использовать');
      assert.ok(audioCode.includes('update_user_data_in_db'), 'audio должен использовать');
      assert.ok(documentCode.includes('update_user_data_in_db'), 'document должен использовать');
    });
  });
});
