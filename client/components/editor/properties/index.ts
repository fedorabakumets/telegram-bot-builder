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

// Логгеры действий (в components)
export * from './components/action-loggers';

// Конфигурации типов узлов (в components)
export * from './components/configuration';

// React хуки
export * from './hooks';

// Утилиты
export * from './utils';

// Медиа компоненты
export * from './media/media-manager';
export * from './media/media-selector';
export * from './media/enhanced-media-uploader';
export * from './media/camera-capture';
export * from './media/file-optimizer';
export * from './media/url-downloader';
