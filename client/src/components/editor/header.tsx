import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { HistoryIndicator } from './history-indicator';
import { AutoSaveIndicator } from './auto-save-indicator';
import { FloatingTemplateManager } from '@/components/ui/floating-template-manager';
import { ImportExportControls } from '@/components/import-export';
import { FolderOpen, Bookmark, Save, Download, User, Send, Library, Workflow } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'wouter';

interface HeaderProps {
  projectName: string;
  projectId?: number;
  projectDescription?: string;
  currentTab: 'editor' | 'preview' | 'export' | 'bot' | 'connections';
  onTabChange: (tab: 'editor' | 'preview' | 'export' | 'bot' | 'connections') => void;
  onSave: () => void;
  onExport: () => void;
  onSaveAsTemplate?: () => void;
  onLoadTemplate?: () => void;
  isSaving?: boolean;
  // Bot data for template creation
  botData?: any;
  onTemplateSaved?: (templateId: number) => void;
  // Import/Export callbacks
  onImportSuccess?: (result: any) => void;
  // История изменений
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  // Автосохранение
  autoSaveStatus?: {
    isSaving: boolean;
    lastSaved: Date | null;
    hasUnsavedChanges: boolean;
    isEnabled: boolean;
  };
}

export function Header({ 
  projectName, 
  projectId,
  projectDescription,
  currentTab, 
  onTabChange, 
  onSave, 
  onExport, 
  onSaveAsTemplate, 
  onLoadTemplate, 
  isSaving,
  botData,
  onTemplateSaved,
  onImportSuccess,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  autoSaveStatus
}: HeaderProps) {
  return (
    <header className="bg-background border-b border-border h-16 flex items-center justify-between px-6 relative z-50">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <i className="fab fa-telegram-plane text-primary-foreground text-lg"></i>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">TelegramBot Builder</h1>
            <p className="text-xs text-muted-foreground">{projectName}</p>
          </div>
        </div>
        
        <div className="h-6 w-px bg-border"></div>
        
        <nav className="flex items-center space-x-1">
          <button 
            onClick={() => onTabChange('editor')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              currentTab === 'editor' 
                ? 'text-primary bg-primary/10' 
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            Редактор
          </button>
          <button 
            onClick={() => onTabChange('preview')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              currentTab === 'preview' 
                ? 'text-primary bg-primary/10' 
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            Превью
          </button>
          <button 
            onClick={() => onTabChange('export')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              currentTab === 'export' 
                ? 'text-primary bg-primary/10' 
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            Экспорт
          </button>
          <button 
            onClick={() => onTabChange('bot')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              currentTab === 'bot' 
                ? 'text-primary bg-primary/10' 
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            Бот
          </button>
          <button 
            onClick={() => onTabChange('connections')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              currentTab === 'connections' 
                ? 'text-primary bg-primary/10' 
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            Связи
          </button>
        </nav>
      </div>
      
      <div className="flex items-center space-x-3">
        {/* Enhanced Template Manager */}
        {botData && (
          <FloatingTemplateManager
            botData={botData}
            projectName={projectName}
            onTemplateSaved={onTemplateSaved}
            onLoadTemplate={onLoadTemplate}
          />
        )}
        
        {/* Templates Page Link */}
        <Link href="/templates">
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center space-x-2"
          >
            <Library className="h-4 w-4 text-muted-foreground" />
            <span>Библиотека</span>
          </Button>
        </Link>
        
        
        
        
        
        {/* Import/Export Controls */}
        <ImportExportControls
          sourceType={projectId ? 'project' : undefined}
          sourceId={projectId}
          sourceName={projectName}
          sourceDescription={projectDescription}
          onImportSuccess={onImportSuccess}
          variant="split"
          size="sm"
          showLabels={false}
        />
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center space-x-2"
        >
          <Save className={`h-4 w-4 text-muted-foreground ${isSaving ? 'animate-spin' : ''}`} />
          <span>{isSaving ? 'Сохранение...' : 'Сохранить'}</span>
        </Button>
        
        {/* Индикатор автосохранения */}
        {autoSaveStatus && (
          <AutoSaveIndicator
            isSaving={autoSaveStatus.isSaving}
            lastSaved={autoSaveStatus.lastSaved}
            hasUnsavedChanges={autoSaveStatus.hasUnsavedChanges}
            isEnabled={autoSaveStatus.isEnabled}
          />
        )}

        {/* Индикатор истории - только в режиме редактора */}
        {currentTab === 'editor' && onUndo && onRedo && (
          <div className="flex items-center">
            <div className="h-4 w-px bg-border mx-1"></div>
            <HistoryIndicator
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={onUndo}
              onRedo={onRedo}
            />
          </div>
        )}
        
        <Button 
          size="sm"
          onClick={onExport}
          className="flex items-center space-x-2"
        >
          <i className="fas fa-download"></i>
          <span>Экспорт кода</span>
        </Button>
        
        <div className="h-6 w-px bg-border"></div>
        
        <ThemeToggle />
        
        <button className="w-8 h-8 bg-muted hover:bg-muted/80 rounded-full flex items-center justify-center transition-colors">
          <i className="fas fa-user text-muted-foreground text-sm"></i>
        </button>
      </div>
    </header>
  );
}
