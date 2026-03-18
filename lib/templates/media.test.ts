/**
 * @fileoverview Тесты блока "Медиа"
 * Покрывает: imageUrl, videoUrl, audioUrl, documentUrl, attachedMedia
 * для узлов типа start, message, command
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateStart } from './start/start.renderer';
import { generateMessage } from './message/message.renderer';
import { generateCommand } from './command/command.renderer';

// ─── Базовые параметры ────────────────────────────────────────────────────────

const baseStart = {
  nodeId: 'start_1',
  messageText: 'Привет!',
  isPrivateOnly: false,
  adminOnly: false,
  requiresAuth: false,
  userDatabaseEnabled: false,
  synonyms: [],
  allowMultipleSelection: false,
  multiSelectVariable: '',
  buttons: [],
  keyboardType: 'none' as const,
  enableAutoTransition: false,
  autoTransitionTo: '',
  collectUserInput: false,
  imageUrl: '',
  documentUrl: '',
  videoUrl: '',
  audioUrl: '',
  attachedMedia: [],
};

const baseMessage = {
  nodeId: 'msg_1',
  messageText: 'Смотри:',
  keyboardType: 'none' as const,
  buttons: [],
};

const baseCommand = {
  nodeId: 'cmd_1',
  command: '/media',
  messageText: 'Медиа',
  isPrivateOnly: false,
  adminOnly: false,
  requiresAuth: false,
  userDatabaseEnabled: false,
  synonyms: [],
  buttons: [],
  keyboardType: 'none' as const,
  enableConditionalMessages: false,
  conditionalMessages: [],
  fallbackMessage: '',
};

// ─── Тест 1: imageUrl ────────────────────────────────────────────────────────

describe('Медиа — Тест 1: imageUrl', () => {
  it('start: imageUrl задан → send_photo', () => {
    const result = generateStart({ ...baseStart, imageUrl: 'https://example.com/photo.jpg' });
    assert.ok(result.includes('send_photo') || result.includes('photo'), 'должен использоваться send_photo');
    assert.ok(result.includes('https://example.com/photo.jpg'), 'URL должен быть в коде');
  });

  it('start: imageUrl пустой → send_message', () => {
    const result = generateStart({ ...baseStart, imageUrl: '' });
    assert.ok(!result.includes('send_photo'), 'не должно быть send_photo');
    assert.ok(result.includes('answer') || result.includes('send_message'), 'должен использоваться answer/send_message');
  });

  it('message: imageUrl задан → send_photo', () => {
    const result = generateMessage({ ...baseMessage, imageUrl: 'https://example.com/img.png' });
    assert.ok(result.includes('send_photo') || result.includes('photo'));
    assert.ok(result.includes('https://example.com/img.png'));
  });

  it('command: imageUrl задан → send_photo', () => {
    const result = generateCommand({ ...baseCommand, imageUrl: 'https://example.com/img.png' });
    assert.ok(result.includes('send_photo') || result.includes('photo'));
  });
});

// ─── Тест 2: videoUrl ────────────────────────────────────────────────────────

describe('Медиа — Тест 2: videoUrl', () => {
  it('start: videoUrl задан → send_video', () => {
    const result = generateStart({ ...baseStart, videoUrl: 'https://example.com/video.mp4' });
    assert.ok(result.includes('send_video') || result.includes('video'), 'должен использоваться send_video');
    assert.ok(result.includes('https://example.com/video.mp4'), 'URL должен быть в коде');
  });

  it('message: videoUrl задан → send_video', () => {
    const result = generateMessage({ ...baseMessage, videoUrl: 'https://example.com/video.mp4' });
    assert.ok(result.includes('send_video') || result.includes('video'));
  });
});

// ─── Тест 3: audioUrl ────────────────────────────────────────────────────────

describe('Медиа — Тест 3: audioUrl', () => {
  it('start: audioUrl задан → send_audio', () => {
    const result = generateStart({ ...baseStart, audioUrl: 'https://example.com/audio.mp3' });
    assert.ok(result.includes('send_audio') || result.includes('audio'), 'должен использоваться send_audio');
    assert.ok(result.includes('https://example.com/audio.mp3'), 'URL должен быть в коде');
  });

  it('message: audioUrl задан → send_audio', () => {
    const result = generateMessage({ ...baseMessage, audioUrl: 'https://example.com/audio.mp3' });
    assert.ok(result.includes('send_audio') || result.includes('audio'));
  });
});

// ─── Тест 4: documentUrl ─────────────────────────────────────────────────────

describe('Медиа — Тест 4: documentUrl', () => {
  it('start: documentUrl задан → send_document', () => {
    const result = generateStart({ ...baseStart, documentUrl: 'https://example.com/file.pdf' });
    assert.ok(result.includes('send_document') || result.includes('document'), 'должен использоваться send_document');
    assert.ok(result.includes('https://example.com/file.pdf'), 'URL должен быть в коде');
  });

  it('message: documentUrl задан → send_document', () => {
    const result = generateMessage({ ...baseMessage, documentUrl: 'https://example.com/file.pdf' });
    assert.ok(result.includes('send_document') || result.includes('document'));
  });
});

// ─── Тест 5: attachedMedia ───────────────────────────────────────────────────

describe('Медиа — Тест 5: attachedMedia (медиагруппа)', () => {
  it('start: attachedMedia с несколькими файлами → send_media_group', () => {
    const result = generateStart({
      ...baseStart,
      attachedMedia: [
        'https://example.com/img1.jpg',
        'https://example.com/img2.jpg',
      ],
    });
    assert.ok(
      result.includes('send_media_group') || result.includes('media_group') || result.includes('InputMediaPhoto'),
      'должна быть медиагруппа'
    );
  });

  it('start: attachedMedia пустой → нет медиагруппы', () => {
    const result = generateStart({ ...baseStart, attachedMedia: [] });
    assert.ok(!result.includes('send_media_group'), 'не должно быть медиагруппы');
  });

  it('message: attachedMedia с файлами → медиагруппа', () => {
    const result = generateMessage({
      ...baseMessage,
      attachedMedia: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
    });
    assert.ok(
      result.includes('send_media_group') || result.includes('media_group') || result.includes('InputMedia'),
      'должна быть медиагруппа'
    );
  });
});

// ─── Тест 6: Приоритет медиа ─────────────────────────────────────────────────

describe('Медиа — Тест 6: только один тип медиа', () => {
  it('start: только imageUrl → только send_photo, нет send_video', () => {
    const result = generateStart({ ...baseStart, imageUrl: 'https://example.com/img.jpg', videoUrl: '' });
    assert.ok(result.includes('send_photo') || result.includes('photo'));
    assert.ok(!result.includes('send_video'));
  });
});
