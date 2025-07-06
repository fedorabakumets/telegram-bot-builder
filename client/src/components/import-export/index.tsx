import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, Upload, Package, FileText, ChevronDown, Archive } from 'lucide-react';
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
      <div className="flex gap-2">
        <Button
          variant="outline"
          size={size}
          onClick={() => setImportOpen(true)}
        >
          <Upload className="h-4 w-4" />
          {showLabels && <span className="ml-2">Импорт</span>}
        </Button>
        
        {sourceType && sourceId && sourceName && (
          <Button
            variant="outline"
            size={size}
            onClick={handleExportClick}
          >
            <Download className="h-4 w-4" />
            {showLabels && <span className="ml-2">Экспорт</span>}
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