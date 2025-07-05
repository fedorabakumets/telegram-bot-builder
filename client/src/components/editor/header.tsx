import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface HeaderProps {
  projectName: string;
  currentTab: 'editor' | 'preview' | 'export';
  onTabChange: (tab: 'editor' | 'preview' | 'export') => void;
  onSave: () => void;
  onExport: () => void;
  isSaving?: boolean;
}

export function Header({ projectName, currentTab, onTabChange, onSave, onExport, isSaving }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 relative z-50">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <i className="fab fa-telegram-plane text-white text-lg"></i>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">TelegramBot Builder</h1>
            <p className="text-xs text-gray-500">{projectName}</p>
          </div>
        </div>
        
        <div className="h-6 w-px bg-gray-200"></div>
        
        <nav className="flex items-center space-x-1">
          <button 
            onClick={() => onTabChange('editor')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              currentTab === 'editor' 
                ? 'text-primary bg-primary/10' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Редактор
          </button>
          <button 
            onClick={() => onTabChange('preview')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              currentTab === 'preview' 
                ? 'text-primary bg-primary/10' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Превью
          </button>
          <button 
            onClick={() => onTabChange('export')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              currentTab === 'export' 
                ? 'text-primary bg-primary/10' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Экспорт
          </button>
        </nav>
      </div>
      
      <div className="flex items-center space-x-3">
        <Button 
          variant="outline" 
          size="sm"
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center space-x-2"
        >
          <i className={`fas ${isSaving ? 'fa-spinner fa-spin' : 'fa-save'} text-gray-500`}></i>
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
        
        <div className="h-6 w-px bg-gray-200"></div>
        
        <button className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors">
          <i className="fas fa-user text-gray-600 text-sm"></i>
        </button>
      </div>
    </header>
  );
}
