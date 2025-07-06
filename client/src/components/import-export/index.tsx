import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Download, Upload, Package, FileText, ChevronDown, Archive, 
  Sparkles, Zap, ArrowUpFromLine, ArrowDownToLine, Layers, Shield
} from 'lucide-react';
import { TemplateImport } from './template-import';
import { TemplateExport } from './template-export';
import { BatchOperations } from './batch-operations';

interface ImportExportControlsProps {
  // For export
  sourceType?: 'template' | 'project';
  sourceId?: number;
  sourceName?: string;
  sourceDescription?: string;
  
  // Callbacks
  onImportSuccess?: (result: any) => void;
  onExportSuccess?: () => void;
  
  // UI options
  variant?: 'button' | 'dropdown' | 'split';
  size?: 'sm' | 'default' | 'lg';
  showLabels?: boolean;
}

export function ImportExportControls({
  sourceType,
  sourceId,
  sourceName,
  sourceDescription,
  onImportSuccess,
  onExportSuccess,
  variant = 'dropdown',
  size = 'default',
  showLabels = true
}: ImportExportControlsProps) {
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);

  const handleImportSuccess = (result: any) => {
    onImportSuccess?.(result);
  };

  const handleExportClick = () => {
    if (sourceType && sourceId && sourceName) {
      setExportOpen(true);
    }
  };

  if (variant === 'button') {
    return (
      <div className="flex gap-3">
        <Button
          variant="outline"
          size={size}
          onClick={() => setImportOpen(true)}
          className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-primary/20 hover:border-primary/40 hover:bg-primary/5"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <ArrowUpFromLine className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
          {showLabels && <span className="ml-2 relative z-10">Импорт</span>}
        </Button>
        
        {sourceType && sourceId && sourceName && (
          <Button
            variant="outline"
            size={size}
            onClick={handleExportClick}
            className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-500/5"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <ArrowDownToLine className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
            {showLabels && <span className="ml-2 relative z-10">Экспорт</span>}
          </Button>
        )}

        <TemplateImport
          open={importOpen}
          onOpenChange={setImportOpen}
          onSuccess={handleImportSuccess}
        />

        {sourceType && sourceId && sourceName && (
          <TemplateExport
            open={exportOpen}
            onOpenChange={setExportOpen}
            sourceType={sourceType}
            sourceId={sourceId}
            sourceName={sourceName}
            sourceDescription={sourceDescription}
          />
        )}
      </div>
    );
  }

  if (variant === 'split') {
    return (
      <div className="flex">
        <Button
          variant="outline"
          size={size}
          onClick={() => setImportOpen(true)}
          className="rounded-r-none border-r-0"
        >
          <Upload className="h-4 w-4" />
          {showLabels && <span className="ml-2">Импорт</span>}
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size={size}
              className="rounded-l-none px-2"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setImportOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Импорт шаблона
            </DropdownMenuItem>
            
            {sourceType && sourceId && sourceName && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleExportClick}>
                  <Download className="h-4 w-4 mr-2" />
                  Экспорт {sourceType === 'template' ? 'шаблона' : 'проекта'}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <TemplateImport
          open={importOpen}
          onOpenChange={setImportOpen}
          onSuccess={handleImportSuccess}
        />

        {sourceType && sourceId && sourceName && (
          <TemplateExport
            open={exportOpen}
            onOpenChange={setExportOpen}
            sourceType={sourceType}
            sourceId={sourceId}
            sourceName={sourceName}
            sourceDescription={sourceDescription}
          />
        )}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Import Card */}
        <Card className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 hover:scale-[1.02]">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="text-center pb-3">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
              <ArrowUpFromLine className="h-8 w-8 text-white group-hover:scale-110 transition-transform duration-300" />
            </div>
            <CardTitle className="text-xl text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              Импорт шаблона
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Загрузите готовый шаблон бота из файла .tbb.json или создайте проект
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>.tbb.json</span>
              </div>
              <div className="flex items-center gap-1">
                <Sparkles className="h-4 w-4" />
                <span>Автопроверка</span>
              </div>
            </div>
            <Button 
              onClick={() => setImportOpen(true)} 
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Upload className="h-4 w-4 mr-2" />
              Загрузить шаблон
            </Button>
          </CardContent>
        </Card>

        {/* Export Card */}
        {sourceType && sourceId && sourceName && (
          <Card className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="text-center pb-3">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <ArrowDownToLine className="h-8 w-8 text-white group-hover:scale-110 transition-transform duration-300" />
              </div>
              <CardTitle className="text-xl text-gray-900 dark:text-gray-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Экспорт {sourceType === 'template' ? 'шаблона' : 'проекта'}
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Сохраните "{sourceName}" как файл шаблона для переиспользования
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Package className="h-4 w-4" />
                  <span>TBB формат</span>
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  <span>Проверка целостности</span>
                </div>
              </div>
              <Button 
                onClick={handleExportClick} 
                variant="outline" 
                className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/30 transition-all duration-300"
              >
                <Download className="h-4 w-4 mr-2" />
                Сохранить шаблон
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Batch Operations Card */}
        <Card className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 hover:scale-[1.02]">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="text-center pb-3">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
              <Layers className="h-8 w-8 text-white group-hover:scale-110 transition-transform duration-300" />
            </div>
            <CardTitle className="text-xl text-gray-900 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              Пакетные операции
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Массовый импорт и экспорт нескольких шаблонов одновременно
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Archive className="h-4 w-4" />
                <span>Множественный</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="h-4 w-4" />
                <span>Быстро</span>
              </div>
            </div>
            <Button 
              onClick={() => setBatchOpen(true)} 
              variant="outline" 
              className="w-full border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-950/30 transition-all duration-300"
            >
              <Package className="h-4 w-4 mr-2" />
              Пакетные операции
            </Button>
          </CardContent>
        </Card>

        <TemplateImport
          open={importOpen}
          onOpenChange={setImportOpen}
          onSuccess={handleImportSuccess}
        />

        <BatchOperations
          open={batchOpen}
          onOpenChange={setBatchOpen}
        />

        {sourceType && sourceId && sourceName && (
          <TemplateExport
            open={exportOpen}
            onOpenChange={setExportOpen}
            sourceType={sourceType}
            sourceId={sourceId}
            sourceName={sourceName}
            sourceDescription={sourceDescription}
          />
        )}
      </div>
    );
  }

  // Default dropdown variant
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size={size}>
            <Package className="h-4 w-4" />
            {showLabels && <span className="ml-2">Импорт/Экспорт</span>}
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Импорт шаблона
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => setBatchOpen(true)}>
            <Archive className="h-4 w-4 mr-2" />
            Пакетные операции
          </DropdownMenuItem>
          
          {sourceType && sourceId && sourceName && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleExportClick}>
                <Download className="h-4 w-4 mr-2" />
                Экспорт {sourceType === 'template' ? 'шаблона' : 'проекта'}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <TemplateImport
        open={importOpen}
        onOpenChange={setImportOpen}
        onSuccess={handleImportSuccess}
      />

      <BatchOperations
        open={batchOpen}
        onOpenChange={setBatchOpen}
      />

      {sourceType && sourceId && sourceName && (
        <TemplateExport
          open={exportOpen}
          onOpenChange={setExportOpen}
          sourceType={sourceType}
          sourceId={sourceId}
          sourceName={sourceName}
          sourceDescription={sourceDescription}
        />
      )}
    </>
  );
}

export { TemplateImport, TemplateExport };