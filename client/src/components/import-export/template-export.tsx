import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Download, Package, FileText, Info, CheckCircle, Copy, 
  FileDown, Settings, Eye, Sparkles, ArrowRight, Clock, 
  Star, Users, Zap, Shield
} from 'lucide-react';
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
  const [currentTab, setCurrentTab] = useState<'settings' | 'preview' | 'export'>('settings');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('download');
  const [exportedData, setExportedData] = useState<any>(null);
  const [includeDocumentation, setIncludeDocumentation] = useState(true);
  const [generateChecksum, setGenerateChecksum] = useState(true);
  const [includeScreenshots, setIncludeScreenshots] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const { toast } = useToast();

  const exportMutation = useMutation({
    mutationFn: async () => {
      setIsProcessing(true);
      setExportProgress(0);
      
      // Simulate progress steps
      const progressSteps = [20, 40, 60, 80, 100];
      
      for (const step of progressSteps) {
        setExportProgress(step);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      const endpoint = sourceType === 'template' 
        ? `/api/templates/${sourceId}/export`
        : `/api/projects/${sourceId}/export`;
      
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
      const data = response.data || response;
      const fileName = response.filename || createTemplateFileName(sourceName);
      
      setExportedData({ data, fileName });
      setCurrentTab('export');
      
      if (exportFormat === 'download') {
        downloadFile(data, fileName);
      } else {
        copyToClipboard(data);
      }
      
      setIsProcessing(false);
      setExportProgress(0);
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка экспорта",
        description: error.message,
        variant: "destructive",
      });
      setIsProcessing(false);
      setExportProgress(0);
    },
  });

  const downloadFile = (data: any, fileName: string) => {
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
    
    toast({
      title: "Файл скачан",
      description: `${fileName} успешно сохранен`,
    });
  };

  const copyToClipboard = (data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2)).then(() => {
      toast({
        title: "Скопировано",
        description: "Данные шаблона скопированы в буфер обмена",
      });
    });
  };

  const handleExport = () => {
    exportMutation.mutate();
  };

  const handleClose = () => {
    setExportedData(null);
    setExportFormat('download');
    setCurrentTab('settings');
    setIsProcessing(false);
    setExportProgress(0);
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

  const getExportStatistics = () => {
    if (!exportedData?.data) return null;
    
    const data = exportedData.data;
    const stats = {
      nodes: data.botData?.nodes?.length || 0,
      connections: data.botData?.connections?.length || 0,
      fileSize: getFileSize(data),
      formatVersion: data.exportInfo?.formatVersion || '1.1',
      hasDocumentation: !!data.additionalData?.documentation,
      hasChecksum: !!data.exportInfo?.checksum
    };
    
    return stats;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="border-b border-border/50 pb-6">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-blue-600 text-white">
              <FileDown className="h-5 w-5" />
            </div>
            Экспорт {sourceType === 'template' ? 'шаблона' : 'проекта'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Настройте параметры экспорта для "{sourceName}"
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={(value) => setCurrentTab(value as any)} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Настройки
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Предпросмотр
            </TabsTrigger>
            <TabsTrigger value="export" disabled={!exportedData} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Экспорт
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto">
            <TabsContent value="settings" className="space-y-6 mt-0">
              {/* Export Format Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Формат экспорта
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={exportFormat}
                    onValueChange={(value) => setExportFormat(value as ExportFormat)}
                    className="space-y-3"
                  >
                    <Card className="p-4 cursor-pointer hover:bg-accent/50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="download" id="format-download" />
                        <div className="flex-1">
                          <Label htmlFor="format-download" className="flex items-center gap-2 font-medium cursor-pointer">
                            <Download className="h-4 w-4 text-blue-500" />
                            Скачать файл
                          </Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            Сохранить как .tbb.json файл на ваше устройство
                          </p>
                        </div>
                      </div>
                    </Card>
                    
                    <Card className="p-4 cursor-pointer hover:bg-accent/50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="copy" id="format-copy" />
                        <div className="flex-1">
                          <Label htmlFor="format-copy" className="flex items-center gap-2 font-medium cursor-pointer">
                            <Copy className="h-4 w-4 text-green-500" />
                            Копировать в буфер
                          </Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            Скопировать JSON данные в буфер обмена
                          </p>
                        </div>
                      </div>
                    </Card>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Export Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Дополнительные параметры
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="font-medium">Включить документацию</Label>
                      <p className="text-sm text-muted-foreground">
                        Добавить описания и комментарии к шаблону
                      </p>
                    </div>
                    <Checkbox
                      checked={includeDocumentation}
                      onCheckedChange={setIncludeDocumentation}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="font-medium">Генерировать контрольную сумму</Label>
                      <p className="text-sm text-muted-foreground">
                        Добавить проверку целостности файла
                      </p>
                    </div>
                    <Checkbox
                      checked={generateChecksum}
                      onCheckedChange={setGenerateChecksum}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="font-medium">Включить скриншоты</Label>
                      <p className="text-sm text-muted-foreground">
                        Добавить изображения предпросмотра (экспериментально)
                      </p>
                    </div>
                    <Checkbox
                      checked={includeScreenshots}
                      onCheckedChange={setIncludeScreenshots}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Source Information */}
              <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-0">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Информация об источнике
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Тип:</span>
                    <Badge variant="outline">
                      {sourceType === 'template' ? 'Шаблон' : 'Проект'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Название:</span>
                    <span className="font-medium">{sourceName}</span>
                  </div>
                  {sourceDescription && (
                    <div className="space-y-2">
                      <span className="text-muted-foreground">Описание:</span>
                      <p className="text-sm bg-white/50 dark:bg-black/20 p-2 rounded">
                        {sourceDescription}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preview" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Предпросмотр экспорта
                  </CardTitle>
                  <CardDescription>
                    Ваш {sourceType === 'template' ? 'шаблон' : 'проект'} будет экспортирован с следующими настройками
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Формат и настройки
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Формат экспорта:</span>
                          <Badge variant="outline">
                            {exportFormat === 'download' ? 'Файл' : 'Буфер обмена'}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Документация:</span>
                          <Badge variant={includeDocumentation ? "default" : "secondary"}>
                            {includeDocumentation ? 'Включена' : 'Отключена'}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Контр. сумма:</span>
                          <Badge variant={generateChecksum ? "default" : "secondary"}>
                            {generateChecksum ? 'Включена' : 'Отключена'}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Скриншоты:</span>
                          <Badge variant={includeScreenshots ? "default" : "secondary"}>
                            {includeScreenshots ? 'Включены' : 'Отключены'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Структура файла
                      </h4>
                      <div className="space-y-2 text-sm font-mono bg-muted/50 p-3 rounded">
                        <div>📁 {createTemplateFileName(sourceName)}</div>
                        <div className="ml-4">├── metadata</div>
                        <div className="ml-4">├── botData</div>
                        <div className="ml-4">├── exportInfo</div>
                        {includeDocumentation && <div className="ml-4">├── documentation</div>}
                        {includeScreenshots && <div className="ml-4">└── screenshots</div>}
                      </div>
                    </div>
                  </div>
                  
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Экспортированный файл будет совместим с системой импорта шаблонов
                      и может быть легко импортирован в другие проекты.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="export" className="space-y-6 mt-0">
              {exportedData && (
                <div className="space-y-6">
                  {/* Success Card */}
                  <Card className="border-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900">
                          <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <CardTitle className="text-xl text-green-800 dark:text-green-200">
                            Экспорт завершен успешно!
                          </CardTitle>
                          <CardDescription className="text-green-700 dark:text-green-300">
                            Ваш {sourceType === 'template' ? 'шаблон' : 'проект'} готов к использованию
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const stats = getExportStatistics();
                        return stats ? (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {stats.nodes}
                              </div>
                              <div className="text-sm text-muted-foreground">Узлов</div>
                            </div>
                            <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {stats.connections}
                              </div>
                              <div className="text-sm text-muted-foreground">Связей</div>
                            </div>
                            <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                                {stats.fileSize}
                              </div>
                              <div className="text-sm text-muted-foreground">Размер</div>
                            </div>
                            <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                              <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                                v{stats.formatVersion}
                              </div>
                              <div className="text-sm text-muted-foreground">Формат</div>
                            </div>
                          </div>
                        ) : null;
                      })()}
                    </CardContent>
                  </Card>

                  {/* File Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Дополнительные действия
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button
                          variant="outline"
                          onClick={() => downloadFile(exportedData.data, exportedData.fileName)}
                          className="h-20 flex flex-col items-center gap-2"
                        >
                          <Download className="h-6 w-6" />
                          <span>Скачать снова</span>
                        </Button>
                        
                        <Button
                          variant="outline"
                          onClick={() => copyToClipboard(exportedData.data)}
                          className="h-20 flex flex-col items-center gap-2"
                        >
                          <Copy className="h-6 w-6" />
                          <span>Копировать в буфер</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* File Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Информация о файле
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Имя файла:</span>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {exportedData.fileName}
                        </code>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Размер:</span>
                        <span>{getFileSize(exportedData.data)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Формат:</span>
                        <Badge variant="outline">TBB v1.1</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Processing State */}
              {isProcessing && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center space-y-4">
                      <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-primary/10">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold">Подготовка экспорта...</h3>
                        <p className="text-muted-foreground">
                          Пожалуйста, подождите, пока мы обрабатываем ваш {sourceType === 'template' ? 'шаблон' : 'проект'}
                        </p>
                      </div>
                      <div className="w-full max-w-md mx-auto">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span>Прогресс</span>
                          <span>{exportProgress}%</span>
                        </div>
                        <Progress value={exportProgress} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="border-t border-border/50 pt-6 mt-6">
          <div className="flex items-center justify-between w-full">
            <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
              {exportedData ? 'Закрыть' : 'Отмена'}
            </Button>
            <div className="flex items-center gap-3">
              {!exportedData && currentTab !== 'preview' && (
                <Button 
                  variant="outline"
                  onClick={() => setCurrentTab('preview')}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Предпросмотр
                </Button>
              )}
              {!exportedData && (
                <Button 
                  onClick={handleExport} 
                  disabled={isProcessing}
                  className="flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Экспортируем...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Экспортировать
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}