/**
 * @fileoverview Выбор картинок для сообщения поддержки: кнопка, вставка и перетаскивание
 * @module components/support/hooks/use-support-composer-files
 */

import { useEffect, useRef, useState, type ClipboardEvent, type DragEvent } from "react";
import { detectSupportImage, SUPPORT_IMAGE_MAX_BYTES } from "@shared/support/support-image";

/** Картинка, выбранная, но ещё не отправленная */
export interface PendingSupportImage {
  /** Файл для FormData */
  file: File;
  /** Локальный адрес превью */
  url: string;
}

/** Ключ, чтобы не добавить одну картинку дважды. @param file - Файл. @returns Имя, размер и время */
function fileKey(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

/**
 * Собирает файлы из буфера: и снимок экрана, и скопированные файлы
 * @param data - Данные события paste
 * @returns Список файлов
 */
function filesFromClipboard(data: DataTransfer | null): File[] {
  const found: File[] = [];
  if (data?.items) {
    for (const item of data.items) {
      if (item.kind !== "file") continue;
      const file = item.getAsFile();
      if (file) found.push(file);
    }
  }
  for (const file of data?.files ?? []) {
    if (!found.includes(file)) found.push(file);
  }
  return found;
}

/**
 * Держит список выбранных картинок и обработчики вставки и перетаскивания
 * @returns Состояние и действия поля ввода
 */
export function useSupportComposerFiles() {
  const [images, setImages] = useState<PendingSupportImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef(images);
  imagesRef.current = images;

  useEffect(() => () => {
    for (const image of imagesRef.current) URL.revokeObjectURL(image.url);
  }, []);

  /**
   * Добавляет только картинки не больше 8 МБ
   * @param incoming - Файлы из кнопки, буфера или перетаскивания
   */
  const addFiles = async (incoming: File[]) => {
    const next: PendingSupportImage[] = [];
    let problem: string | null = null;
    const seen = new Set(imagesRef.current.map((item) => fileKey(item.file)));
    for (const file of incoming) {
      const key = fileKey(file);
      if (seen.has(key)) continue;
      if (file.size > SUPPORT_IMAGE_MAX_BYTES) {
        problem = "Файл больше 8 МБ";
        continue;
      }
      const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
      if (!detectSupportImage(head)) {
        problem = "Можно отправить только картинку";
        continue;
      }
      seen.add(key);
      next.push({ file, url: URL.createObjectURL(file) });
    }
    if (problem) setError(problem);
    else if (next.length > 0) setError(null);
    if (next.length > 0) setImages((current) => [...current, ...next]);
  };

  /**
   * Убирает картинку до отправки
   * @param url - Адрес превью
   */
  const removeImage = (url: string) => {
    URL.revokeObjectURL(url);
    setImages((current) => current.filter((item) => item.url !== url));
  };

  /**
   * Очищает список после успешной отправки
   */
  const clearImages = () => {
    for (const image of imagesRef.current) URL.revokeObjectURL(image.url);
    setImages([]);
    setError(null);
  };

  /**
   * Вставка картинки из буфера
   * @param event - Событие paste
   */
  const onPaste = (event: ClipboardEvent) => {
    const found = filesFromClipboard(event.clipboardData);
    if (found.length === 0) return;
    event.preventDefault();
    void addFiles(found);
  };

  /**
   * Подсветка, пока файл над полем
   * @param event - Событие dragover
   */
  const onDragOver = (event: DragEvent) => {
    if (!event.dataTransfer.types.includes("Files")) return;
    event.preventDefault();
    setDragOver(true);
  };

  /**
   * Принимает перетащенные файлы
   * @param event - Событие drop
   */
  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    void addFiles([...event.dataTransfer.files]);
  };

  return {
    images,
    error,
    dragOver,
    inputRef,
    addFiles,
    removeImage,
    clearImages,
    onPaste,
    onDragOver,
    onDragLeave: () => setDragOver(false),
    onDrop,
  };
}
