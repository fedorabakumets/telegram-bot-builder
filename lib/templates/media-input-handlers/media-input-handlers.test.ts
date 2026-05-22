/**
 * @fileoverview Тесты для шаблона обработчиков входящих медиафайлов
 * @module templates/media-input-handlers/media-input-handlers.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateMediaInputHandlers } from './media-input-handlers.renderer';
import type { MediaInputHandlersTemplateParams, MediaMetadataConfig } from './media-input-handlers.params';

/** Базовые параметры без медиа-ввода */
const baseParams: MediaInputHandlersTemplateParams = {
  hasPhotoInput: false,
  hasVideoInput: false,
  hasAudioInput: false,
  hasDocumentInput: false,
  hasLocationInput: false,
  hasContactInput: false,
  navigationCode: 'pass',
};

describe('generateMediaInputHandlers()', () => {
  it('использует photo_variable из waiting_for_input для фото', () => {
    const r = generateMediaInputHandlers({
      ...baseParams,
      hasPhotoInput: true,
    });

    assert.ok(r.includes('waiting_config.get("photo_variable") or waiting_config.get("variable") or "user_photo"'));
  });

  it('поддерживает photo через modes даже если основной type=text', () => {
    const r = generateMediaInputHandlers({
      ...baseParams,
      hasPhotoInput: true,
    });

    assert.ok(r.includes('"photo" in waiting_modes'));
  });

  it('использует video_variable из waiting_for_input для видео', () => {
    const r = generateMediaInputHandlers({
      ...baseParams,
      hasVideoInput: true,
    });

    assert.ok(r.includes('waiting_config.get("video_variable") or waiting_config.get("variable") or "user_video"'));
  });

  it('использует audio_variable из waiting_for_input для аудио', () => {
    const r = generateMediaInputHandlers({
      ...baseParams,
      hasAudioInput: true,
    });

    assert.ok(r.includes('waiting_config.get("audio_variable") or waiting_config.get("variable") or "user_audio"'));
  });

  it('использует document_variable из waiting_for_input для документа', () => {
    const r = generateMediaInputHandlers({
      ...baseParams,
      hasDocumentInput: true,
    });

    assert.ok(r.includes('waiting_config.get("document_variable") or waiting_config.get("variable") or "user_document"'));
  });

  it('использует location_variable из waiting_for_input для геолокации', () => {
    const r = generateMediaInputHandlers({
      ...baseParams,
      hasLocationInput: true,
    });

    assert.ok(r.includes('@dp.message(F.location)'));
    assert.ok(r.includes('waiting_config.get("location_variable") or waiting_config.get("variable") or "user_location"'));
  });

  it('использует contact_variable из waiting_for_input для контакта', () => {
    const r = generateMediaInputHandlers({
      ...baseParams,
      hasContactInput: true,
    });

    assert.ok(r.includes('@dp.message(F.contact)'));
    assert.ok(r.includes('waiting_config.get("contact_variable") or waiting_config.get("variable") or "user_contact"'));
  });

  it('не генерирует код, если медиа-ввод нигде не включён', () => {
    const r = generateMediaInputHandlers({ ...baseParams });
    assert.strictEqual(r, '');
  });
});

