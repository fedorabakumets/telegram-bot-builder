/**
 * @fileoverview Баррель-экспорт модуля панели свойств
 *
 * Централизованный экспорт всех компонентов, утилит, хуков
 * и конфигураций для работы с панелью свойств редактора ботов.
 *
 * @module components/editor/properties
 */

// Компоненты
export * from './components';

// React хуки
export * from './hooks';

// Утилиты
export * from './utils';

// Типы
export * from './types';

// Константы
export * from './constants';

// Медиа компоненты
export * from './media';

// Медиа типы
export type { MediaFileData } from './media/media-files-list';
