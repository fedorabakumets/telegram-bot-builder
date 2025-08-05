import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { FolderOpen, Bookmark, Save, Download, User, Send } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  projectName: string;
  currentTab: 'editor' | 'preview' | 'export' | 'bot' | 'connections';
  onTabChange: (tab: 'editor' | 'preview' | 'export' | 'bot' | 'connections') => void;
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
        
        <nav className="flex flex-wrap items-center gap-1 max-sm:grid max-sm:grid-cols-2 max-sm:gap-x-2 max-sm:gap-y-1">
          {[
            { key: 'editor', label: 'Редактор' },
            { key: 'preview', label: 'Превью' },
            { key: 'export', label: 'Экспорт' },
            { key: 'bot', label: 'Бот' },
            { key: 'connections', label: 'Связи' }
          ].map((tab) => (
            <button 
              key={tab.key}
              onClick={() => onTabChange(tab.key as any)}
              className={`px-3 py-1.5 text-sm max-sm:text-xs max-sm:px-2 max-sm:py-1 font-medium rounded-md transition-colors whitespace-nowrap ${
                currentTab === tab.key 
                  ? 'text-primary bg-primary/10' 
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      
      <div className="flex flex-wrap items-center gap-2 max-sm:grid max-sm:grid-cols-3 max-sm:gap-x-1 max-sm:gap-y-1 max-sm:text-xs">
        {onLoadTemplate && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              console.log('Templates button clicked in header');
              onLoadTemplate();
            }}
            className="flex items-center justify-center px-2 py-1 text-xs max-sm:px-1 max-sm:py-1 max-sm:min-w-0 max-sm:w-full"
          >
            <FolderOpen className="h-3 w-3 max-sm:mx-auto text-muted-foreground" />
            <span className="max-sm:hidden ml-1">Шаблон</span>
          </Button>
        )}
        
        {onSaveAsTemplate && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={onSaveAsTemplate}
            className="flex items-center justify-center px-2 py-1 text-xs max-sm:px-1 max-sm:py-1 max-sm:min-w-0 max-sm:w-full"
          >
            <Bookmark className="h-3 w-3 max-sm:mx-auto text-muted-foreground" />
            <span className="max-sm:hidden ml-1">Создать</span>
          </Button>
        )}
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center justify-center px-2 py-1 text-xs max-sm:px-1 max-sm:py-1 max-sm:min-w-0 max-sm:w-full"
        >
          <Save className={`h-3 w-3 max-sm:mx-auto text-muted-foreground ${isSaving ? 'animate-spin' : ''}`} />
          <span className="max-sm:hidden ml-1">{isSaving ? 'Сохр...' : 'Сохр'}</span>
        </Button>
        
        <Button 
          size="sm"
          onClick={onExport}
          className="flex items-center justify-center px-2 py-1 text-xs max-sm:px-1 max-sm:py-1 max-sm:min-w-0 max-sm:w-full max-sm:col-span-2"
        >
          <i className="fas fa-download text-xs max-sm:mx-auto"></i>
          <span className="max-sm:hidden ml-1">Экспорт</span>
        </Button>
        
        <div className="h-6 w-px bg-border max-sm:hidden"></div>
        
        <div className="max-sm:col-span-1 max-sm:flex max-sm:justify-center">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
