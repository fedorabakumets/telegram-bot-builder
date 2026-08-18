/**
 * @fileoverview Хук ручной загрузки файлов во вкладке/модалке «Файлы».
 * Шлёт файлы по одному через `useUploadMedia` (S3/local + квота),
 * ограничивает пачку и инвалидирует список после завершения.
 * @module components/editor/files/panel/use-file-upload
 */

import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useToast } from '@/hooks/use-toast';
import { useUploadMedia } from '@/components/editor/properties/hooks/use-media';

/** Максимум файлов за один выбор (лимит multer) */
export const MAX_UPLOAD_FILES = 20;

/** Колбэк после пачки загрузки: id успешно записанных файлов */
export type OnFilesUploaded = (uploadedIds: number[]) => void;

/** Результат хука загрузки файлов панели */
export interface UseFileUploadResult {
  /** Загрузить выбранные файлы в целевое хранилище */
  uploadFiles: (files: File[], storageConfigId?: string) => Promise<void>;
  /** Идёт ли загрузка пачки */
  isUploading: boolean;
}

/**
 * Хук последовательной загрузки файлов с тостом и обновлением списка.
 * @param projectId - ID проекта
 * @param onUploaded - Колбэк после завершения пачки (id успешных файлов)
 * @returns Функция загрузки и флаг процесса
 */
export function useFileUpload(
  projectId: number,
  onUploaded?: OnFilesUploaded,
): UseFileUploadResult {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { mutateAsync } = useUploadMedia(projectId);
  const [isUploading, setIsUploading] = useState(false);

  const uploadFiles = useCallback(
    async (files: File[], storageConfigId?: string) => {
      if (files.length === 0) return;
      const batch = files.slice(0, MAX_UPLOAD_FILES);
      if (files.length > MAX_UPLOAD_FILES) {
        toast({
          title: `За раз не больше ${MAX_UPLOAD_FILES} файлов`,
          description: `Будут загружены первые ${MAX_UPLOAD_FILES}`,
        });
      }

      setIsUploading(true);
      let success = 0;
      let failed = 0;
      const uploadedIds: number[] = [];
      try {
        for (const file of batch) {
          try {
            const result = await mutateAsync({ file, storageConfigId });
            success += 1;
            if (typeof result?.id === 'number') uploadedIds.push(result.id);
          } catch {
            failed += 1;
          }
        }
        await queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'files'] });
        await queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'storage-quota'] });
        onUploaded?.(uploadedIds);
        if (success > 0 && failed === 0) {
          toast({
            title: success === 1 ? 'Файл загружен и выбран' : `Загружено и выбрано файлов: ${success}`,
            description: 'Нажми «Прикрепить» внизу, чтобы добавить файл к ноде.',
          });
        } else if (success > 0) {
          toast({ title: `Загружено ${success}, ошибок: ${failed}`, variant: 'destructive' });
        } else {
          toast({ title: 'Не удалось загрузить файлы', variant: 'destructive' });
        }
      } finally {
        setIsUploading(false);
      }
    },
    [onUploaded, projectId, queryClient, toast, mutateAsync],
  );

  return { uploadFiles, isUploading };
}
