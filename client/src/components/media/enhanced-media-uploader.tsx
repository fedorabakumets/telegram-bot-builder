import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useUploadMedia, useUploadMultipleMedia } from "@/hooks/use-media";
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
  Tag,
  Settings
} from "lucide-react";
import type { MediaFile } from "@shared/schema";

interface FileWithPreview extends File {
  preview?: string;
  id: string;
  uploadProgress?: number;
  uploadStatus?: 'pending' | 'uploading' | 'success' | 'error';
  uploadError?: string;
}

interface EnhancedMediaUploaderProps {
  projectId: number;
  onUploadComplete?: (files: MediaFile[]) => void;
  onClose?: () => void;
  maxFiles?: number;
  acceptedTypes?: string[];
}

export function EnhancedMediaUploader({ 
  projectId, 
  onUploadComplete, 
  onClose,
  maxFiles = 20,
  acceptedTypes = ['image/*', 'video/*', 'audio/*', '.pdf', '.doc', '.docx']
}: EnhancedMediaUploaderProps) {
  const { toast } = useToast();
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [defaultDescription, setDefaultDescription] = useState('');
  const [defaultTags, setDefaultTags] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const uploadSingleMutation = useUploadMedia(projectId);
  const uploadMultipleMutation = useUploadMultipleMedia(projectId);

  // Валидация файла
  const validateFile = useCallback((file: File): string | null => {
    const maxSizes = {
      'image': 25 * 1024 * 1024, // 25MB
      'video': 200 * 1024 * 1024, // 200MB
      'audio': 100 * 1024 * 1024, // 100MB
      'application': 50 * 1024 * 1024, // 50MB
      'text': 10 * 1024 * 1024 // 10MB
    };

    const fileType = file.type.split('/')[0];
    const maxSize = maxSizes[fileType as keyof typeof maxSizes] || maxSizes.application;

    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      return `Файл слишком большой. Максимальный размер: ${maxSizeMB}МБ`;
    }

    if (file.name.length > 255) {
      return 'Имя файла слишком длинное (максимум 255 символов)';
    }

    return null;
  }, []);

  // Обработка добавления файлов
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

      // Создаем превью для изображений
      let preview = undefined;
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file);
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

  // Удаление файла из списка
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

  // Получение иконки файла
  const getFileIcon = (file: File) => {
    const type = file.type.split('/')[0];
    switch (type) {
      case 'image': return <FileImage className="w-5 h-5" />;
      case 'video': return <FileVideo className="w-5 h-5" />;
      case 'audio': return <FileAudio className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  // Форматирование размера файла
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Загрузка файлов
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
              Максимум {maxFiles} файлов, до 200МБ для видео
            </p>
          </div>
        )}
      </div>

      {/* Настройки загрузки */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Настройки загрузки</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Settings className="w-4 h-4 mr-2" />
              {showAdvanced ? 'Скрыть' : 'Показать'} дополнительные
            </Button>
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

      {/* Список файлов */}
      {files.length > 0 && (
        <div className="space-y-3">
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

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                {/* Превью или иконка */}
                <div className="flex-shrink-0">
                  {file.preview ? (
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                      {getFileIcon(file)}
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
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Загрузка...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Загрузить ({files.length})
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}