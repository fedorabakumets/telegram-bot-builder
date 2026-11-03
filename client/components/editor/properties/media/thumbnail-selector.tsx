/**
 * @fileoverview Компонент выбора обложки для видеофайла
 *
 * Встроенный блок без диалога — поле URL и кнопка открытия MediaManager.
 * Обложка сохраняется только в ноду project.json (attachedMediaThumbnails) — без запросов к БД.
 * Текущая обложка отображается через MediaFileCard для единообразия с карточками видео/фото.
 *
 * @module media/thumbnail-selector
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload } from "lucide-react";
import { MediaManager } from "./media-manager";
import { MediaFileCard } from "./media-file-card";
import { apiRequest } from "@/queryClient";
import type { MediaFile } from "@shared/schema";
import { validateThumbnailUrl } from "./use-thumbnail-validation";
import { useMediaFiles } from "../hooks/use-media";

/** Пропсы компонента ThumbnailSelector */
export interface ThumbnailSelectorProps {
  /** Текущий URL обложки (из ноды project.json) */
  currentThumbnailUrl?: string | null;
  /** ID проекта для загрузки фото */
  projectId: number;
  /**
   * ID видеофайла в БД (опционально).
   * Если передан — при установке обложки сбрасывается telegramFileId видео,
   * чтобы бот переотправил видео через FSInputFile и Telegram принял обложку.
   */
  videoFileId?: number;
  /** Callback при установке/сбросе обложки — передаёт URL обложки или null */
  onThumbnailSet?: (thumbnailUrl: string | null) => void;
}

/**
 * Встроенный блок выбора обложки видео.
 * Сохраняет обложку только в ноду project.json через onThumbnailSet — без запросов к БД.
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function ThumbnailSelector({
  currentThumbnailUrl,
  projectId,
  videoFileId,
  onThumbnailSet,
}: ThumbnailSelectorProps) {
  /** Флаг открытия MediaManager */
  const [isOpen, setIsOpen] = useState(false);
  /** URL из поля ввода */
  const [urlInput, setUrlInput] = useState("");
  /** Предупреждения валидации (не блокируют применение) */
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  /** Ошибки валидации (блокируют кнопку ОК) */
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  /** Все файлы проекта — нужны для поиска метаданных обложки */
  const { data: allFiles } = useMediaFiles(projectId);
  /** Файл обложки из БД — ищем по URL */
  const thumbFile = allFiles?.find(f => f.url === currentThumbnailUrl);

  /** URL для превью */
  const previewUrl = currentThumbnailUrl;

  /**
   * Сбрасывает telegramFileId видео в БД, чтобы бот переотправил его через FSInputFile.
   * Telegram принимает thumbnail= только при первой загрузке файла.
   */
  const resetVideoFileId = async () => {
    if (!videoFileId) return;
    try {
      await apiRequest('PUT', `/api/media/${videoFileId}`, { telegramFileId: null });
    } catch (e) {
      console.warn('Не удалось сбросить telegramFileId видео:', e);
    }
  };

  /**
   * Обрабатывает изменение поля URL — запускает валидацию по расширению.
   * @param url - Введённый URL
   */
  const handleUrlChange = (url: string) => {
    setUrlInput(url);
    if (url.trim()) {
      const result = validateThumbnailUrl(url.trim());
      setValidationWarnings(result.warnings);
      setValidationErrors(result.errors);
    } else {
      setValidationWarnings([]);
      setValidationErrors([]);
    }
  };

  /**
   * Устанавливает обложку по объекту MediaFile — берёт URL файла и валидирует.
   * Сбрасывает telegramFileId видео чтобы Telegram принял обложку при следующей отправке.
   * @param file - Выбранный медиафайл
   */
  const handleSelectFile = async (file: MediaFile) => {
    const result = validateThumbnailUrl(file.url);
    setValidationWarnings(result.warnings);
    setValidationErrors(result.errors);
    await resetVideoFileId();
    onThumbnailSet?.(file.url);
    setIsOpen(false);
  };

  /**
   * Применяет обложку по введённому URL напрямую.
   * Сбрасывает telegramFileId видео чтобы Telegram принял обложку при следующей отправке.
   */
  const handleApplyUrl = async () => {
    const trimmed = urlInput.trim();
    if (!trimmed || validationErrors.length > 0) return;
    await resetVideoFileId();
    onThumbnailSet?.(trimmed);
    setUrlInput("");
    setValidationWarnings([]);
    setValidationErrors([]);
  };

  /**
   * Убирает обложку и сбрасывает состояние валидации
   */
  const handleRemove = () => {
    onThumbnailSet?.(null);
    setValidationWarnings([]);
    setValidationErrors([]);
  };

  return (
    <div className="mt-2 space-y-2 border-t border-slate-200/40 dark:border-slate-700/40 pt-2">
      {/* Заголовок секции */}
      <div className="flex items-center">
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">🖼 Обложка видео</span>
      </div>

      {/* Превью текущей обложки через MediaFileCard */}
      {previewUrl && (
        <MediaFileCard
          url={previewUrl}
          fileName={thumbFile?.fileName ?? 'Обложка'}
          fileType={thumbFile?.fileType ?? 'photo'}
          telegramFileId={thumbFile?.telegramFileId ?? null}
          projectId={projectId}
          onRemove={handleRemove}
        />
      )}

      {/* Поле ввода URL — показываем только если обложка не установлена */}
      {!previewUrl && (
        <div className="flex gap-2">
          <Input
            value={urlInput}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="URL фото обложки"
            className="h-8 text-xs flex-1"
            onKeyDown={(e) => e.key === "Enter" && handleApplyUrl()}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={handleApplyUrl}
            disabled={!urlInput.trim() || validationErrors.length > 0}
            className="h-8 px-2 text-xs shrink-0"
          >
            ОК
          </Button>
        </div>
      )}

      {/* Блоки валидации и кнопка выбора — только если обложка не установлена */}
      {!previewUrl && (
        <>
          {/* Блок ошибок валидации — блокируют применение */}
          {validationErrors.length > 0 && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-2 py-1.5 space-y-0.5">
              {validationErrors.map((err, i) => (
                <p key={i} className="text-xs text-red-600 dark:text-red-400">❌ {err}</p>
              ))}
            </div>
          )}

          {/* Блок предупреждений валидации — не блокируют */}
          {validationWarnings.length > 0 && validationErrors.length === 0 && (
            <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-2 py-1.5 space-y-0.5">
              {validationWarnings.map((warn, i) => (
                <p key={i} className="text-xs text-amber-700 dark:text-amber-300">⚠️ {warn}</p>
              ))}
            </div>
          )}

          {/* Информационный блок с требованиями Telegram */}
          <div className="rounded-md bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 px-2 py-1.5">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
              ℹ️ Требования Telegram: JPEG, до 200 KB, до 320×320 px.<br />
              Для видео &lt; 10 MB Telegram генерирует превью автоматически.
            </p>
          </div>

          {/* Кнопка открытия MediaManager */}
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="w-full h-8 text-xs font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
              >
                <Upload className="w-3 h-3 mr-1.5" />
                Выбрать или загрузить фото
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-5xl">
              <DialogHeader>
                <DialogTitle>
                  <i className="fas fa-image mr-2 text-blue-600"></i>
                  Выбор обложки видео
                </DialogTitle>
              </DialogHeader>
              <MediaManager
                projectId={projectId}
                selectedType="photo"
                onSelectFile={handleSelectFile}
              />
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
