/**
 * @fileoverview Тестовые данные для шаблона отправки прикреплённых медиафайлов
 * @module templates/attached-media/attached-media.fixture
 */

import type { AttachedMediaTemplateParams } from './attached-media.params';

// ─── Ветка 3: обычные attachedMedia ───────────────────────────────────────────

export const validParamsSinglePhoto: AttachedMediaTemplateParams = {
  nodeId: 'node_1',
  attachedMedia: ['/uploads/photo.jpg'],
  formatMode: 'none',
  keyboardType: 'none',
  handlerContext: 'callback',
};

export const validParamsSingleVideo: AttachedMediaTemplateParams = {
  nodeId: 'node_2',
  attachedMedia: ['https://example.com/video.mp4'],
  formatMode: 'html',
  keyboardType: 'none',
  handlerContext: 'message',
};

export const validParamsSingleDocument: AttachedMediaTemplateParams = {
  nodeId: 'node_3',
  attachedMedia: ['/uploads/file.pdf'],
  formatMode: 'none',
  keyboardType: 'none',
  handlerContext: 'callback',
};

export const validParamsSingleAudio: AttachedMediaTemplateParams = {
  nodeId: 'node_4',
  attachedMedia: ['/uploads/audio.mp3'],
  formatMode: 'none',
  keyboardType: 'none',
  handlerContext: 'callback',
};

export const validParamsMultiplePhotos: AttachedMediaTemplateParams = {
  nodeId: 'node_5',
  attachedMedia: ['/uploads/photo1.jpg', '/uploads/photo2.png', 'https://example.com/photo3.webp'],
  formatMode: 'none',
  keyboardType: 'none',
  handlerContext: 'callback',
};

export const validParamsMixedMedia: AttachedMediaTemplateParams = {
  nodeId: 'node_6',
  attachedMedia: ['/uploads/photo.jpg', '/uploads/doc.pdf'],
  formatMode: 'none',
  keyboardType: 'none',
  handlerContext: 'callback',
};

export const validParamsWithInlineKeyboard: AttachedMediaTemplateParams = {
  nodeId: 'node_7',
  attachedMedia: ['/uploads/photo1.jpg', '/uploads/photo2.jpg'],
  formatMode: 'none',
  keyboardType: 'inline',
  handlerContext: 'callback',
};

export const validParamsMarkdown: AttachedMediaTemplateParams = {
  nodeId: 'node_8',
  attachedMedia: ['/uploads/photo.jpg'],
  formatMode: 'markdown',
  keyboardType: 'none',
  handlerContext: 'message',
};

export const validParamsEmpty: AttachedMediaTemplateParams = {
  nodeId: 'node_9',
  attachedMedia: [],
  formatMode: 'none',
  keyboardType: 'none',
  handlerContext: 'callback',
};

/** С autoTransitionTo — генерирует FakeCallbackQuery */
export const validParamsWithAutoTransition: AttachedMediaTemplateParams = {
  nodeId: 'node_10',
  attachedMedia: ['/uploads/photo.jpg'],
  formatMode: 'none',
  keyboardType: 'none',
  handlerContext: 'message',
  autoTransitionTo: 'node_next',
};

/** С fallbackUseSafeEdit */
export const validParamsWithSafeEditFallback: AttachedMediaTemplateParams = {
  nodeId: 'node_11',
  attachedMedia: ['/uploads/photo.jpg'],
  formatMode: 'html',
  keyboardType: 'none',
  handlerContext: 'callback',
  fallbackUseSafeEdit: true,
};

// ─── Ветка 1: статическое изображение ─────────────────────────────────────────

/** Статическое изображение — внешний URL */
export const validParamsStaticImageExternal: AttachedMediaTemplateParams = {
  nodeId: 'node_static_1',
  attachedMedia: [],
  handlerContext: 'callback',
  staticImageUrl: 'https://example.com/image.jpg',
};

/** Статическое изображение — локальный файл */
export const validParamsStaticImageLocal: AttachedMediaTemplateParams = {
  nodeId: 'node_static_2',
  attachedMedia: [],
  handlerContext: 'message',
  staticImageUrl: '/uploads/banner.png',
};

/** Статическое изображение с isFakeCallbackCheck */
export const validParamsStaticImageFakeCallback: AttachedMediaTemplateParams = {
  nodeId: 'node_static_3',
  attachedMedia: [],
  handlerContext: 'callback',
  staticImageUrl: 'https://example.com/image.jpg',
  isFakeCallbackCheck: true,
};

/** Статическое изображение с autoTransitionTo */
export const validParamsStaticImageAutoTransition: AttachedMediaTemplateParams = {
  nodeId: 'node_static_4',
  attachedMedia: [],
  handlerContext: 'message',
  staticImageUrl: '/uploads/photo.jpg',
  autoTransitionTo: 'node_after',
};

/** Статическое изображение с waitingStateCode */
export const validParamsStaticImageWaitingState: AttachedMediaTemplateParams = {
  nodeId: 'node_static_5',
  attachedMedia: [],
  handlerContext: 'callback',
  staticImageUrl: 'https://example.com/image.jpg',
  waitingStateCode: '        await state.set_state(UserState.waiting_input)',
};

/** Статическое изображение с fallbackUseSafeEdit */
export const validParamsStaticImageSafeEdit: AttachedMediaTemplateParams = {
  nodeId: 'node_static_6',
  attachedMedia: [],
  handlerContext: 'callback',
  staticImageUrl: 'https://example.com/image.jpg',
  fallbackUseSafeEdit: true,
};

// ─── Ветка 2: динамическое медиа из БД ────────────────────────────────────────

/** Динамическое фото из переменной БД */
export const validParamsDynamicPhoto: AttachedMediaTemplateParams = {
  nodeId: 'node_dyn_1',
  attachedMedia: [],
  handlerContext: 'callback',
  mediaVariable: 'photo_url_node_dyn_1',
  mediaType: 'photo',
};

/** Динамическое видео из переменной БД */
export const validParamsDynamicVideo: AttachedMediaTemplateParams = {
  nodeId: 'node_dyn_2',
  attachedMedia: [],
  handlerContext: 'message',
  mediaVariable: 'video_url_node_dyn_2',
  mediaType: 'video',
};

/** Динамическое медиа с autoTransitionTo */
export const validParamsDynamicAutoTransition: AttachedMediaTemplateParams = {
  nodeId: 'node_dyn_3',
  attachedMedia: [],
  handlerContext: 'message',
  mediaVariable: 'photo_url_node_dyn_3',
  mediaType: 'photo',
  autoTransitionTo: 'node_target',
};

/** Динамическое медиа с fallbackUseSafeEdit */
export const validParamsDynamicSafeEdit: AttachedMediaTemplateParams = {
  nodeId: 'node_dyn_4',
  attachedMedia: [],
  handlerContext: 'callback',
  mediaVariable: 'audio_url_node_dyn_4',
  mediaType: 'audio',
  fallbackUseSafeEdit: true,
};

// ─── Невалидные параметры ──────────────────────────────────────────────────────

export const invalidParamsMissingNodeId = {
  attachedMedia: ['/uploads/photo.jpg'],
};

export const invalidParamsWrongType = {
  nodeId: 123,
  attachedMedia: '/uploads/photo.jpg',
};
