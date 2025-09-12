import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { FolderOpen, Bookmark, Download, User, Send, Layout, Navigation as NavigationIcon, Sidebar, Monitor, Sliders, Users, Menu, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { LayoutConfig } from './layout-manager';

interface BotInfo {
  first_name: string;
  username?: string;
  description?: string;
  short_description?: string;
}

interface AdaptiveHeaderProps {
  config: LayoutConfig;
  projectName: string;
  botInfo?: BotInfo | null;
  currentTab: 'editor' | 'preview' | 'export' | 'bot' | 'users' | 'groups';
  onTabChange: (tab: 'editor' | 'preview' | 'export' | 'bot' | 'users' | 'groups') => void;
  onExport: () => void;
  onSaveAsTemplate?: () => void;
  onLoadTemplate?: () => void;
  onLayoutSettings?: () => void;
  // Кнопки управления макетом
  onToggleHeader?: () => void;
  onToggleSidebar?: () => void;
  onToggleProperties?: () => void;
  onToggleCanvas?: () => void;
  headerVisible?: boolean;
  sidebarVisible?: boolean;
  propertiesVisible?: boolean;
  canvasVisible?: boolean;
}

export function AdaptiveHeader({ 
  config,
  projectName,
  botInfo,
  currentTab, 
  onTabChange, 
  onExport, 
  onSaveAsTemplate, 
  onLoadTemplate,
  onLayoutSettings,
  onToggleHeader,
  onToggleSidebar,
  onToggleProperties,
  onToggleCanvas,
  headerVisible,
  sidebarVisible,
  propertiesVisible,
  canvasVisible
}: AdaptiveHeaderProps) {
  
  // Состояние для мобильного меню
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Определяем мобильное устройство
  const isMobile = useIsMobile();
  
  // Определяем ориентацию заголовка
  const isVertical = config.headerPosition === 'left' || config.headerPosition === 'right';
  const isCompact = config.compactMode;
  
  // Классы для контейнера с адаптивной высотой для мобильных устройств
  const containerClasses = [
    'bg-background border-border relative z-50',
    isVertical ? 'h-full w-full border-r flex flex-col' : `${isMobile ? 'h-10' : 'h-12'} flex items-center justify-between ${isMobile ? 'px-3' : 'px-6'} border-b`,
    isCompact ? 'text-sm' : ''
  ].join(' ');

  // Компонент логотипа и названия
  const BrandSection = () => (
    <div className={`flex items-center ${isVertical ? 'flex-col space-y-2 p-4' : (isMobile ? 'space-x-2' : 'space-x-3')}`}>
      <div className={`bg-primary rounded-lg flex items-center justify-center ${isCompact || isMobile ? 'w-6 h-6' : 'w-8 h-8'}`}>
        <i className={`fab fa-telegram-plane text-primary-foreground ${isCompact || isMobile ? 'text-sm' : 'text-lg'}`}></i>
      </div>
      <div className={isVertical ? 'text-center' : ''}>
        <h1 className={`font-semibold text-foreground ${isCompact || isMobile ? 'text-sm' : 'text-lg'}`}>
          {isVertical && !isCompact ? 'BotCraft' : 'BotCraft Studio'}
        </h1>
        <p className={`text-muted-foreground ${isCompact || isMobile ? 'text-xs' : 'text-xs'}`}>
          {(() => {
            const displayName = botInfo?.first_name || projectName;
            return isVertical ? (displayName.length > 12 ? displayName.substring(0, 12) + '...' : displayName) : displayName;
          })()}
        </p>
      </div>
    </div>
  );

  // Компонент навигации
  const Navigation = () => (
    <nav className={`${isVertical ? 'flex flex-col space-y-1 px-2' : 'hidden lg:flex flex-wrap items-center gap-1'}`}>
      {[
        { key: 'editor', label: 'Редактор' },
        { key: 'preview', label: 'Превью' },
        { key: 'export', label: 'Экспорт' },
        { key: 'bot', label: 'Бот' },
        { key: 'users', label: 'Пользователи' },
        { key: 'groups', label: 'Группы' }
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

  // Мобильная версия навигации
  const MobileNavigation = () => (
    <div className="flex flex-col space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {[
          { key: 'editor', label: 'Редактор' },
          { key: 'preview', label: 'Превью' },
          { key: 'export', label: 'Экспорт' },
          { key: 'bot', label: 'Бот' },
          { key: 'users', label: 'Пользователи' },
          { key: 'groups', label: 'Группы' }
        ].map((tab) => (
          <button 
            key={tab.key}
            onClick={() => {
              onTabChange(tab.key as any);
              setIsMobileMenuOpen(false);
            }}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              currentTab === tab.key 
                ? 'text-primary bg-primary/10' 
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );

  // Мобильная версия действий
  const MobileActions = () => (
    <div className="flex flex-col space-y-3">
      {/* Кнопки управления макетом */}
      {(onToggleHeader || onToggleSidebar || onToggleProperties || onToggleCanvas) && (
        <div className="grid grid-cols-2 gap-2">
          {onToggleHeader && (
            <Button
              variant={headerVisible ? "default" : "outline"}
              size="sm"
              onClick={() => {
                onToggleHeader();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center justify-center"
              title={`${headerVisible ? 'Скрыть' : 'Показать'} шапку`}
            >
              <NavigationIcon className="w-3 h-3 mr-1" />
              Шапка
            </Button>
          )}
          
          {onToggleSidebar && (
            <Button
              variant={sidebarVisible ? "default" : "outline"}
              size="sm"
              onClick={() => {
                onToggleSidebar();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center justify-center"
              title={`${sidebarVisible ? 'Скрыть' : 'Показать'} боковую панель`}
            >
              <Sidebar className="w-3 h-3 mr-1" />
              Панель
            </Button>
          )}
          
          {onToggleCanvas && (
            <Button
              variant={canvasVisible ? "default" : "outline"}
              size="sm"
              onClick={() => {
                onToggleCanvas();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center justify-center"
              title={`${canvasVisible ? 'Скрыть' : 'Показать'} холст`}
            >
              <Monitor className="w-3 h-3 mr-1" />
              Холст
            </Button>
          )}
          
          {onToggleProperties && (
            <Button
              variant={propertiesVisible ? "default" : "outline"}
              size="sm"
              onClick={() => {
                onToggleProperties();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center justify-center"
              title={`${propertiesVisible ? 'Скрыть' : 'Показать'} панель свойств`}
            >
              <Sliders className="w-3 h-3 mr-1" />
              Свойства
            </Button>
          )}
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-2">
        {onLoadTemplate && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              onLoadTemplate();
              setIsMobileMenuOpen(false);
            }}
            className="flex items-center justify-center"
          >
            <FolderOpen className="h-3 w-3 mr-2" />
            Загрузить шаблон
          </Button>
        )}
        
        {onSaveAsTemplate && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              onSaveAsTemplate();
              setIsMobileMenuOpen(false);
            }}
            className="flex items-center justify-center"
          >
            <Bookmark className="h-3 w-3 mr-2" />
            Сохранить как шаблон
          </Button>
        )}
        
        <Button 
          size="sm"
          onClick={() => {
            onExport();
            setIsMobileMenuOpen(false);
          }}
          className="flex items-center justify-center"
        >
          <i className="fas fa-download mr-2"></i>
          Экспорт
        </Button>
        
        <div className="flex justify-center pt-2">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );

  // Компонент действий
  const Actions = () => (
    <div className={`flex ${isVertical ? 'flex-col space-y-2 p-2' : 'hidden lg:flex flex-wrap items-center gap-2'}`}>
      
      {/* Кнопки управления макетом */}
      {(onToggleHeader || onToggleSidebar || onToggleProperties || onToggleCanvas) && (
        <div className="flex items-center space-x-1 bg-background/80 backdrop-blur-sm border border-border rounded-md p-1">
          {onToggleHeader && (
            <Button
              variant={headerVisible ? "default" : "outline"}
              size="sm"
              onClick={onToggleHeader}
              className="h-7 w-7 p-0"
              title={`${headerVisible ? 'Скрыть' : 'Показать'} шапку`}
            >
              <NavigationIcon className="w-3 h-3" />
            </Button>
          )}
          
          {onToggleSidebar && (
            <Button
              variant={sidebarVisible ? "default" : "outline"}
              size="sm"
              onClick={onToggleSidebar}
              className="h-7 w-7 p-0"
              title={`${sidebarVisible ? 'Скрыть' : 'Показать'} боковую панель`}
            >
              <Sidebar className="w-3 h-3" />
            </Button>
          )}
          
          {onToggleCanvas && (
            <Button
              variant={canvasVisible ? "default" : "outline"}
              size="sm"
              onClick={onToggleCanvas}
              className="h-7 w-7 p-0"
              title={`${canvasVisible ? 'Скрыть' : 'Показать'} холст`}
            >
              <Monitor className="w-3 h-3" />
            </Button>
          )}
          
          {onToggleProperties && (
            <Button
              variant={propertiesVisible ? "default" : "outline"}
              size="sm"
              onClick={onToggleProperties}
              className="h-7 w-7 p-0"
              title={`${propertiesVisible ? 'Скрыть' : 'Показать'} панель свойств`}
            >
              <Sliders className="w-3 h-3" />
            </Button>
          )}
        </div>
      )}
      
      {onLoadTemplate && (
        <Button 
          variant="outline" 
          size="sm"
          onClick={onLoadTemplate}
          className={`${isVertical ? 'w-full justify-center' : 'flex items-center justify-center'} px-1 py-0.5 text-xs max-sm:px-1 max-sm:py-0.5 max-sm:min-w-0 max-sm:w-full`}
        >
          <FolderOpen className="h-2.5 w-2.5 max-sm:mx-auto" />
          <span className="max-sm:hidden ml-1">Шаблон</span>
        </Button>
      )}
      
      {onSaveAsTemplate && (
        <Button 
          variant="outline" 
          size="sm"
          onClick={onSaveAsTemplate}
          className={`${isVertical ? 'w-full justify-center' : 'flex items-center justify-center'} px-1 py-0.5 text-xs max-sm:px-1 max-sm:py-0.5 max-sm:min-w-0 max-sm:w-full`}
        >
          <Bookmark className="h-2.5 w-2.5 max-sm:mx-auto" />
          <span className="max-sm:hidden ml-1">Создать</span>
        </Button>
      )}
      

      
      <Button 
        size="sm"
        onClick={onExport}
        className={`${isVertical ? 'w-full justify-center' : 'flex items-center justify-center'} px-1 py-0.5 text-xs max-sm:px-1 max-sm:py-0.5 max-sm:min-w-0 max-sm:w-full max-sm:col-span-2`}
      >
        <i className="fas fa-download text-2xs max-sm:mx-auto"></i>
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
      
      {/* Десктопные действия */}
      <Actions />
      
      {/* Мобильная кнопка меню */}
      <div className="lg:hidden">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="p-2">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <SheetHeader>
              <SheetTitle className="text-left">Меню</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Навигация</h3>
                <MobileNavigation />
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Действия</h3>
                <MobileActions />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}