/** @fileoverview Полноэкранный просмотр медиафайла с доступным закрытием и возвратом фокуса. */
import * as Dialog from '@radix-ui/react-dialog';
import { X, ImageOff } from 'lucide-react';
import { useState } from 'react';
import type { ProjectFile } from '../../hooks/use-project-files';
import { isVideoFile } from './media-thumbnail';
import { getPreviewUrl } from './files-table-utils';

/** Свойства полноэкранного просмотра. */
interface FilePreviewDialogProps {
  /** Открытый файл или отсутствие выбора. */
  file: ProjectFile | null;
  /** Проект для защищённого доступа к медиа. */
  projectId: number;
  /** Закрытие просмотра. */
  onClose: () => void;
}

/**
 * Показывает изображение или видео в пределах экрана без обрезки.
 * @param props - Файл, проект и закрытие
 * @returns Полноэкранный диалог
 */
export function FilePreviewDialog({ file, projectId, onClose }: FilePreviewDialogProps) {
  const [failed, setFailed] = useState(false);
  const url = file ? getPreviewUrl(file, projectId) : null;
  const video = file && isVideoFile(file);
  return (
    <Dialog.Root open={!!file} onOpenChange={(open) => { if (!open) { setFailed(false); onClose(); } }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/95" />
        <Dialog.Content aria-describedby={undefined} className="fixed inset-0 z-[101] flex h-[100dvh] w-full flex-col bg-[#0a0a0a] text-white outline-none">
          <header className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 p-4">
            <Dialog.Title className="min-w-0 truncate text-sm font-medium">{file?.fileName ?? 'Просмотр файла'}</Dialog.Title>
            <Dialog.Close aria-label="Закрыть просмотр" title="Закрыть · Esc" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
              <X className="h-5 w-5" />
            </Dialog.Close>
          </header>
          <div className="flex min-h-0 flex-1 items-center justify-center p-4">
            {failed || !url ? <div role="status" className="flex flex-col items-center gap-3 text-sm text-white/70"><ImageOff className="h-8 w-8" />Не удалось загрузить файл</div>
              : video ? <video src={url} controls playsInline className="max-h-full max-w-full object-contain" onError={() => setFailed(true)} />
                : <img src={url} alt={file?.fileName ?? 'Изображение'} className="h-full w-full object-contain" onError={() => setFailed(true)} />}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
