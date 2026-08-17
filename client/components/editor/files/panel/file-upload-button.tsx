/**
 * @fileoverview Кнопка «Загрузить» шапки панели файлов (`FileUploadButton`).
 * Скрытый file-input + выбор writable-хранилища (если их больше одного).
 * Пишет через POST /api/media/upload/:projectId (Req 11.7).
 * @module components/editor/files/panel/file-upload-button
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import { Loader2, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useStorageConfigs } from '../hooks/use-storage-configs';
import { listWritable, toStorageInfo } from './storage/storage-info';
import { StorageTargetSelector } from './storage/storage-target-selector';
import { FileClipboardButton } from './file-clipboard-button';
import { useFileUpload } from './use-file-upload';

/** Пропсы кнопки загрузки файлов в шапке панели */
export interface FileUploadButtonProps {
  /** ID проекта, в который пишутся файлы */
  projectId: number;
  /** Колбэк после завершения пачки (переключение категории / refresh) */
  onUploaded?: () => void;
}

/**
 * Кнопка загрузки файлов с диска и селектор цели (при нескольких хранилищах).
 * @param props - Проект и колбэк после загрузки
 * @returns JSX кнопки, скрытого input и опционального селектора
 */
export function FileUploadButton({
  projectId,
  onUploaded,
}: FileUploadButtonProps): React.JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploadFiles, isUploading } = useFileUpload(projectId, onUploaded);
  const { configs } = useStorageConfigs();
  const storages = useMemo(() => configs.map(toStorageInfo), [configs]);
  const writable = useMemo(() => listWritable(storages), [storages]);
  const defaultId = writable.find((s) => s.isActive)?.configId ?? writable[0]?.configId ?? '';
  const [overrideId, setOverrideId] = useState<string | null>(null);
  const targetId =
    overrideId && writable.some((s) => s.configId === overrideId) ? overrideId : defaultId;

  /**
   * Открывает системный диалог выбора файлов.
   * @returns void
   */
  const openPicker = (): void => {
    if (!isUploading) inputRef.current?.click();
  };

  /**
   * Запускает загрузку выбранных файлов и сбрасывает input.
   * @param event - Событие смены файлов
   * @returns void
   */
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    event.target.value = '';
    void uploadFiles(files, targetId || undefined);
  };

  /** Загрузка файлов из буфера (кнопка и Ctrl+V) */
  const handleClipboardFiles = useCallback(
    (files: File[]) => {
      void uploadFiles(files, targetId || undefined);
    },
    [targetId, uploadFiles],
  );

  return (
    <>
      {writable.length > 1 && (
        <StorageTargetSelector
          storages={storages}
          value={targetId}
          onChange={setOverrideId}
          disabled={isUploading}
        />
      )}
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        data-testid="file-storage-upload-input"
        onChange={handleChange}
      />
      <Button
        type="button"
        variant="default"
        size="sm"
        className="h-8"
        disabled={isUploading}
        onClick={openPicker}
        title="Загрузить файлы с устройства"
        data-testid="file-storage-upload"
      >
        {isUploading ? (
          <Loader2 className="h-3.5 w-3.5 sm:mr-1.5 animate-spin" />
        ) : (
          <Upload className="h-3.5 w-3.5 sm:mr-1.5" />
        )}
        <span className="hidden sm:inline">{isUploading ? 'Загрузка…' : 'Загрузить'}</span>
      </Button>
      <FileClipboardButton disabled={isUploading} onFiles={handleClipboardFiles} />
    </>
  );
}
