import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Zap, Image, FileVideo, FileAudio, Download, Settings, CheckCircle2 } from "lucide-react";

interface FileOptimizerProps {
  files: File[];
  onOptimizedFiles?: (files: File[]) => void;
  onClose?: () => void;
}

interface OptimizationSettings {
  images: {
    compress: boolean;
    quality: number;
    maxWidth: number;
    format: 'original' | 'jpeg' | 'webp';
  };
  videos: {
    compress: boolean;
    quality: 'low' | 'medium' | 'high';
    maxSize: number;
  };
  audio: {
    compress: boolean;
    bitrate: number;
  };
}

export function FileOptimizer({ files, onOptimizedFiles, onClose }: FileOptimizerProps) {
  const { toast } = useToast();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);
  const [optimizedFiles, setOptimizedFiles] = useState<File[]>([]);
  const [settings, setSettings] = useState<OptimizationSettings>({
    images: {
      compress: true,
      quality: 85,
      maxWidth: 1920,
      format: 'original'
    },
    videos: {
      compress: false,
      quality: 'medium',
      maxSize: 50
    },
    audio: {
      compress: false,
      bitrate: 128
    }
  });

  // Статистика файлов
  const fileStats = files.reduce((acc, file) => {
    const type = file.type.split('/')[0];
    acc[type] = (acc[type] || 0) + 1;
    acc.totalSize = (acc.totalSize || 0) + file.size;
    return acc;
  }, {} as Record<string, number>);

  // Сжатие изображений
  const compressImage = useCallback(async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Вычисляем новые размеры
        let { width, height } = img;
        const maxWidth = settings.images.maxWidth;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Рисуем сжатое изображение
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Конвертируем в Blob
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: settings.images.format === 'original' ? file.type : `image/${settings.images.format}`,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        }, settings.images.format === 'original' ? file.type : `image/${settings.images.format}`, settings.images.quality / 100);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }, [settings.images]);

  // Оптимизация файлов
  const optimizeFiles = useCallback(async () => {
    setIsOptimizing(true);
    setOptimizationProgress(0);
    
    try {
      const optimized: File[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let optimizedFile = file;
        
        // Оптимизируем изображения
        if (file.type.startsWith('image/') && settings.images.compress) {
          optimizedFile = await compressImage(file);
        }
        
        optimized.push(optimizedFile);
        setOptimizationProgress(Math.round(((i + 1) / files.length) * 100));
        
        // Небольшая задержка для показа прогресса
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      setOptimizedFiles(optimized);
      
      // Вычисляем статистику сжатия
      const originalSize = files.reduce((sum, file) => sum + file.size, 0);
      const optimizedSize = optimized.reduce((sum, file) => sum + file.size, 0);
      const savedPercentage = Math.round(((originalSize - optimizedSize) / originalSize) * 100);
      
      toast({
        title: "Оптимизация завершена",
        description: `Сэкономлено ${savedPercentage}% места (${formatFileSize(originalSize - optimizedSize)})`,
      });
      
    } catch (error) {
      console.error('Optimization error:', error);
      toast({
        title: "Ошибка оптимизации",
        description: "Не удалось оптимизировать некоторые файлы",
        variant: "destructive",
      });
    } finally {
      setIsOptimizing(false);
    }
  }, [files, settings, compressImage, toast]);

  // Форматирование размера файла
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Применение оптимизированных файлов
  const applyOptimizedFiles = () => {
    onOptimizedFiles?.(optimizedFiles);
    onClose?.();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center">
            <Zap className="w-5 h-5 mr-2 text-yellow-500" />
            Оптимизация файлов
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Сжатие и оптимизация файлов для ускорения загрузки
          </p>
        </div>
      </div>

      {/* Статистика файлов */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Обзор файлов</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{files.length}</div>
              <div className="text-muted-foreground">Всего файлов</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{fileStats.image || 0}</div>
              <div className="text-muted-foreground">Изображений</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{fileStats.video || 0}</div>
              <div className="text-muted-foreground">Видео</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{formatFileSize(fileStats.totalSize || 0)}</div>
              <div className="text-muted-foreground">Общий размер</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Настройки оптимизации */}
      <Tabs defaultValue="images">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="images" className="flex items-center">
            <Image className="w-4 h-4 mr-2" />
            Изображения
            <Badge variant="secondary" className="ml-2">{fileStats.image || 0}</Badge>
          </TabsTrigger>
          <TabsTrigger value="videos" disabled={!fileStats.video}>
            <FileVideo className="w-4 h-4 mr-2" />
            Видео
            <Badge variant="secondary" className="ml-2">{fileStats.video || 0}</Badge>
          </TabsTrigger>
          <TabsTrigger value="audio" disabled={!fileStats.audio}>
            <FileAudio className="w-4 h-4 mr-2" />
            Аудио
            <Badge variant="secondary" className="ml-2">{fileStats.audio || 0}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="images" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="compress-images">Сжимать изображения</Label>
                  <Switch
                    id="compress-images"
                    checked={settings.images.compress}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ 
                        ...prev, 
                        images: { ...prev.images, compress: checked }
                      }))
                    }
                  />
                </div>
                
                {settings.images.compress && (
                  <>
                    <div className="space-y-2">
                      <Label>Качество: {settings.images.quality}%</Label>
                      <Slider
                        value={[settings.images.quality]}
                        onValueChange={([value]) => 
                          setSettings(prev => ({ 
                            ...prev, 
                            images: { ...prev.images, quality: value }
                          }))
                        }
                        max={100}
                        min={10}
                        step={5}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Максимальная ширина: {settings.images.maxWidth}px</Label>
                      <Slider
                        value={[settings.images.maxWidth]}
                        onValueChange={([value]) => 
                          setSettings(prev => ({ 
                            ...prev, 
                            images: { ...prev.images, maxWidth: value }
                          }))
                        }
                        max={4096}
                        min={800}
                        step={100}
                      />
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="videos" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <FileVideo className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Оптимизация видео будет добавлена в следующих версиях</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audio" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <FileAudio className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Оптимизация аудио будет добавлена в следующих версиях</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Прогресс оптимизации */}
      {isOptimizing && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Оптимизация файлов...</Label>
            <span className="text-sm text-muted-foreground">{optimizationProgress}%</span>
          </div>
          <Progress value={optimizationProgress} />
        </div>
      )}

      {/* Результаты оптимизации */}
      {optimizedFiles.length > 0 && !isOptimizing && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center mb-4">
              <CheckCircle2 className="w-5 h-5 text-green-600 mr-2" />
              <span className="font-medium text-green-800 dark:text-green-200">
                Оптимизация завершена успешно
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Исходный размер:</span>
                <div className="font-medium">{formatFileSize(files.reduce((sum, file) => sum + file.size, 0))}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Оптимизированный размер:</span>
                <div className="font-medium text-green-600">
                  {formatFileSize(optimizedFiles.reduce((sum, file) => sum + file.size, 0))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Кнопки действий */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={isOptimizing}>
          Отмена
        </Button>
        
        {optimizedFiles.length === 0 ? (
          <Button 
            onClick={optimizeFiles} 
            disabled={isOptimizing || !settings.images.compress}
            className="flex items-center"
          >
            <Zap className="w-4 h-4 mr-2" />
            {isOptimizing ? 'Оптимизация...' : 'Оптимизировать'}
          </Button>
        ) : (
          <Button onClick={applyOptimizedFiles} className="flex items-center">
            <Download className="w-4 h-4 mr-2" />
            Применить оптимизированные файлы
          </Button>
        )}
      </div>
    </div>
  );
}