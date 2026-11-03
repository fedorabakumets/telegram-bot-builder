/** @fileoverview Общие категории и типы файлов проекта для HTTP и MCP. */
/** Допустимые типы медиа. */
export const MEDIA_TYPES = ['photo', 'video', 'animation', 'audio', 'voice', 'video_note', 'document', 'sticker'] as const;
/** Тип фильтра обложек. */
export const COVER_TYPE = 'cover' as const;
/** Источники файлов. */
export const VALID_SOURCES = ['incoming', 'outgoing', 'uploaded'] as const;
/** Категории файлов. */
export const VALID_CATEGORIES = ['all', 'incoming', 'outgoing', 'uploaded'] as const;
