import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Upload, FileText, Package, AlertCircle, CheckCircle, Info, Download } from 'lucide-react';
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
  const [importMode, setImportMode] = useState<ImportMode>('template');
  const [parsedData, setParsedData] = useState<ParsedTemplateData | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
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
      
      // Invalidate relevant queries
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError('');
    setWarnings([]);
    setParsedData(null);
    setValidationResult(null);

    // Check file extension
    const { isTemplate } = parseTemplateFileName(file.name);
    if (!isTemplate) {
      setError('Выберите файл шаблона с расширением .tbb.json или .json');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        let jsonData = JSON.parse(content);
        
        // Handle exported file format that wraps template data in a "data" field
        if (jsonData.filename && jsonData.data) {
          jsonData = jsonData.data;
        }
        
        // Perform client-side validation using the same validation as server
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
          } else {
            setError(result.errors.join('\n'));
          }
        } else {
          // Fallback to basic validation if server validation fails
          if (!jsonData.name || !jsonData.botData || !jsonData.metadata) {
            throw new Error('Неверный формат файла шаблона');
          }
          setParsedData(jsonData);
        }
      } catch (err) {
        setError('Ошибка чтения файла. Убедитесь, что это правильный файл шаблона.');
        console.error('File parsing error:', err);
      }
    };
    
    reader.readAsText(file);
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Импорт шаблона
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="template-file" className="text-sm font-medium">
                Выберите файл шаблона (.tbb.json или .json)
              </Label>
              <div className="mt-2">
                <input
                  ref={fileInputRef}
                  id="template-file"
                  type="file"
                  accept=".json,.tbb.json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-20 border-2 border-dashed hover:border-primary/50 transition-colors"
                  disabled={importMutation.isPending}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="text-sm">
                      {fileName || 'Нажмите для выбора файла'}
                    </span>
                  </div>
                </Button>
              </div>
            </div>

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

          {/* Import Mode Selection */}
          {parsedData && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Режим импорта</Label>
                <RadioGroup
                  value={importMode}
                  onValueChange={(value) => setImportMode(value as ImportMode)}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="template" id="import-template" />
                    <Label htmlFor="import-template" className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Сохранить как шаблон
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="project" id="import-project" />
                    <Label htmlFor="import-project" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Создать новый проект
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {importMode === 'template' 
                    ? 'Шаблон будет добавлен в вашу библиотеку и станет доступен для создания новых проектов.'
                    : 'Будет создан новый проект, готовый к редактированию.'
                  }
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Template Preview */}
          {parsedData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{parsedData.name}</CardTitle>
                {parsedData.description && (
                  <CardDescription>{parsedData.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Автор</Label>
                    <p className="text-sm">{parsedData.metadata.author || 'Неизвестно'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Категория</Label>
                    <p className="text-sm capitalize">{parsedData.metadata.category}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Сложность</Label>
                    <Badge className={getDifficultyColor(parsedData.metadata.difficulty)}>
                      {getComplexityDescription(parsedData.metadata.complexity)}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Время создания</Label>
                    <p className="text-sm">{parsedData.metadata.estimatedTime} мин</p>
                  </div>
                  {parsedData.metadata.license && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Лицензия</Label>
                      <p className="text-sm">{parsedData.metadata.license}</p>
                    </div>
                  )}
                  {parsedData.exportInfo?.formatVersion && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Версия формата</Label>
                      <p className="text-sm">{parsedData.exportInfo.formatVersion}</p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Bot Structure */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Узлов</Label>
                    <p className="text-sm font-medium">
                      {parsedData.metadata.nodeCount ?? parsedData.botData.nodes?.length ?? 0}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Связей</Label>
                    <p className="text-sm font-medium">
                      {parsedData.metadata.connectionCount ?? parsedData.botData.connections?.length ?? 0}
                    </p>
                  </div>
                  {parsedData.exportInfo?.fileSize && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Размер файла</Label>
                      <p className="text-sm">{(parsedData.exportInfo.fileSize / 1024).toFixed(1)} КБ</p>
                    </div>
                  )}
                  {parsedData.metadata.hasAdvancedFeatures && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Продвинутые функции</Label>
                      <Badge variant="secondary" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Есть
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Commands */}
                {parsedData.metadata.supportedCommands && parsedData.metadata.supportedCommands.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Поддерживаемые команды</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {parsedData.metadata.supportedCommands.map((command, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          /{command}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {parsedData.metadata.tags && parsedData.metadata.tags.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Теги</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {parsedData.metadata.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Documentation */}
                {parsedData.additionalData?.documentation && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Документация</Label>
                    <div className="text-xs text-muted-foreground mt-1 p-2 bg-muted rounded-md max-h-32 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-xs">
                        {parsedData.additionalData.documentation.slice(0, 300)}
                        {parsedData.additionalData.documentation.length > 300 && '...'}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Changelog */}
                {parsedData.additionalData?.changelog && parsedData.additionalData.changelog.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Последние изменения</Label>
                    <div className="text-xs space-y-1 mt-1">
                      {parsedData.additionalData.changelog.slice(0, 2).map((change, index) => (
                        <div key={index} className="text-muted-foreground">
                          <span className="font-medium">v{change.version}</span> - {change.date}
                          {change.changes.length > 0 && (
                            <div className="ml-2 text-xs">• {change.changes[0]}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Requirements */}
                {parsedData.metadata.requiresToken && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Для работы этого бота потребуется токен Telegram Bot API
                    </AlertDescription>
                  </Alert>
                )}

                {/* Compatibility warning */}
                {parsedData.metadata.minAppVersion && parsedData.metadata.minAppVersion > "1.0.0" && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Требуется версия приложения {parsedData.metadata.minAppVersion} или выше
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={importMutation.isPending}>
            Отмена
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={!parsedData || importMutation.isPending}
          >
            {importMutation.isPending ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Импортируем...
              </div>
            ) : (
              'Импортировать'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}