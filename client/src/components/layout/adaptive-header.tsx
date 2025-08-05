import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { FolderOpen, Bookmark, Save, Download, User, Send, Layout } from 'lucide-react';
import { LayoutConfig } from './layout-manager';

interface AdaptiveHeaderProps {
  config: LayoutConfig;
  projectName: string;
  currentTab: 'editor' | 'preview' | 'export' | 'bot' | 'connections' | 'database' | 'responses';
  onTabChange: (tab: 'editor' | 'preview' | 'export' | 'bot' | 'connections' | 'database' | 'responses') => void;
  onSave: () => void;
  onExport: () => void;
  onSaveAsTemplate?: () => void;
  onLoadTemplate?: () => void;
  onLayoutSettings?: () => void;
  isSaving?: boolean;
}

export function AdaptiveHeader({ 
  config,
  projectName, 
  currentTab, 
  onTabChange, 
  onSave, 
  onExport, 
  onSaveAsTemplate, 
  onLoadTemplate,
  onLayoutSettings,
  isSaving 
}: AdaptiveHeaderProps) {
  
  // Определяем ориентацию заголовка
  const isVertical = config.headerPosition === 'left' || config.headerPosition === 'right';
  const isCompact = config.compactMode;
  
  // Классы для контейнера
  const containerClasses = [
    'bg-background border-border relative z-50',
    isVertical ? 'h-full w-full border-r flex flex-col' : 'h-16 flex items-center justify-between px-6 border-b',
    isCompact ? 'text-sm' : ''
  ].join(' ');

  // Компонент логотипа и названия
  const BrandSection = () => (
    <div className={`flex items-center ${isVertical ? 'flex-col space-y-2 p-4' : 'space-x-3'}`}>
      <div className={`bg-primary rounded-lg flex items-center justify-center ${isCompact ? 'w-6 h-6' : 'w-8 h-8'}`}>
        <i className={`fab fa-telegram-plane text-primary-foreground ${isCompact ? 'text-sm' : 'text-lg'}`}></i>
      </div>
      <div className={isVertical ? 'text-center' : ''}>
        <h1 className={`font-semibold text-foreground ${isCompact ? 'text-sm' : 'text-lg'}`}>
          {isVertical && !isCompact ? 'TelegramBot' : 'TelegramBot Builder'}
        </h1>
        <p className={`text-muted-foreground ${isCompact ? 'text-xs' : 'text-xs'}`}>
          {isVertical ? (projectName.length > 12 ? projectName.substring(0, 12) + '...' : projectName) : projectName}
        </p>
      </div>
    </div>
  );

  // Компонент навигации
  const Navigation = () => (
    <nav className={`flex ${isVertical ? 'flex-col space-y-1 px-2' : 'flex-wrap items-center gap-1 max-sm:grid max-sm:grid-cols-2 max-sm:gap-x-2 max-sm:gap-y-1'}`}>
      {[
        { key: 'editor', label: 'Редактор' },
        { key: 'preview', label: 'Превью' },
        { key: 'export', label: 'Экспорт' },
        { key: 'bot', label: 'Бот' },
        { key: 'connections', label: 'Связи' },
        { key: 'responses', label: 'Пользователи' }
      ].map((tab) => (
        <button 
          key={tab.key}
          onClick={() => onTabChange(tab.key as any)}
          className={`${isCompact ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'} font-medium rounded-md transition-colors ${
            currentTab === tab.key 
              ? 'text-primary bg-primary/10' 
              : 'text-muted-foreground hover:bg-muted'
          } ${isVertical ? 'w-full text-left' : 'whitespace-nowrap'} max-sm:text-xs max-sm:px-2 max-sm:py-1`}
        >
          {isVertical && isCompact ? tab.label.substring(0, 3) : tab.label}
        </button>
      ))}
    </nav>
  );

  // Компонент действий
  const Actions = () => (
    <div className={`flex ${isVertical ? 'flex-col space-y-2 p-2' : 'flex-wrap items-center gap-2 max-sm:grid max-sm:grid-cols-3 max-sm:gap-x-1 max-sm:gap-y-1 max-sm:text-xs'}`}>
      {onLoadTemplate && (
        <Button 
          variant="outline" 
          size={isCompact ? "sm" : "sm"}
          onClick={onLoadTemplate}
          className={`${isVertical ? 'w-full justify-center' : 'flex items-center justify-center'} max-sm:px-1 max-sm:py-1 max-sm:text-xs max-sm:min-w-0 max-sm:w-full`}
        >
          <FolderOpen className="h-4 w-4 max-sm:h-3 max-sm:w-3 max-sm:mx-auto" />
          <span className="max-sm:hidden ml-1">Шаблон</span>
        </Button>
      )}
      
      {onSaveAsTemplate && (
        <Button 
          variant="outline" 
          size={isCompact ? "sm" : "sm"}
          onClick={onSaveAsTemplate}
          className={`${isVertical ? 'w-full justify-center' : 'flex items-center justify-center'} max-sm:px-1 max-sm:py-1 max-sm:text-xs max-sm:min-w-0 max-sm:w-full`}
        >
          <Bookmark className="h-4 w-4 max-sm:h-3 max-sm:w-3 max-sm:mx-auto" />
          <span className="max-sm:hidden ml-1">Создать</span>
        </Button>
      )}
      
      <Button 
        variant="outline" 
        size={isCompact ? "sm" : "sm"}
        onClick={onSave}
        disabled={isSaving}
        className={`${isVertical ? 'w-full justify-center' : 'flex items-center justify-center'} max-sm:px-1 max-sm:py-1 max-sm:text-xs max-sm:min-w-0 max-sm:w-full`}
      >
        <Save className={`h-4 w-4 max-sm:h-3 max-sm:w-3 max-sm:mx-auto ${isSaving ? 'animate-spin' : ''}`} />
        <span className="max-sm:hidden ml-1">{isSaving ? 'Сохр...' : 'Сохр'}</span>
      </Button>
      
      <Button 
        size={isCompact ? "sm" : "sm"}
        onClick={onExport}
        className={`${isVertical ? 'w-full justify-center' : 'flex items-center justify-center'} max-sm:px-1 max-sm:py-1 max-sm:text-xs max-sm:min-w-0 max-sm:w-full max-sm:col-span-2`}
      >
        <i className="fas fa-download text-sm max-sm:text-xs max-sm:mx-auto"></i>
        <span className="max-sm:hidden ml-1">Экспорт</span>
      </Button>
      
      {isVertical && (
        <div className="h-px w-full bg-border my-2"></div>
      )}
      
      <div className="max-sm:col-span-1 max-sm:flex max-sm:justify-center">
        <ThemeToggle />
      </div>
    </div>
  );

  // Разделитель
  const Separator = () => (
    <div className={`${isVertical ? 'h-px w-full' : 'h-6 w-px'} bg-border`}></div>
  );

  if (isVertical) {
    return (
      <header className={containerClasses}>
        <BrandSection />
        <Separator />
        <div className="flex-1 overflow-y-auto">
          <Navigation />
        </div>
        <Separator />
        <Actions />
      </header>
    );
  }

  return (
    <header className={containerClasses}>
      <div className="flex items-center space-x-4">
        <BrandSection />
        <Separator />
        <Navigation />
      </div>
      <Actions />
    </header>
  );
}