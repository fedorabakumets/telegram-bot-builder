/**
 * @fileoverview Native-слушатели drag-and-drop файлов на DOM-узле (capture).
 * React-синтетика на input часто глотает FileList или глушит drop.
 * @module components/editor/properties/media/use-file-drop-target
 */

import { useEffect, type MutableRefObject, type RefObject } from 'react';
import { applyCompatibleDropEffect } from './apply-compatible-drop-effect';
import { filesFromDataTransfer, httpUrlsFromDataTransfer } from './files-from-data-transfer';

/** Колбэки зоны drop; читаются из ref, чтобы эффект не переподписывался */
export interface FileDropTargetHandlers {
  /** Блокировка во время загрузки */
  disabled: boolean;
  /** Курсор над зоной */
  setOver: (over: boolean) => void;
  /** Счётчик вложенных enter/leave */
  depthRef: MutableRefObject<number>;
  /** Файлы из DataTransfer */
  onFiles: (files: File[]) => void;
  /** http(s) ссылка без файла */
  onHttpUrl?: (url: string) => void;
  /** Drop без полезной нагрузки */
  onEmpty?: () => void;
}

/**
 * Вешает capture-слушатели dragenter/over/leave/drop на элемент.
 * @param rootRef - Корневой DOM зоны
 * @param handlersRef - Актуальные колбэки и флаги
 * @returns void
 */
export function useFileDropTarget(
  rootRef: RefObject<HTMLElement | null>,
  handlersRef: MutableRefObject<FileDropTargetHandlers>,
): void {
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const onEnter = (event: DragEvent): void => {
      const h = handlersRef.current;
      if (h.disabled) return;
      event.preventDefault();
      event.stopPropagation();
      h.depthRef.current += 1;
      h.setOver(true);
    };

    const onLeave = (): void => {
      const h = handlersRef.current;
      h.depthRef.current -= 1;
      if (h.depthRef.current > 0) return;
      h.depthRef.current = 0;
      h.setOver(false);
    };

    const onOver = (event: DragEvent): void => {
      const h = handlersRef.current;
      if (h.disabled) return;
      event.preventDefault();
      event.stopPropagation();
      if (event.dataTransfer) applyCompatibleDropEffect(event.dataTransfer);
    };

    /** Защита от двойного drop: Chrome с другой вкладки шлёт событие дважды, React state busy не успевает. */
    let dropLocked = false;
    let unlockTimer = 0;

    const onDrop = (event: DragEvent): void => {
      event.preventDefault();
      event.stopPropagation();
      const h = handlersRef.current;
      h.depthRef.current = 0;
      h.setOver(false);
      if (h.disabled || dropLocked) return;
      const files = filesFromDataTransfer(event.dataTransfer);
      const url = files.length > 0 ? undefined : httpUrlsFromDataTransfer(event.dataTransfer)[0];
      if (files.length === 0 && !url) {
        h.onEmpty?.();
        return;
      }
      dropLocked = true;
      unlockTimer = window.setTimeout(() => {
        dropLocked = false;
      }, 600);
      if (files.length > 0) h.onFiles(files);
      else if (url) h.onHttpUrl?.(url);
    };

    el.addEventListener('dragenter', onEnter);
    el.addEventListener('dragleave', onLeave);
    el.addEventListener('dragover', onOver, true);
    el.addEventListener('drop', onDrop, true);
    return () => {
      window.clearTimeout(unlockTimer);
      el.removeEventListener('dragenter', onEnter);
      el.removeEventListener('dragleave', onLeave);
      el.removeEventListener('dragover', onOver, true);
      el.removeEventListener('drop', onDrop, true);
    };
  }, [handlersRef, rootRef]);
}
