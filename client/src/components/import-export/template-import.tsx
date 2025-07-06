import React, { useState, useRef } from 'react';
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
  Upload, FileText, Package, AlertCircle, CheckCircle, Info, Download, 
  FileUp, Sparkles, Eye, Settings, ArrowRight, ShieldCheck, Zap 
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { parseTemplateFileName } from '@shared/template-format';

interface TemplateImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (result: any) => void;
}

type ImportMode = 'template' | 'project';

interface ParsedTemplateData {
  name: string;
  description?: string;
  metadata: {
    author?: string;
    category: string;
    difficulty: string;
    language: string;
    tags: string[];
    complexity: number;
    estimatedTime: number;
    requiresToken: boolean;
    exportedAt?: string;
    nodeCount?: number;
    connectionCount?: number;
    hasAdvancedFeatures?: boolean;
    supportedCommands?: string[];
    license?: string;
    minAppVersion?: string;
    previewImage?: string;
  };
  botData: {
    nodes: any[];
    connections: any[];
  };
  exportInfo?: {
    formatVersion?: string;
    exportedBy?: string;
    fileSize?: number;
    checksum?: string;
  };
  additionalData?: {
    documentation?: string;
    screenshots?: string[];
    changelog?: Array<{
      version: string;
      date: string;
      changes: string[];
    }>;
  };
}

interface ValidationResult {
  isValid: boolean;
  template?: ParsedTemplateData;
  errors: string[];
  warnings: string[];
}

