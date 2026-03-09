/**
 * @fileoverview Расширенный компонент загрузки медиафайлов
 *
 * Этот компонент предоставляет расширенный интерфейс для загрузки медиафайлов
 * с поддержкой множественной загрузки, предварительного просмотра, оптимизации,
 * валидации и настройки метаданных файлов.
 *
 * @module EnhancedMediaUploader
 */

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useUploadMedia, useUploadMultipleMedia } from "@/components/editor/properties/hooks/use-media";
import { FileOptimizer } from "./file-optimizer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Upload,
  X,
  FileImage,
  FileVideo,
  FileAudio,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Eye,
  Trash2,
  Settings,
  Zap
} from "lucide-react";
import type { MediaFile } from "@shared/schema";

/**
 * Интерфейс файла с предварительным просмотром
 *
 * @interface FileWithPreview
 * @extends {File}
 * @property {string} [preview] - URL для предварительного просмотра файла
 * @property {string} id - Уникальный идентификатор файла
 * @property {number} [uploadProgress] - Прогресс загрузки (0-100)
 * @property {'pending' | 'uploading' | 'success' | 'error'} [uploadStatus] - Статус загрузки
 * @property {string} [uploadError] - Ошибка загрузки (если есть)
 */
interface FileWithPreview extends File {
  preview?: string | undefined;
  id: string;
  uploadProgress?: number | undefined;
  uploadStatus?: ('pending' | 'uploading' | 'success' | 'error') | undefined;
  uploadError?: string | undefined;
}

/**
 * Свойства компонента EnhancedMediaUploader
 *
 * @interface EnhancedMediaUploaderProps
 * @property {number} projectId - ID проекта для загрузки файлов
 * @property {Function} [onUploadComplete] - Обработчик завершения загрузки
 * @property {Function} [onClose] - Обработчик закрытия компонента
 * @property {number} [maxFiles] - Максимальное количество файлов для загрузки (по умолчанию 20)
 * @property {string[]} [acceptedTypes] - Поддерживаемые типы файлов (по умолчанию изображения, видео, аудио, документы)
 */
interface EnhancedMediaUploaderProps {
  projectId: number;
  onUploadComplete?: (files: MediaFile[]) => void;
  onClose?: () => void;
  maxFiles?: number;
  acceptedTypes?: string[];
}

/**
 * Расширенный компонент загрузки медиафайлов
 *
 * Предоставляет интерфейс для загрузки медиафайлов с поддержкой множественной загрузки,
 * предварительного просмотра, оптимизации, валидации и настройки метаданных файлов.
 *
 * @component
 * @param {EnhancedMediaUploaderProps} props - Свойства компонента
 * @returns {JSX.Element} Элемент компонента EnhancedMediaUploader
 */
