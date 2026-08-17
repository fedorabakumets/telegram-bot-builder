/**
 * @fileoverview Кнопки действий шапки панели файлов: загрузка, хранилища,
 * документация и обновление списка. Вынесены из FileStorageHeader, чтобы
 * шапка оставалась в пределах лимита строк.
 * @module components/editor/files/panel/file-storage-header-actions
 */

import { BookOpen, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { StorageManagerButton } from './storage/storage-manager-button';
import { FileUploadButton } from './file-upload-button';

/** URL документации по интерфейсу файлового хранилища */
const DOCS_URL = 'https://fedorabakumets.github.io/wikinest/interface/files';

/** Пропсы группы кнопок шапки файлового хранилища */
export interface FileStorageHeaderActionsProps {
  /** ID текущего проекта (для загрузки) */
  projectId: number;
  /** Принудительное обновление списка файлов */
  onRefresh: () => void;
  /** Колбэк после успешной загрузки файлов */
  onUploaded?: () => void;
}

/**
 * Кнопки действий шапки: загрузка, хранилища, документация, обновление.
 * @param props - Проект и колбэки шапки
 * @returns JSX группы кнопок
 */
export function FileStorageHeaderActions({
  projectId,
  onRefresh,
  onUploaded,
}: FileStorageHeaderActionsProps): React.JSX.Element {
  return (
    <>
      <FileUploadButton projectId={projectId} onUploaded={onUploaded ?? onRefresh} />
      <StorageManagerButton />
      <Button type="button" variant="outline" size="sm" className="h-8" asChild>
        <a
          href={DOCS_URL}
          target="_blank"
          rel="noopener noreferrer"
          title="Документация по файловому хранилищу"
          data-testid="file-storage-docs-link"
        >
          <BookOpen className="h-3.5 w-3.5 sm:mr-1.5" />
          <span className="hidden sm:inline">Документация</span>
        </a>
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-foreground"
        onClick={onRefresh}
        title="Обновить список файлов"
        data-testid="file-storage-refresh"
      >
        <RefreshCw className="h-4 w-4" />
      </Button>
    </>
  );
}
