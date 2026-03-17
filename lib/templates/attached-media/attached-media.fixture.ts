/**
 * @fileoverview Тестовые данные для шаблона отправки прикреплённых медиафайлов
 * @module templates/attached-media/attached-media.fixture
 */

import type { AttachedMediaTemplateParams } from './attached-media.params';

/** Один локальный файл — фото */
export const validParamsSinglePhoto: AttachedMediaTemplateParams = {
  nodeId: 'node_1',
  attachedMedia: ['/uploads/photo.jpg'],
  formatMode: 'none',
  keyboardType: 'none',
  handlerContext: 'callback',
};

/** Одно внешнее видео */
export const validParamsSingleVideo: AttachedMediaTemplateParams = {
  nodeId: 'node_2',
  attachedMedia: ['https://example.com/video.mp4'],
  formatMode: 'html',
  keyboardType: 'none',
  handlerContext: 'message',
};

/** Один локальный документ */
export const validParamsSingleDocument: AttachedMediaTemplateParams = {
  nodeId: 'node_3',
  attachedMedia: ['/uploads/file.pdf'],
  formatMode: 'none',
  keyboardType: 'none',
  handlerContext: 'callback',
};

/** Одно аудио */
export const validParamsSingleAudio: AttachedMediaTemplateParams = {
  nodeId: 'node_4',
  attachedMedia: ['/uploads/audio.mp3'],
  formatMode: 'none',
  keyboardType: 'none',
  handlerContext: 'callback',
};

/** Несколько фото — медиагруппа */
export const validParamsMultiplePhotos: AttachedMediaTemplateParams = {
  nodeId: 'node_5',
  attachedMedia: ['/uploads/photo1.jpg', '/uploads/photo2.png', 'https://example.com/photo3.webp'],
  formatMode: 'none',
  keyboardType: 'none',
  handlerContext: 'callback',
};

/** Смешанные медиа: фото + документ */
export const validParamsMixedMedia: AttachedMediaTemplateParams = {
  nodeId: 'node_6',
  attachedMedia: ['/uploads/photo.jpg', '/uploads/doc.pdf'],
  formatMode: 'none',
  keyboardType: 'none',
  handlerContext: 'callback',
};

/** С inline клавиатурой — только первый файл */
export const validParamsWithInlineKeyboard: AttachedMediaTemplateParams = {
  nodeId: 'node_7',
  attachedMedia: ['/uploads/photo1.jpg', '/uploads/photo2.jpg'],
  formatMode: 'none',
  keyboardType: 'inline',
  handlerContext: 'callback',
};

/** С markdown форматированием */
export const validParamsMarkdown: AttachedMediaTemplateParams = {
  nodeId: 'node_8',
  attachedMedia: ['/uploads/photo.jpg'],
  formatMode: 'markdown',
  keyboardType: 'none',
  handlerContext: 'message',
};

/** Пустой массив медиа */
export const validParamsEmpty: AttachedMediaTemplateParams = {
  nodeId: 'node_9',
  attachedMedia: [],
  formatMode: 'none',
  keyboardType: 'none',
  handlerContext: 'callback',
};

/** Невалидные параметры: отсутствует nodeId */
export const invalidParamsMissingNodeId = {
  attachedMedia: ['/uploads/photo.jpg'],
};

/** Невалидные параметры: неправильный тип */
export const invalidParamsWrongType = {
  nodeId: 123,
  attachedMedia: '/uploads/photo.jpg', // должен быть массив
};
