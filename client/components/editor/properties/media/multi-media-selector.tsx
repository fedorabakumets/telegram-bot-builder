/**
 * @fileoverview Компонент выбора нескольких медиафайлов
 * 
 * Позволяет добавлять и управлять несколькими медиафайлами.
 *
 * @module MultiMediaSelector
 */

import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MediaManager } from "./media-manager";
import { UrlDownloader } from "./url-downloader";
import { MediaFilesList } from "./media-files-list";
import { FileIdInput } from "./file-id-input";
import type { MediaFile } from "@shared/schema";
import type { MediaFileData } from "./media-files-list";
import { Upload, Plus, LinkIcon, Hash } from "lucide-react";
import { uploadImageFromUrl } from "@lib/bot-generator/media/uploadImageFromUrl";
import { toast } from "@/hooks/use-toast";
import { useMediaFiles } from "../hooks/use-media";

/** Пропсы компонента MultiMediaSelector */
export interface MultiMediaSelectorProps {
  projectId: number;
  value?: string[];
  onChange: (urls: string[]) => void;
  placeholder?: string;
  label?: string;
  nodeName?: string;
  keyboardType?: string;
  onNodeUpdate?: (nodeId: string, updates: Partial<any>) => void;
  nodeId?: string;
  /** Текущие обложки из данных ноды: ключ — URL видео, значение — URL обложки */
  thumbnailsMap?: Record<string, string>;
  /** Callback при изменении обложек в ноде */
  onThumbnailsChange?: (thumbnails: Record<string, string>) => void;
}

/**
 * Компонент выбора нескольких медиафайлов
 */