export function TemplateImport({ open, onOpenChange, onSuccess }: TemplateImportProps) {
  const [currentTab, setCurrentTab] = useState<'upload' | 'preview' | 'settings'>('upload');
  const [importMode, setImportMode] = useState<ImportMode>('template');
  const [parsedData, setParsedData] = useState<ParsedTemplateData | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const importMutation = useMutation({
    mutationFn: async (data: { mode: ImportMode; templateData: any }) => {
      const endpoint = data.mode === 'template' ? '/api/templates/import' : '/api/projects/import';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.templateData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Import failed');
      }
      
      return response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "Импорт завершен",
        description: result.message,
      });
      
      if (importMode === 'template') {
        queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      }
      
      onSuccess?.(result);
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка импорта",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const processFile = async (file: File) => {
    if (!file) return;

    setFileName(file.name);
    setError('');
    setWarnings([]);
    setParsedData(null);
    setValidationResult(null);
    setUploadProgress(0);

    const { isTemplate } = parseTemplateFileName(file.name);
    if (!isTemplate) {
      setError('Выберите файл шаблона с расширением .tbb.json или .json');
      return;
    }

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 100);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        let jsonData = JSON.parse(content);
        
        if (jsonData.filename && jsonData.data) {
          jsonData = jsonData.data;
        }
        
        setUploadProgress(95);
        
        const response = await fetch('/api/templates/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(jsonData),
        });
        
        if (response.ok) {
          const result: ValidationResult = await response.json();
          setValidationResult(result);
          
          if (result.isValid && result.template) {
            setParsedData(result.template);
            if (result.warnings.length > 0) {
              setWarnings(result.warnings);
            }
            setCurrentTab('preview');
          } else {
            setError(result.errors.join('\n'));
          }
        } else {
          if (!jsonData.name || !jsonData.botData || !jsonData.metadata) {
            throw new Error('Неверный формат файла шаблона');
          }
          setParsedData(jsonData);
          setCurrentTab('preview');
        }
        
        setUploadProgress(100);
        setTimeout(() => setUploadProgress(0), 1000);
      } catch (err) {
        setError('Ошибка чтения файла. Убедитесь, что это правильный файл шаблона.');
        console.error('File parsing error:', err);
        setUploadProgress(0);
      }
    };
    
    reader.readAsText(file);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(event.dataTransfer.files);
    const file = files.find(f => f.name.endsWith('.json') || f.name.endsWith('.tbb.json'));
    
    if (file) {
      processFile(file);
    } else {
      setError('Пожалуйста, выберите файл шаблона (.json или .tbb.json)');
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleImport = () => {
    if (!parsedData) return;
    importMutation.mutate({ mode: importMode, templateData: parsedData });
  };

  const handleClose = () => {
    setParsedData(null);
    setFileName('');
    setError('');
    setWarnings([]);
    setValidationResult(null);
    setImportMode('template');
    setCurrentTab('upload');
    setIsDragOver(false);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onOpenChange(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getComplexityDescription = (complexity: number) => {
    if (complexity <= 3) return 'Простой';
    if (complexity <= 6) return 'Средний';
    return 'Сложный';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="border-b border-border/50 pb-6">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              <FileUp className="h-5 w-5" />
            </div>
            Импорт шаблона
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Загрузите файл шаблона и настройте параметры импорта
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={(value) => setCurrentTab(value as any)} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Загрузка
            </TabsTrigger>
            <TabsTrigger value="preview" disabled={!parsedData} className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Предпросмотр
            </TabsTrigger>
            <TabsTrigger value="settings" disabled={!parsedData} className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Настройки
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto">
            <TabsContent value="upload" className="space-y-6 mt-0">
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  id="template-file"
                  type="file"
                  accept=".json,.tbb.json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`
                    relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
                    transition-all duration-300 hover:border-primary/50 hover:bg-primary/5
                    ${isDragOver 
                      ? 'border-primary bg-primary/10 scale-[1.02]' 
                      : 'border-border/50'
                    }
                    ${error ? 'border-destructive/50 bg-destructive/5' : ''}
                  `}
                >
                  <div className="flex flex-col items-center space-y-4">
                    <div className={`
                      flex items-center justify-center w-16 h-16 rounded-full
                      transition-all duration-300
                      ${isDragOver 
                        ? 'bg-primary text-primary-foreground scale-110' 
                        : 'bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 text-primary'
                      }
                    `}>
                      <FileUp className="h-8 w-8" />
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">
                        {isDragOver ? 'Отпустите файл для загрузки' : 'Выберите файл шаблона'}
                      </h3>
                      <p className="text-muted-foreground">
                        Поддерживаются файлы .json и .tbb.json
                      </p>
                    </div>
                    
                    <Button variant="outline" size="lg" className="mt-4">
                      <Upload className="h-4 w-4 mr-2" />
                      Выбрать файл
                    </Button>
                  </div>
                  
                  {uploadProgress > 0 && (
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span>Загрузка...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}
                </div>

                {fileName && (
                  <Card className="border-dashed">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{fileName}</p>
                            <p className="text-sm text-muted-foreground">
                              {parsedData ? 'Готов к импорту' : 'Обработка...'}
                            </p>
                          </div>
                        </div>
                        {parsedData && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Проверено
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {warnings.length > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <p className="font-medium">Предупреждения:</p>
                        {warnings.map((warning, index) => (
                          <p key={index} className="text-sm">• {warning}</p>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>

            <TabsContent value="preview" className="space-y-6 mt-0">
              {parsedData && (
                <div className="space-y-6">
                  <Card className="border-0 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <CardTitle className="text-xl flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            {parsedData.name}
                          </CardTitle>
                          {parsedData.description && (
                            <CardDescription className="text-base">
                              {parsedData.description}
                            </CardDescription>
                          )}
                        </div>
                        <Badge className={getDifficultyColor(parsedData.metadata.difficulty)}>
                          {getComplexityDescription(parsedData.metadata.complexity)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {parsedData.botData.nodes.length}
                          </div>
                          <div className="text-sm text-muted-foreground">Узлов</div>
                        </div>
                        <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {parsedData.botData.connections.length}
                          </div>
                          <div className="text-sm text-muted-foreground">Связей</div>
                        </div>
                        <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {parsedData.metadata.estimatedTime}
                          </div>
                          <div className="text-sm text-muted-foreground">Минут</div>
                        </div>
                        <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                            {parsedData.metadata.complexity}
                          </div>
                          <div className="text-sm text-muted-foreground">Сложность</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Info className="h-4 w-4" />
                          Информация о шаблоне
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Автор:</span>
                          <span>{parsedData.metadata.author || 'Неизвестно'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Категория:</span>
                          <Badge variant="outline">{parsedData.metadata.category}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Язык:</span>
                          <span className="uppercase">{parsedData.metadata.language}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Технические детали
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Требует токен:</span>
                          <Badge variant={parsedData.metadata.requiresToken ? "destructive" : "secondary"}>
                            {parsedData.metadata.requiresToken ? 'Да' : 'Нет'}
                          </Badge>
                        </div>
                        {parsedData.exportInfo?.formatVersion && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Формат:</span>
                            <span>{parsedData.exportInfo.formatVersion}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {parsedData.metadata.tags && parsedData.metadata.tags.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Теги</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {parsedData.metadata.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="settings" className="space-y-6 mt-0">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Режим импорта
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup
                      value={importMode}
                      onValueChange={(value) => setImportMode(value as ImportMode)}
                      className="space-y-3"
                    >
                      <Card className="p-4 cursor-pointer hover:bg-accent/50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="template" id="import-template" />
                          <div className="flex-1">
                            <Label htmlFor="import-template" className="flex items-center gap-2 font-medium cursor-pointer">
                              <Package className="h-4 w-4 text-blue-500" />
                              Сохранить как шаблон
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              Шаблон будет добавлен в вашу библиотеку
                            </p>
                          </div>
                        </div>
                      </Card>
                      
                      <Card className="p-4 cursor-pointer hover:bg-accent/50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="project" id="import-project" />
                          <div className="flex-1">
                            <Label htmlFor="import-project" className="flex items-center gap-2 font-medium cursor-pointer">
                              <FileText className="h-4 w-4 text-green-500" />
                              Создать новый проект
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              Будет создан новый проект для редактирования
                            </p>
                          </div>
                        </div>
                      </Card>
                    </RadioGroup>
                  </CardContent>
                </Card>

                {validationResult && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        Результат проверки
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-medium">Шаблон прошел проверку</span>
                        </div>
                        
                        {validationResult.warnings.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-orange-500">
                              <AlertCircle className="h-4 w-4" />
                              <span className="text-sm font-medium">Предупреждения</span>
                            </div>
                            <ul className="space-y-1 text-sm text-muted-foreground ml-6">
                              {validationResult.warnings.map((warning, index) => (
                                <li key={index}>• {warning}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="border-t border-border/50 pt-6 mt-6">
          <div className="flex items-center justify-between w-full">
            <Button variant="outline" onClick={handleClose} disabled={importMutation.isPending}>
              Отмена
            </Button>
            <div className="flex items-center gap-3">
              {parsedData && currentTab !== 'settings' && (
                <Button 
                  variant="outline"
                  onClick={() => setCurrentTab('settings')}
                  className="flex items-center gap-2"
                >
                  <ArrowRight className="h-4 w-4" />
                  Настройки
                </Button>
              )}
              <Button 
                onClick={handleImport} 
                disabled={!parsedData || importMutation.isPending}
                className="flex items-center gap-2"
              >
                {importMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Импортируем...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Импортировать
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}