import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { FolderOpen, Bookmark, Save, Download, User, Send, Layout } from 'lucide-react';
import { LayoutConfig } from './layout-manager';

interface AdaptiveHeaderProps {
  config: LayoutConfig;
  projectName: string;
  currentTab: 'editor' | 'preview' | 'export' | 'bot' | 'connections';
  onTabChange: (tab: 'editor' | 'preview' | 'export' | 'bot' | 'connections') => void;
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
    <nav className={`flex ${isVertical ? 'flex-col space-y-1 px-2' : 'items-center space-x-1'}`}>
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
          className={`${isCompact ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'} font-medium rounded-md transition-colors ${
            currentTab === tab.key 
              ? 'text-primary bg-primary/10' 
              : 'text-muted-foreground hover:bg-muted'
          } ${isVertical ? 'w-full text-left' : ''}`}
        >
          {isVertical && isCompact ? tab.label.substring(0, 3) : tab.label}
        </button>
      ))}
    </nav>
  );

  // Компонент действий
  const Actions = () => (
    <div className={`flex ${isVertical ? 'flex-col space-y-2 p-2' : 'items-center space-x-3'}`}>
      {onLoadTemplate && (
        <Button 
          variant="outline" 
          size={isCompact ? "sm" : "sm"}
          onClick={onLoadTemplate}
          className={`${isVertical ? 'w-full justify-start' : 'flex items-center space-x-2'}`}
        >
          <FolderOpen className="h-4 w-4" />
          {!isVertical && <span>Шаблоны</span>}
        </Button>
      )}
      
      {onSaveAsTemplate && (
        <Button 
          variant="outline" 
          size={isCompact ? "sm" : "sm"}
          onClick={onSaveAsTemplate}
          className={`${isVertical ? 'w-full justify-start' : 'flex items-center space-x-2'}`}
        >
          <Bookmark className="h-4 w-4" />
          {!isVertical && <span>Сохранить шаблон</span>}
        </Button>
      )}
      
      <Button 
        variant="outline" 
        size={isCompact ? "sm" : "sm"}
        onClick={onSave}
        disabled={isSaving}
        className={`${isVertical ? 'w-full justify-start' : 'flex items-center space-x-2'}`}
      >
        <Save className={`h-4 w-4 ${isSaving ? 'animate-spin' : ''}`} />
        {!isVertical && <span>{isSaving ? 'Сохранение...' : 'Сохранить'}</span>}
      </Button>
      
      <Button 
        size={isCompact ? "sm" : "sm"}
        onClick={onExport}
        className={`${isVertical ? 'w-full justify-start' : 'flex items-center space-x-2'}`}
      >
        <i className="fas fa-download"></i>
        {!isVertical && <span>Экспорт кода</span>}
      </Button>
      
      {isVertical && (
        <div className="h-px w-full bg-border my-2"></div>
      )}
      
      {onLayoutSettings && (
        <Button 
          variant="ghost" 
          size={isCompact ? "sm" : "sm"}
          onClick={onLayoutSettings}
          className={`${isVertical ? 'w-full justify-start' : ''}`}
        >
          <Layout className="h-4 w-4" />
          {!isVertical && <span>Макет</span>}
        </Button>
      )}
      
      <ThemeToggle />
      
      <button className={`${isCompact ? 'w-6 h-6' : 'w-8 h-8'} bg-muted hover:bg-muted/80 rounded-full flex items-center justify-center transition-colors`}>
        <i className={`fas fa-user text-muted-foreground ${isCompact ? 'text-xs' : 'text-sm'}`}></i>
      </button>
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