describe('generateMediaInputHandlers() — mediaMetadataConfigs', () => {
  it('при пустом mediaMetadataConfigs код генерируется без метаданных (обратная совместимость)', () => {
    const r = generateMediaInputHandlers({
      ...baseParams,
      hasVideoInput: true,
      mediaMetadataConfigs: [],
    });

    assert.ok(r.includes('@dp.message(F.video)'));
    assert.ok(!r.includes('# Сохранение метаданных видео'));
  });

  it('при undefined mediaMetadataConfigs код генерируется без метаданных', () => {
    const r = generateMediaInputHandlers({
      ...baseParams,
      hasPhotoInput: true,
    });

    assert.ok(r.includes('@dp.message(F.photo)'));
    assert.ok(!r.includes('# Сохранение метаданных фото'));
  });

  it('генерирует метаданные video с дефолтными именами переменных', () => {
    const config: MediaMetadataConfig = {
      mediaType: 'video',
      baseVariable: 'my_video',
      enabledSuffixes: ['duration', 'file_size', 'thumbnail'],
      customNames: {},
    };

    const r = generateMediaInputHandlers({
      ...baseParams,
      hasVideoInput: true,
      mediaMetadataConfigs: [config],
    });

    assert.ok(r.includes('# Сохранение метаданных видео'));
    assert.ok(r.includes('user_data[user_id]["my_video_duration"] = message.video.duration'));
    assert.ok(r.includes('await update_user_data_in_db(user_id, "my_video_duration", message.video.duration)'));
    assert.ok(r.includes('user_data[user_id]["my_video_file_size"] = message.video.file_size or 0'));
    assert.ok(r.includes('user_data[user_id]["my_video_thumbnail"] = message.video.thumbnail.file_id if message.video.thumbnail else ""'));
  });

  it('кастомные имена переменных используются вместо дефолтных', () => {
    const config: MediaMetadataConfig = {
      mediaType: 'video',
      baseVariable: 'my_video',
      enabledSuffixes: ['duration', 'file_size'],
      customNames: { duration: 'video_len', file_size: 'video_bytes' },
    };

    const r = generateMediaInputHandlers({
      ...baseParams,
      hasVideoInput: true,
      mediaMetadataConfigs: [config],
    });

    assert.ok(r.includes('user_data[user_id]["video_len"] = message.video.duration'));
    assert.ok(r.includes('await update_user_data_in_db(user_id, "video_len", message.video.duration)'));
    assert.ok(r.includes('user_data[user_id]["video_bytes"] = message.video.file_size or 0'));
    assert.ok(r.includes('await update_user_data_in_db(user_id, "video_bytes", message.video.file_size or 0)'));
    // Не должно быть дефолтных имён
    assert.ok(!r.includes('"my_video_duration"'));
    assert.ok(!r.includes('"my_video_file_size"'));
  });

  it('пустой enabledSuffixes означает "все суффиксы"', () => {
    const config: MediaMetadataConfig = {
      mediaType: 'video',
      baseVariable: 'vid',
      enabledSuffixes: [],
      customNames: {},
    };

    const r = generateMediaInputHandlers({
      ...baseParams,
      hasVideoInput: true,
      mediaMetadataConfigs: [config],
    });

    // Все суффиксы video должны присутствовать
    assert.ok(r.includes('"vid_file_id"'));
    assert.ok(r.includes('"vid_file_unique_id"'));
    assert.ok(r.includes('"vid_thumbnail"'));
    assert.ok(r.includes('"vid_duration"'));
    assert.ok(r.includes('"vid_file_size"'));
    assert.ok(r.includes('"vid_file_name"'));
    assert.ok(r.includes('"vid_width"'));
    assert.ok(r.includes('"vid_height"'));
    assert.ok(r.includes('"vid_mime_type"'));
  });

  it('генерирует метаданные photo с выбранными суффиксами', () => {
    const config: MediaMetadataConfig = {
      mediaType: 'photo',
      baseVariable: 'user_photo',
      enabledSuffixes: ['file_id', 'width', 'height'],
      customNames: {},
    };

    const r = generateMediaInputHandlers({
      ...baseParams,
      hasPhotoInput: true,
      mediaMetadataConfigs: [config],
    });

    assert.ok(r.includes('# Сохранение метаданных фото'));
    assert.ok(r.includes('user_data[user_id]["user_photo_file_id"] = photo_file_id'));
    assert.ok(r.includes('user_data[user_id]["user_photo_width"] = message.photo[-1].width'));
    assert.ok(r.includes('user_data[user_id]["user_photo_height"] = message.photo[-1].height'));
    // Не включённые суффиксы не должны присутствовать
    assert.ok(!r.includes('"user_photo_file_size"'));
    assert.ok(!r.includes('"user_photo_small_file_id"'));
  });

  it('генерирует метаданные audio', () => {
    const config: MediaMetadataConfig = {
      mediaType: 'audio',
      baseVariable: 'track',
      enabledSuffixes: ['title', 'performer', 'duration'],
      customNames: { title: 'song_name' },
    };

    const r = generateMediaInputHandlers({
      ...baseParams,
      hasAudioInput: true,
      mediaMetadataConfigs: [config],
    });

    assert.ok(r.includes('# Сохранение метаданных аудио'));
    assert.ok(r.includes('user_data[user_id]["song_name"] = message.audio.title if message.audio else ""'));
    assert.ok(r.includes('user_data[user_id]["track_performer"] = message.audio.performer if message.audio else ""'));
    assert.ok(r.includes('user_data[user_id]["track_duration"] = audio_duration'));
  });

  it('генерирует метаданные document', () => {
    const config: MediaMetadataConfig = {
      mediaType: 'document',
      baseVariable: 'doc',
      enabledSuffixes: ['file_name', 'mime_type', 'file_size'],
      customNames: {},
    };

    const r = generateMediaInputHandlers({
      ...baseParams,
      hasDocumentInput: true,
      mediaMetadataConfigs: [config],
    });

    assert.ok(r.includes('# Сохранение метаданных документа'));
    assert.ok(r.includes('user_data[user_id]["doc_file_name"] = message.document.file_name or ""'));
    assert.ok(r.includes('user_data[user_id]["doc_mime_type"] = message.document.mime_type or ""'));
    assert.ok(r.includes('user_data[user_id]["doc_file_size"] = message.document.file_size or 0'));
  });

  it('конфигурация для несуществующего типа медиа не влияет на другие обработчики', () => {
    const config: MediaMetadataConfig = {
      mediaType: 'video',
      baseVariable: 'vid',
      enabledSuffixes: ['duration'],
      customNames: {},
    };

    const r = generateMediaInputHandlers({
      ...baseParams,
      hasPhotoInput: true,
      hasVideoInput: false,
      mediaMetadataConfigs: [config],
    });

    // Видео обработчик не генерируется — метаданные видео тоже
    assert.ok(!r.includes('# Сохранение метаданных видео'));
    // Фото обработчик есть, но без метаданных фото
    assert.ok(r.includes('@dp.message(F.photo)'));
    assert.ok(!r.includes('# Сохранение метаданных фото'));
  });

  it('несколько конфигураций для разных типов медиа', () => {
    const configs: MediaMetadataConfig[] = [
      {
        mediaType: 'photo',
        baseVariable: 'img',
        enabledSuffixes: ['file_id'],
        customNames: {},
      },
      {
        mediaType: 'video',
        baseVariable: 'vid',
        enabledSuffixes: ['duration'],
        customNames: {},
      },
    ];

    const r = generateMediaInputHandlers({
      ...baseParams,
      hasPhotoInput: true,
      hasVideoInput: true,
      mediaMetadataConfigs: configs,
    });

    assert.ok(r.includes('# Сохранение метаданных фото'));
    assert.ok(r.includes('user_data[user_id]["img_file_id"] = photo_file_id'));
    assert.ok(r.includes('# Сохранение метаданных видео'));
    assert.ok(r.includes('user_data[user_id]["vid_duration"] = message.video.duration'));
  });
});
