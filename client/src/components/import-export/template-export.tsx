import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, Package, FileText, Info, CheckCircle, Copy } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { createTemplateFileName } from '@shared/template-format';
import { Checkbox } from '@/components/ui/checkbox';

interface TemplateExportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceType: 'template' | 'project';
  sourceId: number;
  sourceName: string;
  sourceDescription?: string;
}

type ExportFormat = 'download' | 'copy';

export function TemplateExport({ 
  open, 
  onOpenChange, 
  sourceType, 
  sourceId, 
  sourceName, 
  sourceDescription 
}: TemplateExportProps) {
  const [exportFormat, setExportFormat] = useState<ExportFormat>('download');
  const [exportedData, setExportedData] = useState<any>(null);
  const [includeDocumentation, setIncludeDocumentation] = useState(true);
  const [generateChecksum, setGenerateChecksum] = useState(true);
  const [includeScreenshots, setIncludeScreenshots] = useState(false);
  const { toast } = useToast();

  const exportMutation = useMutation({
    mutationFn: async () => {
      const endpoint = sourceType === 'template' 
        ? `/api/templates/${sourceId}/export`
        : `/api/projects/${sourceId}/export`;
      
      // Добавляем параметры экспорта
      const url = new URL(endpoint, window.location.origin);
      url.searchParams.append('includeDocumentation', includeDocumentation.toString());
      url.searchParams.append('generateChecksum', generateChecksum.toString());
      url.searchParams.append('includeScreenshots', includeScreenshots.toString());
      
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Export failed');
      }
      
      return response.json();
    },
    onSuccess: (response) => {
      // Handle new API response format with filename and data
      const data = response.data || response;
      const fileName = response.filename || createTemplateFileName(sourceName);
      
      setExportedData(data);
      
      if (exportFormat === 'download') {
        // Create download link
        const blob = new Blob([JSON.stringify(data, null, 2)], { 
          type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        
        // Create temporary download link
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Экспорт завершен",
          description: `Файл ${fileName} скачан`,
        });
        
        onOpenChange(false);
      } else {
        // Copy to clipboard
        navigator.clipboard.writeText(JSON.stringify(data, null, 2)).then(() => {
          toast({
            title: "Скопировано",
            description: "Данные шаблона скопированы в буфер обмена",
          });
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка экспорта",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleExport = () => {
    exportMutation.mutate();
  };

  const handleCopyAgain = () => {
    if (exportedData) {
      const data = exportedData.data || exportedData;
      navigator.clipboard.writeText(JSON.stringify(data, null, 2)).then(() => {
        toast({
          title: "Скопировано",
          description: "Данные шаблона скопированы в буфер обмена",
        });
      });
    }
  };

  const handleDownloadAgain = () => {
    if (exportedData) {
      // Use stored filename or generate one
      const fileName = exportedData.filename || createTemplateFileName(sourceName);
      const data = exportedData.data || exportedData;
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleClose = () => {
    setExportedData(null);
    setExportFormat('download');
    onOpenChange(false);
  };

  const getFileSize = (data: any) => {
    const actualData = data.data || data;
    const jsonString = JSON.stringify(actualData, null, 2);
    const bytes = new Blob([jsonString]).size;
    
    if (bytes < 1024) return `${bytes} байт`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Экспорт {sourceType === 'template' ? 'шаблона' : 'проекта'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Source Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {sourceType === 'template' ? (
                  <Package className="h-5 w-5" />
                ) : (
                  <FileText className="h-5 w-5" />
                )}
                {sourceName}
              </CardTitle>
              {sourceDescription && (
                <CardDescription>{sourceDescription}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                {sourceType === 'template' 
                  ? 'Шаблон будет экспортирован как файл .tbb.json'
                  : 'Проект будет экспортирован как шаблон в формате .tbb.json'
                }
              </div>
            </CardContent>
          </Card>

          {!exportedData && (
            <>
              {/* Export Format Selection */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Способ экспорта</Label>
                  <RadioGroup
                    value={exportFormat}
                    onValueChange={(value) => setExportFormat(value as ExportFormat)}
                    className="mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="download" id="export-download" />
                      <Label htmlFor="export-download" className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Скачать файл
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="copy" id="export-copy" />
                      <Label htmlFor="export-copy" className="flex items-center gap-2">
                        <Copy className="h-4 w-4" />
                        Скопировать в буфер обмена
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    {exportFormat === 'download' 
                      ? 'Файл будет сохранен в формате .tbb.json и может быть импортирован в любую копию Telegram Bot Builder.'
                      : 'Данные будут скопированы в JSON формате. Вы сможете сохранить их в файл вручную.'
                    }
                  </AlertDescription>
                </Alert>
              </div>

              {/* Export Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Параметры экспорта</CardTitle>
                  <CardDescription>
                    Настройте дополнительные данные для включения в экспорт
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-documentation"
                      checked={includeDocumentation}
                      onCheckedChange={(checked) => setIncludeDocumentation(checked === true)}
                    />
                    <Label htmlFor="include-documentation" className="text-sm">
                      Включить автоматически сгенерированную документацию
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="generate-checksum"
                      checked={generateChecksum}
                      onCheckedChange={(checked) => setGenerateChecksum(checked === true)}
                    />
                    <Label htmlFor="generate-checksum" className="text-sm">
                      Генерировать контрольную сумму для проверки целостности
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-screenshots"
                      checked={includeScreenshots}
                      onCheckedChange={(checked) => setIncludeScreenshots(checked === true)}
                      disabled
                    />
                    <Label htmlFor="include-screenshots" className="text-sm text-muted-foreground">
                      Включить скриншоты (пока недоступно)
                    </Label>
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Дополнительные данные увеличивают размер файла, но предоставляют больше информации при импорте.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* File Info */}
              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Имя файла</p>
                      <p className="text-sm text-muted-foreground">
                        {createTemplateFileName(sourceName)}
                      </p>
                    </div>
                    <Badge variant="secondary">JSON</Badge>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Success State */}
          {exportedData && (
            <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-green-800 dark:text-green-200">
                      Экспорт завершен успешно
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                      {exportFormat === 'download' 
                        ? 'Файл скачан на ваш компьютер'
                        : 'Данные скопированы в буфер обмена'
                      }
                    </p>
                    
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-green-600 dark:text-green-400">Размер файла:</span>
                        <span className="font-medium text-green-800 dark:text-green-200">
                          {getFileSize(exportedData)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-green-600 dark:text-green-400">Формат:</span>
                        <span className="font-medium text-green-800 dark:text-green-200">
                          Telegram Bot Builder v1.0
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleDownloadAgain}
                        className="text-green-700 border-green-300 hover:bg-green-100 dark:text-green-200 dark:border-green-700 dark:hover:bg-green-900"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Скачать еще раз
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCopyAgain}
                        className="text-green-700 border-green-300 hover:bg-green-100 dark:text-green-200 dark:border-green-700 dark:hover:bg-green-900"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Скопировать
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {exportedData ? 'Закрыть' : 'Отмена'}
          </Button>
          {!exportedData && (
            <Button 
              onClick={handleExport} 
              disabled={exportMutation.isPending}
            >
              {exportMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Экспортируем...
                </div>
              ) : (
                <>
                  {exportFormat === 'download' ? (
                    <Download className="h-4 w-4 mr-2" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )}
                  {exportFormat === 'download' ? 'Скачать' : 'Копировать'}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}