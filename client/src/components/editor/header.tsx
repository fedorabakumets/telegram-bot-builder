import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { FolderOpen, Bookmark, Save, Download, User, Send } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  projectName: string;
  currentTab: 'editor' | 'preview' | 'export' | 'bot';
  onTabChange: (tab: 'editor' | 'preview' | 'export' | 'bot') => void;
  onSave: () => void;
  onExport: () => void;
  onSaveAsTemplate?: () => void;
  onLoadTemplate?: () => void;
  isSaving?: boolean;
}

export function Header({ projectName, currentTab, onTabChange, onSave, onExport, onSaveAsTemplate, onLoadTemplate, isSaving }: HeaderProps) {
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
        </nav>
      </div>
      
      <div className="flex items-center space-x-3">
        {onLoadTemplate && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={onLoadTemplate}
            className="flex items-center space-x-2"
          >
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
            <span>Шаблоны</span>
          </Button>
        )}
        
        {onSaveAsTemplate && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={onSaveAsTemplate}
            className="flex items-center space-x-2"
          >
            <Bookmark className="h-4 w-4 text-muted-foreground" />
            <span>Сохранить шаблон</span>
          </Button>
        )}
        
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
