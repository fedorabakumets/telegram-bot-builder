/**
 * @fileoverview Тестовые данные для шаблона медиа-ноды
 * @module templates/media-node/media-node.fixture
 */

import type { MediaNodeTemplateParams } from './media-node.params';

/** Нода с одним фото */
export const fixtureOnePhoto: MediaNodeTemplateParams = {
  nodeId: 'media_photo_1',
  attachedMedia: ['https://example.com/image.jpg'],
};

/** Нода с одним видео */
export const fixtureOneVideo: MediaNodeTemplateParams = {
  nodeId: 'media_video_1',
  attachedMedia: ['https://example.com/video.mp4'],
};

/** Нода с одним аудио */
export const fixtureOneAudio: MediaNodeTemplateParams = {
  nodeId: 'media_audio_1',
  attachedMedia: ['https://example.com/audio.mp3'],
};

/** Нода с одним документом */
export const fixtureOneDocument: MediaNodeTemplateParams = {
  nodeId: 'media_doc_1',
  attachedMedia: ['https://example.com/file.pdf'],
};

/** Нода с несколькими файлами разных типов */
export const fixtureMixedGroup: MediaNodeTemplateParams = {
  nodeId: 'media_mixed_1',
  attachedMedia: [
    'https://example.com/photo.png',
    'https://example.com/video.mp4',
    'https://example.com/audio.ogg',
  ],
};

/** Нода с автопереходом */
export const fixtureWithAutoTransition: MediaNodeTemplateParams = {
  nodeId: 'media_auto_1',
  attachedMedia: ['https://example.com/photo.jpg'],
  enableAutoTransition: true,
  autoTransitionTo: 'next_node_1',
};

/** Нода с /uploads/ путями */
export const fixtureUploadPaths: MediaNodeTemplateParams = {
  nodeId: 'media_upload_1',
  attachedMedia: [
    '/uploads/photo.jpg',
    '/uploads/video.mp4',
  ],
};

/** Нода без файлов */
export const fixtureEmpty: MediaNodeTemplateParams = {
  nodeId: 'media_empty_1',
  attachedMedia: [],
};

/** Нода с переменной типа file (base64 из HTTP-запроса) */
export const fixtureFileVariable: MediaNodeTemplateParams = {
  nodeId: 'media_file_var_1',
  attachedMedia: ['{export_file}'],
};

/** Нода с переменной типа file — изображение (image/png) */
export const fixtureFileVariableImage: MediaNodeTemplateParams = {
  nodeId: 'media_file_img_1',
  attachedMedia: ['{qr_code}'],
};

/** Нода с переменной типа file — аудио (audio/mpeg) */
export const fixtureFileVariableAudio: MediaNodeTemplateParams = {
  nodeId: 'media_file_audio_1',
  attachedMedia: ['{track_file}'],
};

/** Нода с переменной типа file — видео (video/mp4) */
export const fixtureFileVariableVideo: MediaNodeTemplateParams = {
  nodeId: 'media_file_video_1',
  attachedMedia: ['{video_file}'],
};
