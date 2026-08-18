/**
 * @fileoverview Зона, куда можно перетащить файл из проводника или другого приложения.
 * @module components/editor/properties/media/media-drop-zone
 */

import { useRef, useState } from 'react';
import { cn } from '@/utils/utils';
import { useFileDropTarget, type FileDropTargetHandlers } from './use-file-drop-target';

/** Пропсы зоны перетаскивания файлов */
export interface MediaDropZoneProps {
  /** Блокировка во время загрузки */
  disabled?: boolean;
  /** Файлы, перенесённые из другого приложения */
  onFiles: (files: File[]) => void;
  /** http(s) ссылка, если перетащили картинку из браузера без файла */
  onHttpUrl?: (url: string) => void;
  /** Drop без файла и без URL — чтобы показать подсказку */
  onEmpty?: () => void;
  /** Содержимое зоны */
  children: React.ReactNode;
}

/**
 * Подсветка при наведении. Оверлей перехватывает курсор, чтобы input не съедал drop.
 * Слушатели native/capture — иначе OS-drop над полем URL часто не доходит до React.
 * @param props - Колбэки и содержимое
 * @returns JSX обёртки
 */
export function MediaDropZone({
  disabled = false,
  onFiles,
  onHttpUrl,
  onEmpty,
  children,
}: MediaDropZoneProps): React.JSX.Element {
  const [over, setOver] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const depthRef = useRef(0);
  const handlersRef = useRef<FileDropTargetHandlers>({
    disabled,
    setOver,
    depthRef,
    onFiles,
    onHttpUrl,
    onEmpty,
  });
  handlersRef.current = { disabled, setOver, depthRef, onFiles, onHttpUrl, onEmpty };
  useFileDropTarget(rootRef, handlersRef);

  return (
    <div
      ref={rootRef}
      className={cn(
        'relative rounded-lg transition-colors',
        over && !disabled && 'ring-2 ring-primary bg-primary/5',
      )}
      data-testid="media-drop-zone"
      data-over={over && !disabled ? 'true' : 'false'}
    >
      {children}
      {over && !disabled && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-primary/15 ring-2 ring-inset ring-primary"
          data-testid="media-drop-overlay"
        >
          <p className="pointer-events-none px-2 text-center text-xs font-medium text-primary">
            Отпусти, чтобы прикрепить к ноде
          </p>
        </div>
      )}
    </div>
  );
}
