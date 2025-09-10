import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { MediaFile } from "@shared/schema";
import { 
  Download, 
  LinkIcon, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  Image, 
  Play, 
  Volume2,
  Loader2,
  Info,
  ExternalLink,
  Copy,
  Trash2,
  Plus
} from "lucide-react";

interface UrlDownloaderProps {
  projectId: number;
  onDownloadComplete?: (files: MediaFile[]) => void;
  onClose?: () => void;
  maxUrls?: number;
}

interface UrlData {
  id: string;
  url: string;
  fileName?: string;
  description?: string;
  status: 'pending' | 'checking' | 'valid' | 'invalid' | 'downloading' | 'success' | 'error';
  fileInfo?: {
    mimeType?: string;
    size?: number;
    fileName?: string;
    fileType?: string;
    category?: string;
    sizeMB?: number;
  };
  error?: string;
  progress?: number;
}

export function UrlDownloader({ 
  projectId, 
  onDownloadComplete, 
  onClose,
  maxUrls = 10
}: UrlDownloaderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [urls, setUrls] = useState<UrlData[]>([{
    id: Math.random().toString(36).substr(2, 9),
    url: '',
    status: 'pending'
  }]);
  const [isPublic, setIsPublic] = useState(false);
  const [defaultDescription, setDefaultDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Мутация для проверки URL
  const checkUrlMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await apiRequest('POST', '/api/media/check-url', { url });
      return response;
    }
  });

  // Мутация для загрузки одного файла
  const downloadUrlMutation = useMutation({
    mutationFn: async ({ url, description, customFileName }: { 
      url: string; 
      description?: string; 
      customFileName?: string; 
    }) => {
      const response = await apiRequest('POST', `/api/media/download-url/${projectId}`, { 
        url, 
        description, 
        customFileName,
        isPublic 
      });
      return response;
    }
  });

  // Мутация для пакетной загрузки
  const downloadUrlsMutation = useMutation({
    mutationFn: async (urlsData: { url: string; fileName?: string; description?: string }[]) => {
      const response = await apiRequest('POST', `/api/media/download-urls/${projectId}`, { 
        urls: urlsData,
        isPublic,
        defaultDescription 
      });
      return response;
    }
  });

  const getFileIcon = (fileType?: string) => {
    switch (fileType) {
      case 'photo': return <Image className="w-4 h-4 text-blue-500" />;
      case 'video': return <Play className="w-4 h-4 text-purple-500" />;
      case 'audio': return <Volume2 className="w-4 h-4 text-green-500" />;
      case 'document': return <FileText className="w-4 h-4 text-orange-500" />;
      default: return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const addUrlField = () => {
    if (urls.length < maxUrls) {
      setUrls(prev => [...prev, {
        id: Math.random().toString(36).substr(2, 9),
        url: '',
        status: 'pending'
      }]);
    }
  };

  const removeUrlField = (id: string) => {
    if (urls.length > 1) {
      setUrls(prev => prev.filter(u => u.id !== id));
    }
  };

  const updateUrl = (id: string, url: string) => {
    setUrls(prev => prev.map(u => 
      u.id === id 
        ? { ...u, url, status: 'pending' as const, fileInfo: undefined, error: undefined }
        : u
    ));
  };

  const updateUrlField = (id: string, field: keyof UrlData, value: any) => {
    setUrls(prev => prev.map(u => 
      u.id === id 
        ? { ...u, [field]: value }
        : u
    ));
  };

  const checkUrl = async (id: string, url: string) => {
    if (!url.trim()) return;

    updateUrlField(id, 'status', 'checking');

    try {
      const result = await checkUrlMutation.mutateAsync(url);
      
      if (result.accessible) {
        updateUrlField(id, 'status', 'valid');
        updateUrlField(id, 'fileInfo', result.fileInfo);
        
        // Автоматически заполняем имя файла если оно не задано
        if (result.fileInfo?.fileName && !urls.find(u => u.id === id)?.fileName) {
          updateUrlField(id, 'fileName', result.fileInfo.fileName);
        }
      } else {
        updateUrlField(id, 'status', 'invalid');
        updateUrlField(id, 'error', result.error);
      }
    } catch (error) {
      updateUrlField(id, 'status', 'invalid');
      updateUrlField(id, 'error', error instanceof Error ? error.message : 'Ошибка проверки URL');
    }
  };

  const downloadSingle = async (urlData: UrlData) => {
    if (!urlData.url.trim() || urlData.status !== 'valid') return;

    updateUrlField(urlData.id, 'status', 'downloading');
    updateUrlField(urlData.id, 'progress', 0);

    try {
      const result = await downloadUrlMutation.mutateAsync({
        url: urlData.url,
        description: urlData.description || defaultDescription,
        customFileName: urlData.fileName
      });

      updateUrlField(urlData.id, 'status', 'success');
      updateUrlField(urlData.id, 'progress', 100);

      toast({
        title: "Файл загружен",
        description: `${result.fileName} успешно загружен`,
      });

      // Обновляем кэш медиафайлов
      queryClient.invalidateQueries({ queryKey: ['/api/media/project', projectId] });

      onDownloadComplete?.([result]);

    } catch (error) {
      updateUrlField(urlData.id, 'status', 'error');
      updateUrlField(urlData.id, 'error', error instanceof Error ? error.message : 'Ошибка загрузки');
      
      toast({
        title: "Ошибка загрузки",
        description: error instanceof Error ? error.message : 'Неизвестная ошибка',
        variant: "destructive",
      });
    }
  };

  const downloadAll = async () => {
    const validUrls = urls.filter(u => u.status === 'valid' && u.url.trim());
    
    if (validUrls.length === 0) {
      toast({
        title: "Нет валидных URL",
        description: "Добавьте и проверьте URL для загрузки",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Обновляем статус всех URL
      validUrls.forEach(urlData => {
        updateUrlField(urlData.id, 'status', 'downloading');
        updateUrlField(urlData.id, 'progress', 0);
      });

      const urlsData = validUrls.map(u => ({
        url: u.url,
        fileName: u.fileName,
        description: u.description
      }));

      const result = await downloadUrlsMutation.mutateAsync(urlsData);

      // Обновляем статусы на основе результата
      validUrls.forEach((urlData, index) => {
        const wasSuccessful = result.downloadedFiles.some((f: any) => f.sourceUrl === urlData.url);
        const error = result.errorDetails.find((e: any) => e.url === urlData.url);
        
        if (wasSuccessful) {
          updateUrlField(urlData.id, 'status', 'success');
          updateUrlField(urlData.id, 'progress', 100);
        } else {
          updateUrlField(urlData.id, 'status', 'error');
          updateUrlField(urlData.id, 'error', error?.error || 'Неизвестная ошибка');
        }
      });

      toast({
        title: "Пакетная загрузка завершена",
        description: `Успешно: ${result.success}, Ошибок: ${result.errors}`,
      });

      // Обновляем кэш медиафайлов
      queryClient.invalidateQueries({ queryKey: ['/api/media/project', projectId] });

      if (result.downloadedFiles.length > 0) {
        onDownloadComplete?.(result.downloadedFiles);
      }

      // Закрываем через 3 секунды если все успешно
      if (result.errors === 0) {
        setTimeout(() => {
          onClose?.();
        }, 3000);
      }

    } catch (error) {
      validUrls.forEach(urlData => {
        updateUrlField(urlData.id, 'status', 'error');
        updateUrlField(urlData.id, 'error', 'Ошибка пакетной загрузки');
      });

      toast({
        title: "Ошибка пакетной загрузки",
        description: error instanceof Error ? error.message : 'Неизвестная ошибка',
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const pasteFromClipboard = async (id: string) => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        updateUrl(id, text);
        // Автоматически проверяем URL после вставки
        setTimeout(() => checkUrl(id, text), 100);
      }
    } catch (error) {
      toast({
        title: "Ошибка вставки",
        description: "Не удалось получить текст из буфера обмена",
        variant: "destructive",
      });
    }
  };

  const validUrlsCount = urls.filter(u => u.status === 'valid').length;
  const totalUrlsCount = urls.filter(u => u.url.trim()).length;

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <LinkIcon className="w-5 h-5" />
            Загрузка файлов по ссылкам
          </h3>
          <p className="text-sm text-muted-foreground">
            Загружайте файлы напрямую из интернета по URL
          </p>
        </div>
        <Badge variant="outline">
          {validUrlsCount}/{totalUrlsCount} готово
        </Badge>
      </div>

      {/* Общие настройки */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Общие настройки</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="defaultDescription">Описание по умолчанию</Label>
            <Textarea
              id="defaultDescription"
              placeholder="Описание для всех загружаемых файлов..."
              value={defaultDescription}
              onChange={(e) => setDefaultDescription(e.target.value)}
              rows={2}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="isPublic"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
            <Label htmlFor="isPublic">Публичные файлы</Label>
          </div>
        </CardContent>
      </Card>

      {/* URL поля */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            URL для загрузки
            <Button
              onClick={addUrlField}
              size="sm"
              variant="outline"
              disabled={urls.length >= maxUrls}
            >
              <Plus className="w-4 h-4 mr-1" />
              Добавить URL
            </Button>
          </CardTitle>
          <CardDescription>
            Поддерживаются изображения, видео, аудио и документы до 200МБ
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {urls.map((urlData, index) => (
            <div key={urlData.id} className="space-y-3 p-4 border rounded-lg">
              {/* URL ввод */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="https://example.com/file.jpg"
                    value={urlData.url}
                    onChange={(e) => updateUrl(urlData.id, e.target.value)}
                    onBlur={() => urlData.url.trim() && checkUrl(urlData.id, urlData.url)}
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => pasteFromClipboard(urlData.id)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => urlData.url.trim() && checkUrl(urlData.id, urlData.url)}
                  disabled={!urlData.url.trim() || urlData.status === 'checking'}
                >
                  {urlData.status === 'checking' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ExternalLink className="w-4 h-4" />
                  )}
                </Button>
                {urls.length > 1 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removeUrlField(urlData.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Статус */}
              {urlData.status !== 'pending' && (
                <div className="flex items-center gap-2">
                  {urlData.status === 'checking' && (
                    <div className="flex items-center gap-2 text-blue-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Проверка...</span>
                    </div>
                  )}
                  
                  {urlData.status === 'valid' && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">URL валиден</span>
                    </div>
                  )}
                  
                  {urlData.status === 'invalid' && (
                    <div className="flex items-center gap-2 text-red-600">
                      <XCircle className="w-4 h-4" />
                      <span className="text-sm">Ошибка: {urlData.error}</span>
                    </div>
                  )}
                  
                  {urlData.status === 'downloading' && (
                    <div className="flex items-center gap-2 text-blue-600">
                      <Download className="w-4 h-4" />
                      <span className="text-sm">Загрузка... {urlData.progress || 0}%</span>
                      <Progress value={urlData.progress || 0} className="w-20" />
                    </div>
                  )}
                  
                  {urlData.status === 'success' && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">Загружено успешно</span>
                    </div>
                  )}
                  
                  {urlData.status === 'error' && (
                    <div className="flex items-center gap-2 text-red-600">
                      <XCircle className="w-4 h-4" />
                      <span className="text-sm">Ошибка: {urlData.error}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Информация о файле */}
              {urlData.fileInfo && (
                <div className="flex items-center gap-3 p-2 bg-muted rounded text-sm">
                  {getFileIcon(urlData.fileInfo.fileType)}
                  <div className="flex-1">
                    <div className="font-medium">{urlData.fileInfo.fileName}</div>
                    <div className="text-muted-foreground">
                      {urlData.fileInfo.category} • {urlData.fileInfo.sizeMB}МБ
                    </div>
                  </div>
                  <Badge variant="secondary">{urlData.fileInfo.fileType}</Badge>
                </div>
              )}

              {/* Дополнительные поля для валидных URL */}
              {urlData.status === 'valid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor={`fileName-${urlData.id}`}>Имя файла</Label>
                    <Input
                      id={`fileName-${urlData.id}`}
                      placeholder="Оставьте пустым для автоопределения"
                      value={urlData.fileName || ''}
                      onChange={(e) => updateUrlField(urlData.id, 'fileName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`description-${urlData.id}`}>Описание</Label>
                    <Input
                      id={`description-${urlData.id}`}
                      placeholder="Индивидуальное описание файла"
                      value={urlData.description || ''}
                      onChange={(e) => updateUrlField(urlData.id, 'description', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Кнопка индивидуальной загрузки */}
              {urlData.status === 'valid' && (
                <Button
                  onClick={() => downloadSingle(urlData)}
                  size="sm"
                  className="w-full"
                  disabled={urlData.status === 'downloading'}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Загрузить этот файл
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Информационное сообщение */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Совет:</strong> Сначала добавьте все URL и дождитесь их проверки, 
          затем используйте "Загрузить все файлы" для эффективной пакетной загрузки.
        </AlertDescription>
      </Alert>

      {/* Кнопки действий */}
      <div className="flex gap-2">
        <Button
          onClick={downloadAll}
          disabled={validUrlsCount === 0 || isProcessing}
          className="flex-1"
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Загрузить все файлы ({validUrlsCount})
        </Button>
        
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Закрыть
          </Button>
        )}
      </div>
    </div>
  );
}