export function EnhancedMediaUploader({
  projectId,
  onUploadComplete,
  onClose,
  maxFiles = 20,
  acceptedTypes = [
    'image/*',
    'video/*',
    'audio/*',
    '.pdf',
    '.doc',
    '.docx',
    '.txt',
    '.xls',
    '.xlsx',
    '.zip',
    '.rar',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
}: EnhancedMediaUploaderProps) {
  /**
   * Хук для показа уведомлений
   */
  const { toast } = useToast();

  /**
   * Состояние списка файлов для загрузки
   */
  const [files, setFiles] = useState<FileWithPreview[]>([]);

  /**
   * Состояние публичности файлов
   */
  const [isPublic, setIsPublic] = useState(false);

  /**
   * Состояние описания по умолчанию
   */
  const [defaultDescription, setDefaultDescription] = useState('');

  /**
   * Состояние тегов по умолчанию
   */
  const [defaultTags, setDefaultTags] = useState('');

  /**
   * Состояние процесса загрузки
   */
  const [isUploading, setIsUploading] = useState(false);

  /**
   * Состояние прогресса загрузки
   */
  const [uploadProgress, setUploadProgress] = useState(0);

  /**
   * Состояние показа дополнительных настроек
   */
  const [showAdvanced, setShowAdvanced] = useState(false);

  /**
   * Состояние показа оптимизатора файлов
   */
  const [showOptimizer, setShowOptimizer] = useState(false);

  /**
   * Состояние показа предпросмотра файлов
   */
  const [showPreview, setShowPreview] = useState(false);

  /**
   * Мутация для загрузки одного файла
   */
  const uploadSingleMutation = useUploadMedia(projectId);

  /**
   * Мутация для загрузки нескольких файлов
   */
  const uploadMultipleMutation = useUploadMultipleMedia(projectId);

  /**
   * Расширенная валидация файла
   *
   * Проверяет тип, размер и имя файла на соответствие требованиям.
   *
   * @param {File} file - Файл для валидации
   * @returns {string | null} Сообщение об ошибке или null, если файл валиден
   */
  const validateFile = useCallback((file: File): string | null => {
    // Определяем максимальные размеры по типу файла
    const maxSizes = {
      'image': 25 * 1024 * 1024, // 25MB
      'video': 200 * 1024 * 1024, // 200MB
      'audio': 100 * 1024 * 1024, // 100MB
      'application': 50 * 1024 * 1024, // 50MB
      'text': 10 * 1024 * 1024 // 10MB
    };

    // Определяем поддерживаемые расширения
    const supportedExtensions = [
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', // Изображения
      '.mp4', '.webm', '.avi', '.mov', '.mkv', // Видео
      '.mp3', '.wav', '.ogg', '.aac', '.flac', '.m4a', // Аудио
      '.pdf', '.doc', '.docx', '.txt', '.xls', '.xlsx', '.zip', '.rar' // Документы
    ];

    // Проверяем расширение файла
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!supportedExtensions.includes(extension)) {
      return `Неподдерживаемое расширение файла: ${extension}. Поддерживаются: изображения, видео, аудио, документы`;
    }

    const fileType = file.type.split('/')[0];
    const maxSize = maxSizes[fileType as keyof typeof maxSizes] || maxSizes.application;

    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      return `Файл "${file.name}" слишком большой. Максимальный размер для ${fileType}: ${maxSizeMB}МБ`;
    }

    if (file.name.length > 255) {
      return 'Имя файла слишком длинное (максимум 255 символов)';
    }

    // Проверяем на подозрительные символы в имени файла
    const dangerousChars = /[<>:"|?*]/;
    if (dangerousChars.test(file.name)) {
      return 'Имя файла содержит недопустимые символы: < > : " | ? *';
    }

    return null;
  }, []);

  /**
   * Обработка добавления файлов
   *
   * Обрабатывает принятые и отклоненные файлы, валидирует их и добавляет в список.
   *
   * @param {File[]} acceptedFiles - Принятые файлы
   * @param {any[]} rejectedFiles - Отклоненные файлы
   */
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Обрабатываем отклоненные файлы
    rejectedFiles.forEach(({ file, errors }) => {
      errors.forEach((error: any) => {
        toast({
          title: "Файл отклонен",
          description: `${file.name}: ${error.message}`,
          variant: "destructive",
        });
      });
    });

    // Обрабатываем принятые файлы
    const newFiles: FileWithPreview[] = acceptedFiles.map(file => {
      const validationError = validateFile(file);
      if (validationError) {
        toast({
          title: "Ошибка валидации",
          description: `${file.name}: ${validationError}`,
          variant: "destructive",
        });
        return null;
      }

      // Создаем превью для изображений и некоторых других типов файлов
      let preview = undefined;
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file);
      } else if (file.type.startsWith('video/')) {
        // Для видео создаем thumbnail через canvas (будет реализовано позже)
        preview = undefined; // TODO: Генерация thumbnail для видео
      }

      return {
        ...file,
        preview,
        id: Math.random().toString(36).substr(2, 9),
        uploadStatus: 'pending' as const,
        uploadProgress: 0
      };
    }).filter(Boolean) as FileWithPreview[];

    if (files.length + newFiles.length > maxFiles) {
      toast({
        title: "Слишком много файлов",
        description: `Максимум ${maxFiles} файлов за раз`,
        variant: "destructive",
      });
      return;
    }

    setFiles(prev => [...prev, ...newFiles]);
  }, [files.length, maxFiles, validateFile, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    maxFiles: maxFiles - files.length,
    multiple: true
  });

  /**
   * Удаление файла из списка
   *
   * Удаляет файл из списка и освобождает память для превью.
   *
   * @param {string} fileId - ID файла для удаления
   */
  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => {
      const updated = prev.filter(f => f.id !== fileId);
      // Освобождаем memory для превью
      const removedFile = prev.find(f => f.id === fileId);
      if (removedFile?.preview) {
        URL.revokeObjectURL(removedFile.preview);
      }
      return updated;
    });
  }, []);

  /**
   * Получение иконки файла
   *
   * Возвращает соответствующую иконку в зависимости от типа файла.
   *
   * @param {File} file - Файл для получения иконки
   * @returns {JSX.Element} Иконка файла
   */
  const getFileIcon = (file: File) => {
    const type = file.type.split('/')[0];
    switch (type) {
      case 'image': return <FileImage className="w-5 h-5" />;
      case 'video': return <FileVideo className="w-5 h-5" />;
      case 'audio': return <FileAudio className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  /**
   * Форматирование размера файла
   *
   * Преобразует размер файла в байтах в человекочитаемый формат.
   *
   * @param {number} bytes - Размер файла в байтах
   * @returns {string} Размер файла в человекочитаемом формате
   */
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  /**
   * Загрузка файлов
   *
   * Выполняет загрузку файлов с отслеживанием прогресса и обработкой ошибок.
   */
  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const tags = defaultTags.split(',').map(tag => tag.trim()).filter(Boolean);

      if (files.length === 1) {
        // Одиночная загрузка
        const file = files[0];
        setFiles(prev => prev.map(f =>
          f.id === file.id
            ? { ...f, uploadStatus: 'uploading', uploadProgress: 0 }
            : f
        ));

        const result = await uploadSingleMutation.mutateAsync({
          file,
          description: defaultDescription,
          tags,
          isPublic,
          onProgress: (progress) => {
            setUploadProgress(progress);
            setFiles(prev => prev.map(f =>
              f.id === file.id
                ? { ...f, uploadProgress: progress }
                : f
            ));
          }
        });

        setFiles(prev => prev.map(f =>
          f.id === file.id
            ? { ...f, uploadStatus: 'success', uploadProgress: 100 }
            : f
        ));

        toast({
          title: "Файл загружен",
          description: `${file.name} успешно загружен`,
        });

        onUploadComplete?.([result]);
      } else {
        // Множественная загрузка
        setFiles(prev => prev.map(f => ({ ...f, uploadStatus: 'uploading', uploadProgress: 0 })));

        const result = await uploadMultipleMutation.mutateAsync({
          files,
          defaultDescription,
          isPublic,
          onProgress: (progress) => {
            setUploadProgress(progress);
            setFiles(prev => prev.map(f => ({ ...f, uploadProgress: progress })));
          }
        });

        setFiles(prev => prev.map(f => ({ ...f, uploadStatus: 'success', uploadProgress: 100 })));

        toast({
          title: "Файлы загружены",
          description: `Успешно загружено ${result.success} из ${files.length} файлов`,
        });

        if (result.errors > 0) {
          result.errorDetails.forEach((error: any) => {
            toast({
              title: "Ошибка загрузки",
              description: `${error.fileName}: ${error.error}`,
              variant: "destructive",
            });
          });
        }

        onUploadComplete?.(result.uploadedFiles);
      }

      // Очищаем файлы после успешной загрузки
      setTimeout(() => {
        setFiles([]);
        onClose?.();
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      setFiles(prev => prev.map(f => ({
        ...f,
        uploadStatus: 'error',
        uploadError: error instanceof Error ? error.message : 'Неизвестная ошибка'
      })));

      toast({
        title: "Ошибка загрузки",
        description: error instanceof Error ? error.message : 'Неизвестная ошибка',
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Загрузка медиа файлов</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Поддерживаются изображения, видео, аудио и документы
          </p>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Зона загрузки */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          isDragActive 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        {isDragActive ? (
          <div>
            <p className="text-lg font-medium text-blue-600 dark:text-blue-400">
              Отпустите файлы здесь
            </p>
            <p className="text-sm text-blue-500">
              Файлы будут добавлены в список загрузки
            </p>
          </div>
        ) : (
          <div>
            <p className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
              Перетащите файлы сюда или нажмите для выбора
            </p>
            <p className="text-sm text-gray-500">
              Максимум {maxFiles} файлов, до 200МБ для видео, 25МБ для изображений
            </p>
            <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
              <span className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">📷 JPG, PNG, GIF</span>
              <span className="bg-green-100 dark:bg-green-900 px-2 py-1 rounded">🎬 MP4, WebM</span>
              <span className="bg-orange-100 dark:bg-orange-900 px-2 py-1 rounded">🎵 MP3, WAV</span>
              <span className="bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded">📄 PDF, DOC, TXT</span>
            </div>
          </div>
        )}
      </div>

      {/* Настройки загрузки */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Настройки загрузки</Label>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(true)}
                className="flex items-center"
              >
                <Eye className="w-4 h-4 mr-2" />
                Предпросмотр
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowOptimizer(true)}
                className="flex items-center"
              >
                <Zap className="w-4 h-4 mr-2" />
                Оптимизировать
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <Settings className="w-4 h-4 mr-2" />
                {showAdvanced ? 'Скрыть' : 'Показать'} дополнительные
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="description">Описание по умолчанию</Label>
              <Textarea
                id="description"
                placeholder="Описание для всех файлов..."
                value={defaultDescription}
                onChange={(e) => setDefaultDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tags">Теги (через запятую)</Label>
                <Input
                  id="tags"
                  placeholder="тег1, тег2, тег3..."
                  value={defaultTags}
                  onChange={(e) => setDefaultTags(e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="public"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
                <Label htmlFor="public">Сделать файлы публичными</Label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Сводка по файлам */}
      {files.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">
              Файлы для загрузки ({files.length})
            </Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFiles([])}
              disabled={isUploading}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Очистить все
            </Button>
          </div>
          
          {/* Статистика по типам файлов */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            {(() => {
              const stats = files.reduce((acc, file) => {
                const type = file.type.split('/')[0];
                acc[type] = (acc[type] || 0) + 1;
                return acc;
              }, {} as Record<string, number>);
              
              return Object.entries(stats).map(([type, count]) => {
                const icons = { image: '📷', video: '🎬', audio: '🎵', application: '📄', text: '📄' };
                return (
                  <div key={type} className="bg-white dark:bg-gray-700 rounded px-2 py-1 text-center">
                    <span className="mr-1">{icons[type as keyof typeof icons] || '📄'}</span>
                    {count} {type === 'image' ? 'изобр.' : type === 'video' ? 'видео' : type === 'audio' ? 'аудио' : 'док.'}
                  </div>
                );
              });
            })()}
          </div>
          
          {/* Общий размер */}
          <div className="text-sm text-muted-foreground">
            Общий размер: {formatFileSize(files.reduce((sum, file) => sum + file.size, 0))}
          </div>
        </div>
      )}

      {/* Список файлов */}
      {files.length > 0 && (
        <div className="space-y-3">

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                {/* Расширенное превью или иконка */}
                <div className="flex-shrink-0 relative">
                  {file.preview ? (
                    <div className="relative">
                      <img
                        src={file.preview}
                        alt={file.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      {/* Индикатор типа файла */}
                      <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-1 rounded">
                        {file.type.split('/')[1]?.toUpperCase().substring(0, 3) || 'IMG'}
                      </div>
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center relative">
                      {getFileIcon(file)}
                      {/* Индикатор размера файла */}
                      <div className="absolute -bottom-1 -right-1 bg-gray-600 text-white text-xs px-1 rounded">
                        {file.size > 1024 * 1024 ? `${Math.round(file.size / (1024 * 1024))}M` : `${Math.round(file.size / 1024)}K`}
                      </div>
                    </div>
                  )}
                </div>

                {/* Информация о файле */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                  
                  {/* Прогресс загрузки */}
                  {file.uploadStatus === 'uploading' && (
                    <Progress value={file.uploadProgress || 0} className="mt-1" />
                  )}
                  
                  {/* Статус */}
                  {file.uploadStatus === 'success' && (
                    <div className="flex items-center mt-1 text-green-600 text-xs">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Загружено
                    </div>
                  )}
                  
                  {file.uploadStatus === 'error' && (
                    <div className="flex items-center mt-1 text-red-600 text-xs">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {file.uploadError || 'Ошибка'}
                    </div>
                  )}
                </div>

                {/* Действия */}
                <div className="flex items-center space-x-2">
                  {file.uploadStatus === 'uploading' && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  
                  {file.uploadStatus !== 'uploading' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(file.id)}
                      disabled={isUploading}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Общий прогресс загрузки */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Прогресс загрузки</Label>
            <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} />
        </div>
      )}

      {/* Кнопки действий */}
      {files.length > 0 && (
        <div className="flex justify-end space-x-3 pt-4 border-t">
          {onClose && (
            <Button variant="outline" onClick={onClose} disabled={isUploading}>
              Отмена
            </Button>
          )}
          <Button 
            onClick={handleUpload} 
            disabled={isUploading || files.length === 0}
            className="min-w-[120px]"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 flex-shrink-0 animate-spin" />
                <span className="break-words">Загрузка...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="break-words">Загрузить ({files.length})</span>
              </>
            )}
          </Button>
        </div>
      )}

      {/* Диалог оптимизации файлов */}
      <Dialog open={showOptimizer} onOpenChange={setShowOptimizer}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="optimizer-description">
          <DialogHeader>
            <DialogTitle>Оптимизация файлов</DialogTitle>
            <div id="optimizer-description" className="text-sm text-muted-foreground">
              Сжатие и оптимизация файлов для ускорения загрузки и экономии места
            </div>
          </DialogHeader>
          <FileOptimizer
            files={files}
            onOptimizedFiles={(optimizedFiles) => {
              setFiles(optimizedFiles.map((file, _index) => ({
                ...file,
                preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
                id: Math.random().toString(36).substr(2, 9),
                uploadStatus: 'pending' as const,
                uploadProgress: 0
              })));
              setShowOptimizer(false);
              toast({
                title: "Файлы оптимизированы",
                description: `${optimizedFiles.length} файлов готовы к загрузке`,
              });
            }}
            onClose={() => setShowOptimizer(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Диалог предпросмотра файлов */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="preview-description">
          <DialogHeader>
            <DialogTitle>Предпросмотр файлов</DialogTitle>
            <div id="preview-description" className="text-sm text-muted-foreground">
              Просмотр всех выбранных файлов перед загрузкой
            </div>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto">
            {files.map((file) => (
              <div key={file.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">{file.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                {file.preview && (
                  <div className="relative">
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="w-full h-32 object-cover rounded"
                    />
                  </div>
                )}
                
                {!file.preview && (
                  <div className="flex items-center justify-center h-32 bg-muted rounded">
                    {getFileIcon(file)}
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)} • {file.type}
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Закрыть
            </Button>
            <Button onClick={() => setShowPreview(false)}>
              Продолжить загрузку
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}