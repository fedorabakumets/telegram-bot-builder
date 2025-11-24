import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { FolderOpen, Bookmark, Download, User, Send, Layout, Navigation as NavigationIcon, Sidebar, Monitor, Sliders, Users, Menu, X, Code, Github, LogOut } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTelegramAuth } from '@/hooks/use-telegram-auth';
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
  onToggleCode?: () => void;
  headerVisible?: boolean;
  sidebarVisible?: boolean;
  propertiesVisible?: boolean;
  canvasVisible?: boolean;
  codeVisible?: boolean;
  // Мобильные функции
  onOpenMobileSidebar?: () => void;
  onOpenMobileProperties?: () => void;
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
  onToggleCode,
  headerVisible,
  sidebarVisible,
  propertiesVisible,
  canvasVisible,
  codeVisible,
  onOpenMobileSidebar,
  onOpenMobileProperties
}: AdaptiveHeaderProps) {
  
  // Состояние для мобильного меню
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Проверка авторизации пользователя
  const { user, logout } = useTelegramAuth();
  
  // Определяем мобильное устройство
  const isMobile = useIsMobile();
  
  // Определяем ориентацию заголовка
  const isVertical = config.headerPosition === 'left' || config.headerPosition === 'right';
  const isCompact = config.compactMode;
  
  // Классы для контейнера с адаптивной высотой для мобильных устройств
  const containerClasses = [
    'bg-background border-border relative z-50',
    isVertical ? 'h-full w-full border-r flex flex-col' : `${isMobile ? 'h-10' : 'h-12'} flex items-center justify-between md:min-h-20 md:flex-wrap md:justify-start md:gap-2 lg:h-12 lg:flex-nowrap lg:justify-between ${isMobile ? 'px-3' : 'px-6'} border-b`,
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
    <nav className={`${isVertical ? 'flex flex-col space-y-1 px-2' : 'hidden md:flex flex-wrap items-center gap-1'}`}>
      {[
        { key: 'editor', label: 'Редактор' },
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
      {(onToggleHeader || onToggleSidebar || onToggleProperties || onToggleCanvas || onToggleCode) && (
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
              data-testid="button-mobile-toggle-header"
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
              data-testid="button-mobile-toggle-sidebar"
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
              data-testid="button-mobile-toggle-canvas"
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
              data-testid="button-mobile-toggle-properties"
            >
              <Sliders className="w-3 h-3 mr-1" />
              Свойства
            </Button>
          )}
          
          {onToggleCode && (
            <Button
              variant={codeVisible ? "default" : "outline"}
              size="sm"
              onClick={() => {
                onToggleCode();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center justify-center"
              title={`${codeVisible ? 'Скрыть' : 'Показать'} панель кода`}
              data-testid="button-mobile-toggle-code"
            >
              <Code className="w-3 h-3 mr-1" />
              Код
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
            Сохранить
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
        
        <Button 
          variant="outline"
          size="sm"
          asChild
          className="flex items-center justify-center"
        >
          <a
            href="https://github.com/fedorabakumets/telegram-bot-builder"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Github className="h-3.5 w-3.5 mr-2" />
            GitHub
          </a>
        </Button>
        
        <div className="flex justify-center pt-2">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );

  // Компонент действий
  const Actions = () => (
    <div className={`flex ${isVertical ? 'flex-col space-y-2 p-2' : 'hidden lg:flex flex-wrap items-center gap-2 lg:w-auto lg:order-none lg:ml-auto'}`}>
      
      {/* Кнопки управления макетом */}
      {(onToggleHeader || onToggleSidebar || onToggleProperties || onToggleCanvas || onToggleCode) && (
        <div className="flex items-center space-x-1 bg-background/80 backdrop-blur-sm border border-border rounded-md p-1">
          {onToggleHeader && (
            <Button
              variant={headerVisible ? "default" : "outline"}
              size="sm"
              onClick={onToggleHeader}
              className="h-7 w-7 p-0"
              title={`${headerVisible ? 'Скрыть' : 'Показать'} шапку`}
              data-testid="button-toggle-header"
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
              data-testid="button-toggle-sidebar"
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
              data-testid="button-toggle-canvas"
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
              data-testid="button-toggle-properties"
            >
              <Sliders className="w-3 h-3" />
            </Button>
          )}
          
          {onToggleCode && (
            <Button
              variant={codeVisible ? "default" : "outline"}
              size="sm"
              onClick={onToggleCode}
              className="h-7 w-7 p-0"
              title={`${codeVisible ? 'Скрыть' : 'Показать'} панель кода`}
              data-testid="button-toggle-code"
            >
              <Code className="w-3 h-3" />
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
          <span className="max-sm:hidden ml-1">Шаблоны</span>
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
          <span className="max-sm:hidden ml-1">Сохранить</span>
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
      
      {/* Информация о пользователе и выход */}
      {user && (
        <>
          <div className={`flex items-center space-x-2 ${isVertical ? 'w-full px-2 py-2' : 'px-2'}`}>
            {user.photoUrl && (
              <img 
                src={user.photoUrl} 
                alt={user.firstName}
                className="w-6 h-6 rounded-full"
              />
            )}
            {!isVertical && (
              <div className="text-right hidden sm:block">
                <p className="text-xs font-medium text-foreground">{user.firstName}</p>
                {user.username && (
                  <p className="text-xs text-muted-foreground">@{user.username}</p>
                )}
              </div>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className={`${isVertical ? 'w-full justify-center' : 'flex items-center justify-center'} px-1 py-0.5 text-xs text-destructive hover:text-destructive`}
            title="Выход"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="max-sm:hidden ml-1">Выход</span>
          </Button>
        </>
      )}
      
      <Button 
        variant="outline" 
        size="sm"
        asChild
        className={`${isVertical ? 'w-full justify-center' : 'flex items-center justify-center'} px-1 py-0.5 text-xs`}
        title="Открыть проект на GitHub"
      >
        <a
          href="https://github.com/fedorabakumets/telegram-bot-builder"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Github className="h-3.5 w-3.5" />
          <span className="max-sm:hidden ml-1">GitHub</span>
        </a>
      </Button>
      
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
      <div className="flex items-center space-x-4 md:order-first">
        <BrandSection />
        <Separator />
        {/* Мобильные кнопки компонентов и свойств после разделителя */}
        {isMobile && !isVertical && (
          <div className="flex items-center space-x-1">
            {onOpenMobileSidebar && (
              <button
                onClick={onOpenMobileSidebar}
                className="group p-1.5 bg-blue-500/10 dark:bg-blue-400/15 rounded-md border border-blue-300/30 dark:border-blue-500/20 hover:bg-blue-500/20 dark:hover:bg-blue-400/25 hover:border-blue-400/50 dark:hover:border-blue-400/30 transition-all duration-200 hover:shadow-sm hover:shadow-blue-500/20"
                title="Открыть панель компонентов"
                data-testid="button-mobile-components"
              >
                <Menu className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-200" />
              </button>
            )}
            {onOpenMobileProperties && (
              <button
                onClick={onOpenMobileProperties}
                className="group p-1.5 bg-purple-500/10 dark:bg-purple-400/15 rounded-md border border-purple-300/30 dark:border-purple-500/20 hover:bg-purple-500/20 dark:hover:bg-purple-400/25 hover:border-purple-400/50 dark:hover:border-purple-400/30 transition-all duration-200 hover:shadow-sm hover:shadow-purple-500/20"
                title="Открыть панель свойств"
                data-testid="button-mobile-properties"
              >
                <Sliders className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors duration-200" />
              </button>
            )}
          </div>
        )}
      </div>
      
      <Navigation />
      
      {/* Десктопные/Планшетные действия */}
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