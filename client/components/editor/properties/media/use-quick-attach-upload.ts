/**
 * @fileoverview Быстрая загрузка файлов с диска/буфера и сразу в `attachedMedia`.
 * @module components/editor/properties/media/use-quick-attach-upload
 */

import { useCallback, useState } from 'react';

import { useToast } from '@/hooks/use-toast';
import { useUploadMedia } from '../hooks/use-media';
import { MAX_UPLOAD_FILES } from '../../files/panel/use-file-upload';

/** Результат хука быстрой загрузки с прикреплением */
export interface UseQuickAttachUploadResult {
  /** Загрузить файлы и вернуть их URL для attachedMedia */
  uploadAndAttach: (files: File[]) => Promise<void>;
  /** Идёт загрузка */
  isUploading: boolean;
}

/**
 * Загружает файлы в хранилище проекта и сразу отдаёт URL для прикрепления к ноде.
 * @param projectId - ID проекта
 * @param onAttached - Колбэк со списком URL успешно загруженных файлов
 * @returns Функция загрузки и флаг процесса
 */
export function useQuickAttachUpload(
  projectId: number,
  onAttached: (urls: string[]) => void,
): UseQuickAttachUploadResult {
  const { toast } = useToast();
  const { mutateAsync } = useUploadMedia(projectId);
  const [isUploading, setIsUploading] = useState(false);

  const uploadAndAttach = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      const batch = files.slice(0, MAX_UPLOAD_FILES);
      setIsUploading(true);
      const urls: string[] = [];
      let failed = 0;
      try {
        for (const file of batch) {
          try {
            const result = await mutateAsync({ file });
            const url = typeof result?.url === 'string' ? result.url.trim() : '';
            if (url) urls.push(url);
            else failed += 1;
          } catch {
            failed += 1;
          }
        }
        if (urls.length > 0) {
          onAttached(urls);
          toast({
            title: urls.length === 1 ? 'Файл прикреплён к ноде' : `Прикреплено файлов: ${urls.length}`,
          });
        }
        if (failed > 0) {
          toast({ title: `Не удалось загрузить: ${failed}`, variant: 'destructive' });
        }
      } finally {
        setIsUploading(false);
      }
    },
    [mutateAsync, onAttached, toast],
  );

  return { uploadAndAttach, isUploading };
}