export function MultiMediaSelector({
  projectId,
  value = [],
  onChange,
  placeholder = "Введите URL",
  label = "Медиафайлы",
  nodeName = "node",
  keyboardType = "none",
  onNodeUpdate,
  nodeId,
  thumbnailsMap = {},
  onThumbnailsChange,
}: MultiMediaSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  /** Тип медиа для вкладки Telegram file_id */
  const [fileIdMediaType, setFileIdMediaType] = useState<'photo' | 'video' | 'audio' | 'document'>('photo');

  // Проверяем, включена ли клавиатура (для определения скрытых файлов)
  const hasKeyboard = keyboardType === 'inline' || keyboardType === 'reply';

  /** Данные медиафайлов из БД — для получения имени, типа и telegramFileId по URL */
  const { data: dbFiles } = useMediaFiles(projectId);

  /** Маппинг URL → объект файла из БД для быстрого доступа к метаданным */
  const dbFileByUrl = useMemo(() => {
    const map = new Map<string, typeof dbFiles[0]>();
    dbFiles?.forEach((f) => map.set(f.url, f));
    return map;
  }, [dbFiles]);

  /** Формируем массив файлов с реальными именами и типами из БД (если доступны) */
  const files: MediaFileData[] = value.map((url, index) => {
    // Обрабатываем JSON-запись Telegram file_id
    if (url.startsWith('{"__type":"file_id"')) {
      try {
        const parsed = JSON.parse(url);
        return {
          url,
          fileName: `Telegram file_id (${parsed.mediaType || 'медиа'})`,
          fileType: parsed.mediaType || 'photo',
          telegramFileId: null,
          /** Маппинг tokenId → file_id из JSON-записи */
          fileIdsByToken: (parsed.fileIdsByToken as Record<string, string>) || {},
          isHidden: hasKeyboard && index > 0,
          mediaFileId: undefined,
          thumbnailMediaId: null,
          thumbnailUrl: thumbnailsMap[url] ?? null,
          thumbnailDirectUrl: null,
          projectId,
        };
      } catch { /* fallthrough */ }
    }
    const dbFile = dbFileByUrl.get(url);
    return {
      url,
      fileName: dbFile?.fileName ?? `Файл ${index + 1}`,
      fileType: dbFile?.fileType ?? getMediaTypeByUrl(url),
      telegramFileId: dbFile?.telegramFileId ?? null,
      isHidden: hasKeyboard && index > 0,
      mediaFileId: dbFile?.id,
      thumbnailMediaId: null,
      /** Обложка берётся из ноды project.json (thumbnailsMap), не из БД */
      thumbnailUrl: thumbnailsMap[url] ?? null,
      thumbnailDirectUrl: null,
      projectId: projectId,
    };
  });

  const handleAddUrl = async () => {
    if (!urlInput.trim()) return;

    if (!urlInput.startsWith('http://') && !urlInput.startsWith('https://')) {
      onChange([...value, urlInput]);
      setUrlInput('');
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadImageFromUrl(urlInput, projectId, nodeName);
      if (result.success) {
        const pathToUse = result.localPath || result.imageUrl || urlInput;
        onChange([...value, pathToUse]);
        toast({ title: 'Файл добавлен', description: result.message });
      } else {
        onChange([...value, urlInput]);
      }
    } catch {
      onChange([...value, urlInput]);
    } finally {
      setIsUploading(false);
      setUrlInput('');
    }
  };

  const handleRemoveFile = (index: number) => {
    const newValue = value.filter((_, i) => i !== index);
    onChange(newValue);
  };

  const handleEnableAllFiles = () => {
    // Отключаем клавиатуру, все файлы остаются
    if (onNodeUpdate && nodeId) {
      onNodeUpdate(nodeId, { keyboardType: 'none' });
    }
  };

  const handleSelectFile = (file: MediaFile) => {
    onChange([...value, file.url]);
    setIsOpen(false);
  };

  // Количество скрытых файлов
  const hiddenCount = hasKeyboard ? value.length - 1 : 0;

  // Автоматически отключаем клавиатуру при добавлении второго файла
  useEffect(() => {
    if (value.length > 1 && hasKeyboard && onNodeUpdate && nodeId) {
      onNodeUpdate(nodeId, { keyboardType: 'none' });
    }
  }, [value.length, hasKeyboard, onNodeUpdate, nodeId]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <i className="fas fa-images text-slate-600 dark:text-slate-400 text-sm"></i>
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</label>
      </div>

      {/* Files List */}
      {files.length > 0 && (
        <MediaFilesList
          files={files}
          onRemove={handleRemoveFile}
          isHidden={(index) => hasKeyboard && index > 0}
          onThumbnailSet={(videoUrl, thumbUrl) => {
            if (!onThumbnailsChange) return;
            const updated = { ...thumbnailsMap };
            if (thumbUrl === null) {
              delete updated[videoUrl];
            } else {
              updated[videoUrl] = thumbUrl;
            }
            onThumbnailsChange(updated);
          }}
        />
      )}

      {/* Кнопка включения всех файлов и предупреждение */}
      {hiddenCount > 0 && (
        <div className="space-y-2">
          <button
            onClick={handleEnableAllFiles}
            className="w-full text-xs px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors font-medium"
          >
            Включить все файлы ({hiddenCount} скрыто)
          </button>
          <p className="text-xs text-muted-foreground text-center">
            При включении клавиатура отключится
          </p>
        </div>
      )}

      {/* Add File */}
      <div className="space-y-3">
        {/* URL Input */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder={placeholder}
              disabled={isUploading}
              className="h-10 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleAddUrl()}
            />
            {isUploading && (
              <i className="fas fa-spinner fa-spin absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 text-sm"></i>
            )}
          </div>
          <Button onClick={handleAddUrl} size="sm" disabled={!urlInput.trim()}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Or Divider */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-slate-300/30"></div>
          <span className="text-xs text-slate-500">или</span>
          <div className="flex-1 h-px bg-slate-300/30"></div>
        </div>

        {/* Media Browser Button */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="w-full h-10 text-sm font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
              <Upload className="w-4 h-4 mr-2" />
              Выбрать или загрузить файл
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-5xl">
            <DialogHeader>
              <DialogTitle>
                <i className="fas fa-folder-open mr-2 text-blue-600"></i>
                Управление медиафайлами
              </DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Загрузить
                </TabsTrigger>
                <TabsTrigger value="url" className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  По URL
                </TabsTrigger>
                <TabsTrigger value="fileid" className="flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  Telegram file_id
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="mt-4">
                <MediaManager projectId={projectId} onSelectFile={handleSelectFile} />
              </TabsContent>

              <TabsContent value="url" className="mt-4">
                <UrlDownloader
                  projectId={projectId}
                  onDownloadComplete={(files) => {
                    const newUrls = files.map(f => f.url);
                    onChange([...value, ...newUrls]);
                    setIsOpen(false);
                  }}
                  onClose={() => setIsOpen(false)}
                />
              </TabsContent>

              <TabsContent value="fileid" className="mt-4">
                <FileIdInput
                  projectId={projectId}
                  mediaType={fileIdMediaType}
                  onMediaTypeChange={setFileIdMediaType}
                  onAdd={(entry) => {
                    onChange([...value, entry]);
                    setIsOpen(false);
                  }}
                />
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

/**
 * Проверяет, является ли строка переменной вида {var.path}
 * @param url - Строка для проверки
 * @returns true если строка является переменной-плейсхолдером
 */
function isVariablePlaceholder(url: string): boolean {
  return url.startsWith('{') && url.endsWith('}');
}

/**
 * Определяет тип медиа по URL или расширению файла.
 * Переменные вида {var.path} считаются фото по умолчанию.
 * JSON-записи Telegram file_id возвращают тип из поля mediaType.
 * @param url - URL или путь к файлу
 * @returns Тип медиа: 'photo' | 'image' | 'video' | 'audio' | 'document'
 */
function getMediaTypeByUrl(url: string): string {
  // JSON-запись Telegram file_id
  if (url.startsWith('{"__type":"file_id"')) {
    try {
      const parsed = JSON.parse(url);
      return parsed.mediaType || 'photo';
    } catch { return 'photo'; }
  }
  // Переменные вида {var.path} считаем фото по умолчанию
  if (isVariablePlaceholder(url)) return 'photo';
  const ext = url.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
  if (['mp4', 'avi', 'mov', 'webm'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'ogg'].includes(ext)) return 'audio';
  return 'document';
}
