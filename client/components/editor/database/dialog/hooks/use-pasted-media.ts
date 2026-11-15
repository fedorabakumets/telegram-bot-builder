/**
 * @fileoverview Загрузка файлов из буфера обмена как вложений сообщения.
 */
import { useRef, useState, type ClipboardEvent } from 'react';
import { useUploadMedia } from '@/components/editor/properties/hooks/use-media';
import { useToast } from '@/hooks/use-toast';
import { MAX_UPLOAD_FILES } from '@/components/editor/files/panel/use-file-upload';

/**
 * Прикрепляет вставленные файлы через обычное хранилище проекта.
 * @param projectId - Проект, которому принадлежат вложения.
 * @param onAttached - Добавление успешно загруженных адресов к сообщению.
 * @returns Обработчик вставки и признак незавершённой загрузки.
 */
export function usePastedMedia(projectId: number, onAttached: (urls: string[]) => void) {
  const { mutateAsync } = useUploadMedia(projectId);
  const { toast } = useToast();
  const pending = useRef(0);
  const [isUploading, setIsUploading] = useState(false);
  /** Загружает пакет с сохранением успешных файлов при частичной ошибке. */
  const upload = async (files: File[]) => {
    pending.current += 1;
    setIsUploading(true);
    const urls: string[] = [];
    try {
      for (const file of files.slice(0, MAX_UPLOAD_FILES)) {
        try {
          const result = await mutateAsync({ file });
          if (!result.url) throw new Error('Сервер не вернул адрес файла');
          urls.push(result.url);
        } catch (error) {
          toast({ title: 'Не удалось прикрепить файл', description: error instanceof Error ? error.message : file.name, variant: 'destructive' });
        }
      }
      if (urls.length) onAttached(urls);
      if (files.length > MAX_UPLOAD_FILES) toast({ title: `За одну вставку можно загрузить до ${MAX_UPLOAD_FILES} файлов` });
    } finally {
      pending.current -= 1;
      setIsUploading(pending.current > 0);
    }
  };
  /** Перехватывает файлы до текстового обработчика редактора; обычный текст пропускается. */
  const onPasteCapture = (event: ClipboardEvent<HTMLElement>) => {
    const files = Array.from(event.clipboardData.files);
    if (!files.length) return;
    event.preventDefault();
    event.stopPropagation();
    void upload(files);
  };
  return { onPasteCapture, isUploading };
}
