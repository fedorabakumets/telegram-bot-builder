/**
 * @fileoverview Барель-экспорт контейнеров панели файлового хранилища.
 * Контейнеры — тонкие обёртки над переиспользуемой `FileStoragePanel`
 * (страница и модалка); вся логика живёт в панели (Req 1.6).
 * @module components/editor/files/containers
 */

export { FilesTabPage } from './files-tab-page';
export type { FilesTabPageProps } from './files-tab-page';
export { FileStorageModal } from './file-storage-modal';
export type { FileStorageModalProps } from './file-storage-modal';
