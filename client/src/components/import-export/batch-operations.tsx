import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  Package, 
  Download, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  FileText,
  Trash2,
  Plus
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface BatchOperationsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface BatchExportItem {
  id: number;
  name: string;
  description?: string;
  category: string;
  selected: boolean;
  type: 'template' | 'project';
}

export function BatchOperations({ open, onOpenChange }: BatchOperationsProps) {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [selectedItems, setSelectedItems] = useState<BatchExportItem[]>([]);
  const [batchName, setBatchName] = useState('');
  const [batchDescription, setBatchDescription] = useState('');
  const [importFiles, setImportFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Загрузка шаблонов и проектов для экспорта
  const { data: templates = [] } = useQuery({
    queryKey: ['/api/templates'],
    enabled: open && activeTab === 'export',
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['/api/projects'],
    enabled: open && activeTab === 'export',
  });

  // Инициализация списка элементов для экспорта
  React.useEffect(() => {
    if ((templates as any[])?.length > 0 || (projects as any[])?.length > 0) {
      const items: BatchExportItem[] = [
        ...(templates as any[] || []).map((template: any) => ({
          id: template.id,
          name: template.name,
          description: template.description,
          category: template.category,
          selected: false,
          type: 'template' as const,
        })),
        ...(projects as any[] || []).map((project: any) => ({
          id: project.id,
          name: project.name,
          description: project.description,
          category: 'project',
          selected: false,
          type: 'project' as const,
        })),
      ];
      setSelectedItems(items);
    }
  }, [templates, projects]);

  // Пакетный экспорт
  const batchExportMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; items: BatchExportItem[] }) => {
      setIsProcessing(true);
      setProgress(0);
      
      const selectedTemplates = data.items.filter(item => item.selected);
      const exportData = [];
      
      for (let i = 0; i < selectedTemplates.length; i++) {
        const item = selectedTemplates[i];
        const endpoint = item.type === 'template' 
          ? `/api/templates/${item.id}/export`
          : `/api/projects/${item.id}/export`;
        
        const response = await fetch(endpoint);
        if (response.ok) {
          const result = await response.json();
          exportData.push(result.data || result);
        }
        
        setProgress(((i + 1) / selectedTemplates.length) * 100);
      }
      
      // Создание пакетного файла
      const batchFile = {
        templates: exportData,
        batchInfo: {
          name: data.name,
          description: data.description,
          exportedAt: new Date().toISOString(),
          totalTemplates: exportData.length,
          totalSize: JSON.stringify(exportData).length,
        },
      };
      
      return batchFile;
    },
    onSuccess: (batchFile) => {
      // Скачивание пакетного файла
      const blob = new Blob([JSON.stringify(batchFile, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${batchName || 'batch'}_templates_${new Date().toISOString().split('T')[0]}.tbb-batch.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Пакетный экспорт завершен",
        description: `Экспортировано ${batchFile.templates.length} шаблонов`,
      });
      
      setIsProcessing(false);
      setProgress(0);
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка пакетного экспорта",
        description: error.message,
        variant: "destructive",
      });
      setIsProcessing(false);
      setProgress(0);
    },
  });

  // Пакетный импорт
  const batchImportMutation = useMutation({
    mutationFn: async (files: File[]) => {
      setIsProcessing(true);
      setProgress(0);
      
      const results = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const content = await file.text();
        const data = JSON.parse(content);
        
        // Проверяем, это пакетный файл или обычный шаблон
        if (data.templates && data.batchInfo) {
          // Пакетный файл
          for (const template of data.templates) {
            const response = await fetch('/api/templates/import', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(template),
            });
            
            if (response.ok) {
              const result = await response.json();
              results.push(result);
            }
          }
        } else {
          // Обычный шаблон
          const response = await fetch('/api/templates/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          
          if (response.ok) {
            const result = await response.json();
            results.push(result);
          }
        }
        
        setProgress(((i + 1) / files.length) * 100);
      }
      
      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      
      toast({
        title: "Пакетный импорт завершен",
        description: `Импортировано ${results.length} шаблонов`,
      });
      
      setIsProcessing(false);
      setProgress(0);
      setImportFiles([]);
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка пакетного импорта",
        description: error.message,
        variant: "destructive",
      });
      setIsProcessing(false);
      setProgress(0);
    },
  });

  const handleSelectAll = (checked: boolean) => {
    setSelectedItems(items => items.map(item => ({ ...item, selected: checked })));
  };

  const handleSelectItem = (id: number, checked: boolean) => {
    setSelectedItems(items => 
      items.map(item => 
        item.id === id ? { ...item, selected: checked } : item
      )
    );
  };

  const handleExport = () => {
    const selected = selectedItems.filter(item => item.selected);
    if (selected.length === 0) {
      toast({
        title: "Выберите элементы",
        description: "Выберите хотя бы один шаблон или проект для экспорта",
        variant: "destructive",
      });
      return;
    }

    batchExportMutation.mutate({
      name: batchName,
      description: batchDescription,
      items: selectedItems,
    });
  };

  const handleImport = () => {
    if (importFiles.length === 0) {
      toast({
        title: "Выберите файлы",
        description: "Выберите файлы для импорта",
        variant: "destructive",
      });
      return;
    }

    batchImportMutation.mutate(importFiles);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setImportFiles(files);
  };

  const removeImportFile = (index: number) => {
    setImportFiles(files => files.filter((_, i) => i !== index));
  };

  const selectedCount = selectedItems.filter(item => item.selected).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Пакетные операции
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Экспорт
            </TabsTrigger>
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Импорт
            </TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-6">
            {/* Настройки экспорта */}
            <Card>
              <CardHeader>
                <CardTitle>Настройки пакетного экспорта</CardTitle>
                <CardDescription>
                  Создайте пакет шаблонов для совместного использования или резервного копирования
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="batch-name">Название пакета</Label>
                  <Input
                    id="batch-name"
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    placeholder="Мой набор шаблонов"
                  />
                </div>
                <div>
                  <Label htmlFor="batch-description">Описание (опционально)</Label>
                  <Textarea
                    id="batch-description"
                    value={batchDescription}
                    onChange={(e) => setBatchDescription(e.target.value)}
                    placeholder="Описание набора шаблонов..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Выбор элементов */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Выберите элементы для экспорта
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedCount === selectedItems.length && selectedItems.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                    <span className="text-sm text-muted-foreground">
                      Выбрать все ({selectedCount}/{selectedItems.length})
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {selectedItems.map((item) => (
                    <div
                      key={`${item.type}-${item.id}`}
                      className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={item.selected}
                        onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {item.type === 'template' ? (
                            <Package className="h-4 w-4" />
                          ) : (
                            <FileText className="h-4 w-4" />
                          )}
                          <span className="font-medium">{item.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {item.type === 'template' ? 'Шаблон' : 'Проект'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {item.category}
                          </Badge>
                        </div>
                        {item.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {isProcessing && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Экспорт в процессе...</span>
                      <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} />
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="import" className="space-y-6">
            {/* Выбор файлов */}
            <Card>
              <CardHeader>
                <CardTitle>Выберите файлы для импорта</CardTitle>
                <CardDescription>
                  Поддерживаются файлы .tbb.json (шаблоны) и .tbb-batch.json (пакеты)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <input
                      type="file"
                      multiple
                      accept=".json,.tbb.json,.tbb-batch.json"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="import-files"
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('import-files')?.click()}
                      className="w-full h-20 border-2 border-dashed"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-6 w-6" />
                        <span>Выберите файлы для импорта</span>
                      </div>
                    </Button>
                  </div>

                  {importFiles.length > 0 && (
                    <div className="space-y-2">
                      <Label>Выбранные файлы:</Label>
                      {importFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 border rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span className="text-sm">{file.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {(file.size / 1024).toFixed(1)} КБ
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeImportFile(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {isProcessing && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Импорт в процессе...</span>
                      <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} />
                  </div>
                </CardContent>
              </Card>
            )}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                При импорте дублирующиеся шаблоны будут пропущены. 
                Все импортированные шаблоны будут добавлены в категорию "Пользовательские".
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Отмена
          </Button>
          {activeTab === 'export' ? (
            <Button 
              onClick={handleExport}
              disabled={selectedCount === 0 || isProcessing}
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Экспортируем...
                </div>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Экспортировать ({selectedCount})
                </>
              )}
            </Button>
          ) : (
            <Button 
              onClick={handleImport}
              disabled={importFiles.length === 0 || isProcessing}
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Импортируем...
                </div>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Импортировать ({importFiles.length})
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}