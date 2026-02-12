import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { FolderOpen, Bookmark, Navigation as NavigationIcon, Sidebar, Monitor, Sliders, Menu, Code, Github, LogOut, MessageCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTelegramAuth } from '@/hooks/use-telegram-auth';
import { LayoutConfig } from './layout-manager';

/**
 * @interface BotInfo
 * @description Информация о боте
 * @property {string} first_name - Имя бота
 * @property {string} [username] - Имя пользователя бота
 * @property {string} [description] - Описание бота
 * @property {string} [short_description] - Краткое описание бота
 */

interface BotInfo {
  first_name: string;
  username?: string;
  description?: string;
  short_description?: string;
}

/**
 * @interface AdaptiveHeaderProps
 * @description Свойства адаптивного заголовка
 * @property {LayoutConfig} config - Конфигурация макета
 * @property {string} projectName - Название проекта
 * @property {BotInfo | null} [botInfo] - Информация о боте
 * @property {'editor' | 'preview' | 'export' | 'bot' | 'users' | 'groups'} currentTab - Текущая вкладка
 * @property {(tab: 'editor' | 'preview' | 'export' | 'bot' | 'users' | 'groups') => void} onTabChange - Функция изменения вкладки
 * @property {() => void} onExport - Функция экспорта
 * @property {() => void} [onSaveAsTemplate] - Функция сохранения как шаблон
 * @property {() => void} [onLoadTemplate] - Функция загрузки шаблона
 * @property {() => void} [onLayoutSettings] - Функция настройки макета
 * @property {() => void} [onToggleHeader] - Функция переключения видимости заголовка
 * @property {() => void} [onToggleSidebar] - Функция переключения видимости боковой панели
 * @property {() => void} [onToggleProperties] - Функция переключения видимости панели свойств
 * @property {() => void} [onToggleCanvas] - Функция переключения видимости холста
 * @property {() => void} [onToggleCode] - Функция переключения видимости панели кода
 * @property {boolean} [headerVisible] - Видимость заголовка
 * @property {boolean} [sidebarVisible] - Видимость боковой панели
 * @property {boolean} [propertiesVisible] - Видимость панели свойств
 * @property {boolean} [canvasVisible] - Видимость холста
 * @property {boolean} [codeVisible] - Видимость панели кода
 * @property {() => void} [onOpenMobileSidebar] - Функция открытия мобильной боковой панели
 * @property {() => void} [onOpenMobileProperties] - Функция открытия мобильной панели свойств
 */

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
  onOpenFileExplorer?: () => void;
  headerVisible?: boolean;
  sidebarVisible?: boolean;
  propertiesVisible?: boolean;
  canvasVisible?: boolean;
  codeVisible?: boolean;
  // Мобильные функции
  onOpenMobileSidebar?: () => void;
  onOpenMobileProperties?: () => void;
}

/**
 * @function AdaptiveHeader
 * @description Адаптивный компонент заголовка, который изменяет свое поведение в зависимости от конфигурации макета
 * Поддерживает различные позиции заголовка и режимы отображения
 * @param props - Свойства компонента
 * @returns Адаптивный компонент заголовка
 */
export function AdaptiveHeader({
  config,
  projectName,
  botInfo,
  currentTab,
  onTabChange,
  onSaveAsTemplate,
  onLoadTemplate,
  onToggleHeader,
  onToggleSidebar,
  onToggleProperties,
  onToggleCanvas,
  onToggleCode,
  onOpenFileExplorer,
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

  /**
   * @function handleTelegramLogin
   * @description Обработчик входа через Telegram
   * Открывает окно авторизации Telegram
   * @returns
   */
  // Функция для открытия окна авторизации Telegram
  const handleTelegramLogin = () => {
    const width = 500;
    const height = 600;
    const left = window.innerWidth / 2 - width / 2;
    const top = window.innerHeight / 2 - height / 2;

    window.open('/api/auth/login', 'telegram_login', `width=${width},height=${height},left=${left},top=${top}`);
  };

  // Определяем мобильное устройство
  const isMobile = useIsMobile();

  // Определяем ориентацию заголовка
  const isVertical = config.headerPosition === 'left' || config.headerPosition === 'right';
  const isCompact = config.compactMode;
  
  // Классы для контейнера с адаптивной высотой для мобильных устройств
  const containerClasses = [
    'bg-gradient-to-r from-background via-background/95 to-background/90 dark:from-slate-950 dark:via-slate-950/95 dark:to-slate-900/90 backdrop-blur-sm relative z-50',
    isVertical ? 'h-full w-full border-r flex flex-col' : `h-12 sm:h-14 md:h-16 lg:h-20 flex items-center justify-between md:flex-wrap md:justify-start md:gap-1.5 lg:gap-2 lg:flex-nowrap lg:justify-between px-2 sm:px-3 md:px-4 lg:px-6`,
    isCompact ? 'text-sm' : ''
  ].join(' ');

  // Компонент логотипа и названия
  const BrandSection = () => (
    <div className={`flex items-center ${isVertical ? 'flex-col space-y-2 p-4' : 'gap-2 sm:gap-2.5'} flex-shrink-0 min-w-0`}>
      <div className={`bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 w-8 h-8 sm:w-8 sm:h-8 md:w-9 md:h-9 flex-shrink-0`}>
        <i className={`fab fa-telegram-plane text-white text-sm sm:text-sm md:text-base`}></i>
      </div>
      <div className={`${isVertical ? 'text-center' : ''} min-w-0`}>
        <h1 className={`font-bold bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-400 dark:to-blue-300 bg-clip-text text-transparent leading-tight truncate ${
          isMobile ? 'text-sm' : 'text-sm md:text-base lg:text-lg'
        }`}>
          {isVertical && !isCompact ? 'BotCraft' : (isMobile ? 'BotCraft' : 'BotCraft Studio')}
        </h1>
        <div className={`flex items-center gap-1.5 ${isMobile ? 'hidden' : ''} ${isVertical ? 'justify-center' : ''}`}>
          <div className="px-2 py-0.5 bg-gradient-to-r from-blue-50/60 to-cyan-50/40 dark:from-blue-950/40 dark:to-cyan-950/30 rounded-md border border-blue-200/50 dark:border-blue-800/50 backdrop-blur-sm">
            <p className="text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-100 truncate max-w-xs">
              {(() => {
                const displayName = botInfo?.first_name || projectName;
                return isVertical ? (displayName.length > 12 ? displayName.substring(0, 12) + '...' : displayName) : displayName;
              })()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Компонент навигации
  const Navigation = () => (
    <nav className={`${isVertical ? 'flex flex-col space-y-1 px-2' : 'hidden md:flex flex-wrap items-center gap-0.5 lg:gap-1'}`}>
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
          className={`px-2 md:px-2.5 lg:px-3 py-1 text-xs md:text-sm font-semibold rounded-lg transition-all duration-200 whitespace-nowrap ${
            currentTab === tab.key 
              ? 'text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-md shadow-blue-500/20' 
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60 dark:hover:bg-slate-800/50'
          } ${isVertical ? 'w-full text-left' : ''}`}
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
    <div className="flex flex-col gap-3 sm:gap-4">
      {/* Приглашение в Telegram-чат */}
      <div className="px-3 py-2.5 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 dark:from-blue-700/20 dark:to-cyan-600/20 rounded-lg border border-blue-400/20 dark:border-blue-500/30 backdrop-blur-sm text-center">
        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
          Присоединяйтесь к нашему чату в Telegram:
        </p>
        <a
          href="https://t.me/bot_builder_chat"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-300 hover:underline font-semibold text-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          @bot_builder_chat
        </a>
      </div>

      {/* Кнопки управления макетом */}
      {(onToggleHeader || onToggleSidebar || onToggleProperties || onToggleCanvas || onToggleCode) && (
        <div className="flex flex-col gap-2 sm:grid sm:grid-cols-3 sm:gap-2.5">
          {onToggleHeader && (
            <Button
              size="sm"
              onClick={() => {
                onToggleHeader();
                setIsMobileMenuOpen(false);
              }}
              className={`flex items-center justify-center sm:justify-center gap-2 sm:gap-0 py-2 px-3 sm:py-2.5 sm:px-2 rounded-lg transition-all font-medium text-sm sm:text-xs ${
                headerVisible
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title={`${headerVisible ? 'Скрыть' : 'Показать'} шапку`}
              data-testid="button-mobile-toggle-header"
            >
              <NavigationIcon className="sm:w-4 sm:h-4 w-0 sm:flex-shrink-0" />
              <span className="sm:hidden">{headerVisible ? 'Скрыть' : 'Показать'} шапку</span>
            </Button>
          )}

          {onToggleSidebar && (
            <Button
              size="sm"
              onClick={() => {
                onToggleSidebar();
                setIsMobileMenuOpen(false);
              }}
              className={`flex items-center justify-center sm:justify-center gap-2 sm:gap-0 py-2 px-3 sm:py-2.5 sm:px-2 rounded-lg transition-all font-medium text-sm sm:text-xs ${
                sidebarVisible
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30 hover:shadow-lg hover:shadow-purple-500/40'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title={`${sidebarVisible ? 'Скрыть' : 'Показать'} боковую панель`}
              data-testid="button-mobile-toggle-sidebar"
            >
              <Sidebar className="sm:w-4 sm:h-4 w-0 sm:flex-shrink-0" />
              <span className="sm:hidden">{sidebarVisible ? 'Скрыть' : 'Показать'} панель</span>
            </Button>
          )}

          {onToggleCanvas && (
            <Button
              size="sm"
              onClick={() => {
                onToggleCanvas();
                setIsMobileMenuOpen(false);
              }}
              className={`flex items-center justify-center sm:justify-center gap-2 sm:gap-0 py-2 px-3 sm:py-2.5 sm:px-2 rounded-lg transition-all font-medium text-sm sm:text-xs ${
                canvasVisible
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/40'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title={`${canvasVisible ? 'Скрыть' : 'Показать'} холст`}
              data-testid="button-mobile-toggle-canvas"
            >
              <Monitor className="sm:w-4 sm:h-4 w-0 sm:flex-shrink-0" />
              <span className="sm:hidden">{canvasVisible ? 'Скрыть' : 'Показать'} холст</span>
            </Button>
          )}

          {onToggleProperties && (
            <Button
              size="sm"
              onClick={() => {
                onToggleProperties();
                setIsMobileMenuOpen(false);
              }}
              className={`flex items-center justify-center sm:justify-center gap-2 sm:gap-0 py-2 px-3 sm:py-2.5 sm:px-2 rounded-lg transition-all font-medium text-sm sm:text-xs ${
                propertiesVisible
                  ? 'bg-pink-600 text-white shadow-md shadow-pink-500/30 hover:shadow-lg hover:shadow-pink-500/40'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title={`${propertiesVisible ? 'Скрыть' : 'Показать'} панель свойств`}
              data-testid="button-mobile-toggle-properties"
            >
              <Sliders className="sm:w-4 sm:h-4 w-0 sm:flex-shrink-0" />
              <span className="sm:hidden">{propertiesVisible ? 'Скрыть' : 'Показать'} свойства</span>
            </Button>
          )}

          {onToggleCode && (
            <Button
              size="sm"
              onClick={() => {
                onToggleCode();
                setIsMobileMenuOpen(false);
              }}
              className={`flex items-center justify-center sm:justify-center gap-2 sm:gap-0 py-2 px-3 sm:py-2.5 sm:px-2 rounded-lg transition-all font-medium text-sm sm:text-xs ${
                codeVisible
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-500/30 hover:shadow-lg hover:shadow-orange-500/40'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title={`${codeVisible ? 'Скрыть' : 'Показать'} панель кода`}
              data-testid="button-mobile-toggle-code"
            >
              <Code className="sm:w-4 sm:h-4 w-0 sm:flex-shrink-0" />
              <span className="sm:hidden">{codeVisible ? 'Скрыть' : 'Показать'} код</span>
            </Button>
          )}
          
          {onOpenFileExplorer && (
            <Button
              size="sm"
              onClick={() => {
                onOpenFileExplorer();
                setIsMobileMenuOpen(false);
              }}
              className={`flex items-center justify-center sm:justify-center gap-2 sm:gap-0 py-2 px-3 sm:py-2.5 sm:px-2 rounded-lg transition-all font-medium text-sm sm:text-xs ${
                'bg-blue-600 text-white shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40'
              }`}
              title="Открыть проводник файлов"
              data-testid="button-mobile-open-file-explorer"
            >
              <i className="fas fa-folder sm:w-4 sm:h-4 w-0 sm:flex-shrink-0"></i>
              <span className="sm:hidden">Файлы</span>
            </Button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
        {onLoadTemplate && (
          <Button
            size="sm"
            onClick={() => {
              onLoadTemplate();
              setIsMobileMenuOpen(false);
            }}
            className="flex items-center justify-center gap-2 px-3 py-2 sm:py-2.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800/50 rounded-lg font-medium text-xs sm:text-sm transition-all"
            data-testid="button-mobile-load-template"
          >
            <FolderOpen className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
            <span>Шаблоны</span>
          </Button>
        )}

        {onSaveAsTemplate && (
          <Button
            size="sm"
            onClick={() => {
              onSaveAsTemplate();
              setIsMobileMenuOpen(false);
            }}
            className="flex items-center justify-center gap-2 px-3 py-2 sm:py-2.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800/50 rounded-lg font-medium text-xs sm:text-sm transition-all"
            data-testid="button-mobile-save-template"
          >
            <Bookmark className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
            <span>Сохранить</span>
          </Button>
        )}



        <Button
          size="sm"
          asChild
          className={`flex items-center justify-center gap-2 px-3 py-2 sm:py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg font-medium text-xs sm:text-sm transition-all ${onSaveAsTemplate ? '' : 'sm:col-span-2'}`}
          data-testid="button-mobile-github"
        >
          <a
            href="https://github.com/fedorabakumets/telegram-bot-builder"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center justify-center gap-2 w-full"
          >
            <Github className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
            <span>GitHub</span>
          </a>
        </Button>

        <div className="flex justify-center sm:col-span-2 pt-2">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );

  // Компонент действий
  const Actions = () => (
    <div className={`flex ${isVertical ? 'flex-col space-y-2 p-2' : 'hidden lg:flex flex-wrap items-center gap-1 lg:w-auto lg:order-none lg:ml-auto'}`}>
      
      {/* Кнопки управления макетом */}
      {onToggleHeader && (
        <Button
          variant={headerVisible ? "default" : "outline"}
          size="sm"
          onClick={onToggleHeader}
          className={`h-8 w-8 p-0 transition-all duration-200 rounded-lg border-0 ${headerVisible ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40' : 'bg-slate-500/5 dark:bg-slate-700/15 hover:bg-slate-300/40 dark:hover:bg-slate-600/50 text-slate-600 dark:text-slate-400'}`}
          title={`${headerVisible ? 'Скрыть' : 'Показать'} шапку`}
          data-testid="button-toggle-header"
        >
          <NavigationIcon className="w-3.5 h-3.5" />
        </Button>
      )}
      
      {onToggleSidebar && (
        <Button
          variant={sidebarVisible ? "default" : "outline"}
          size="sm"
          onClick={onToggleSidebar}
          className={`h-8 w-8 p-0 transition-all duration-200 rounded-lg border-0 ${sidebarVisible ? 'bg-gradient-to-br from-purple-600 to-purple-500 text-white shadow-md shadow-purple-500/30 hover:shadow-lg hover:shadow-purple-500/40' : 'bg-slate-500/5 dark:bg-slate-700/15 hover:bg-slate-300/40 dark:hover:bg-slate-600/50 text-slate-600 dark:text-slate-400'}`}
          title={`${sidebarVisible ? 'Скрыть' : 'Показать'} боковую панель`}
          data-testid="button-toggle-sidebar"
        >
          <Sidebar className="w-3.5 h-3.5" />
        </Button>
      )}
      
      {onToggleCanvas && (
        <Button
          variant={canvasVisible ? "default" : "outline"}
          size="sm"
          onClick={onToggleCanvas}
          className={`h-8 w-8 p-0 transition-all duration-200 rounded-lg border-0 ${canvasVisible ? 'bg-gradient-to-br from-cyan-600 to-cyan-500 text-white shadow-md shadow-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/40' : 'bg-slate-500/5 dark:bg-slate-700/15 hover:bg-slate-300/40 dark:hover:bg-slate-600/50 text-slate-600 dark:text-slate-400'}`}
          title={`${canvasVisible ? 'Скрыть' : 'Показать'} холст`}
          data-testid="button-toggle-canvas"
        >
          <Monitor className="w-3.5 h-3.5" />
        </Button>
      )}
      
      {onToggleProperties && (
        <Button
          variant={propertiesVisible ? "default" : "outline"}
          size="sm"
          onClick={onToggleProperties}
          className={`h-8 w-8 p-0 transition-all duration-200 rounded-lg border-0 ${propertiesVisible ? 'bg-gradient-to-br from-pink-600 to-pink-500 text-white shadow-md shadow-pink-500/30 hover:shadow-lg hover:shadow-pink-500/40' : 'bg-slate-500/5 dark:bg-slate-700/15 hover:bg-slate-300/40 dark:hover:bg-slate-600/50 text-slate-600 dark:text-slate-400'}`}
          title={`${propertiesVisible ? 'Скрыть' : 'Показать'} панель свойств`}
          data-testid="button-toggle-properties"
        >
          <Sliders className="w-3.5 h-3.5" />
        </Button>
      )}
      
      {onToggleCode && (
        <Button
          variant={codeVisible ? "default" : "outline"}
          size="sm"
          onClick={onToggleCode}
          className={`h-8 w-8 p-0 transition-all duration-200 rounded-lg border-0 ${codeVisible ? 'bg-gradient-to-br from-orange-600 to-orange-500 text-white shadow-md shadow-orange-500/30 hover:shadow-lg hover:shadow-orange-500/40' : 'bg-slate-500/5 dark:bg-slate-700/15 hover:bg-slate-300/40 dark:hover:bg-slate-600/50 text-slate-600 dark:text-slate-400'}`}
          title={`${codeVisible ? 'Скрыть' : 'Показать'} панель кода`}
          data-testid="button-toggle-code"
        >
          <Code className="w-3.5 h-3.5" />
        </Button>
      )}

      {onOpenFileExplorer && (
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenFileExplorer}
          className={`h-8 w-8 p-0 transition-all duration-200 rounded-lg border-0 ${'bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40'}`}
          title="Открыть проводник файлов"
          data-testid="button-open-file-explorer"
        >
          <i className="fas fa-folder w-3.5 h-3.5" />
        </Button>
      )}
      
      {onLoadTemplate && (
        <Button 
          variant="outline" 
          size="sm"
          onClick={onLoadTemplate}
          className={`${isVertical ? 'w-full justify-center' : 'flex items-center justify-center'} px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-indigo-500/10 to-indigo-400/5 hover:from-indigo-600/20 hover:to-indigo-500/15 border border-indigo-400/30 dark:border-indigo-500/30 hover:border-indigo-500/50 dark:hover:border-indigo-400/50 text-indigo-700 dark:text-indigo-300 rounded-lg transition-all shadow-sm hover:shadow-md hover:shadow-indigo-500/20 max-sm:px-2 max-sm:py-1 max-sm:min-w-0 max-sm:w-full`}
        >
          <FolderOpen className="h-3.5 w-3.5 max-sm:mx-auto" />
          <span className="max-sm:hidden ml-1">Шаблоны</span>
        </Button>
      )}
      
      {onSaveAsTemplate && (
        <Button 
          variant="outline" 
          size="sm"
          onClick={onSaveAsTemplate}
          className={`${isVertical ? 'w-full justify-center' : 'flex items-center justify-center'} px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-amber-500/10 to-amber-400/5 hover:from-amber-600/20 hover:to-amber-500/15 border border-amber-400/30 dark:border-amber-500/30 hover:border-amber-500/50 dark:hover:border-amber-400/50 text-amber-700 dark:text-amber-300 rounded-lg transition-all shadow-sm hover:shadow-md hover:shadow-amber-500/20 max-sm:px-2 max-sm:py-1 max-sm:min-w-0 max-sm:w-full`}
        >
          <Bookmark className="h-3.5 w-3.5 max-sm:mx-auto" />
          <span className="max-sm:hidden ml-1">Сохранить</span>
        </Button>
      )}
      

      
  
      
      {isVertical && (
        <div className="h-px w-full bg-border my-2"></div>
      )}
      
      {/* Информация о пользователе и выход */}
      {user ? (
        <>
          <div className={`flex items-center space-x-2.5 bg-gradient-to-r from-blue-500/15 to-cyan-500/10 dark:from-blue-700/25 dark:to-cyan-600/20 px-3 py-1.5 rounded-lg backdrop-blur-md border border-blue-400/20 dark:border-blue-500/30 shadow-md shadow-blue-500/10 ${isVertical ? 'w-full' : ''}`}>
            {user.photoUrl && (
              <img 
                src={user.photoUrl} 
                alt={user.firstName}
                className="w-7 h-7 rounded-full ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/20"
              />
            )}
            {!isVertical && (
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-foreground">{user.firstName}</p>
                {user.username && (
                  <p className="text-xs text-blue-600 dark:text-blue-300">@{user.username}</p>
                )}
              </div>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className={`${isVertical ? 'w-full justify-center' : 'flex items-center justify-center'} px-2.5 py-1.5 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-500/10 dark:hover:bg-red-500/20 rounded-lg transition-all font-semibold`}
            title="Выход"
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </>
      ) : (
        <Button
          onClick={handleTelegramLogin}
          size="sm"
          className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200"
          title="Войти через Telegram"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          <span>Вход</span>
        </Button>
      )}

      <div className={`${isVertical ? 'w-full px-3 py-1.5' : 'hidden md:flex items-center px-3 py-1.5'} text-xs font-medium bg-gradient-to-r from-blue-500/10 to-cyan-500/10 dark:from-blue-700/20 dark:to-cyan-600/20 rounded-lg border border-blue-400/20 dark:border-blue-500/30 backdrop-blur-sm`}>
        <span className="hidden sm:inline-block text-slate-700 dark:text-slate-300">
          Присоединяйтесь к нашему чату в Telegram:
        </span>
        <a
          href="https://t.me/bot_builder_chat"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-1 text-blue-600 dark:text-blue-300 hover:underline font-semibold"
        >
          @bot_builder_chat
        </a>
      </div>

      <Button
        variant="outline"
        size="sm"
        asChild
        className={`${isVertical ? 'w-full justify-center' : 'flex items-center justify-center'} px-2 py-1 text-xs hover:bg-slate-200/50 dark:hover:bg-slate-700/50 hover:border-slate-400/50 dark:hover:border-slate-500/50 rounded-lg transition-all`}
        title="Открыть проект на GitHub"
      >
        <a
          href="https://github.com/fedorabakumets/telegram-bot-builder"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Github className="h-3.5 w-3.5" />
        </a>
      </Button>

      <div className="max-sm:col-span-1 max-sm:flex max-sm:justify-center">
        <ThemeToggle />
      </div>
    </div>
  );

  // Разделитель
  const Separator = () => (
    <div className={`${isVertical ? 'h-px w-full' : 'h-4 sm:h-5 md:h-6 w-px'} bg-border/50 hidden sm:block`}></div>
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
    <>
      <header className={containerClasses}>
      <div className="flex items-center gap-1 sm:gap-2 md:gap-1.5 md:order-first flex-shrink-0">
        <BrandSection />
        <Separator />
        {/* Мобильные кнопки компонентов и свойств после разделителя */}
        {isMobile && !isVertical && (
          <div className="flex items-center gap-2 sm:gap-2">
            {onOpenMobileSidebar && (
              <button
                onClick={onOpenMobileSidebar}
                className="group p-2 sm:p-2 bg-blue-500/10 dark:bg-blue-400/15 rounded-lg border border-blue-300/30 dark:border-blue-500/20 hover:bg-blue-500/20 dark:hover:bg-blue-400/25 hover:border-blue-400/50 dark:hover:border-blue-400/30 transition-all duration-200 hover:shadow-md hover:shadow-blue-500/25"
                title="Открыть панель компонентов"
                data-testid="button-mobile-components"
              >
                <Menu className="w-4 h-4 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-200" />
              </button>
            )}
            {onOpenMobileProperties && (
              <button
                onClick={onOpenMobileProperties}
                className="group p-2 sm:p-2 bg-purple-500/10 dark:bg-purple-400/15 rounded-lg border border-purple-300/30 dark:border-purple-500/20 hover:bg-purple-500/20 dark:hover:bg-purple-400/25 hover:border-purple-400/50 dark:hover:border-purple-400/30 transition-all duration-200 hover:shadow-md hover:shadow-purple-500/25"
                title="Открыть панель свойств"
                data-testid="button-mobile-properties"
              >
                <Sliders className="w-4 h-4 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors duration-200" />
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
            <Button variant="outline" size="sm" className="p-1.5 sm:p-2 h-8 sm:h-9">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:w-96 md:w-[420px] p-0 overflow-y-auto">
            <div className="bg-gradient-to-b from-background via-background/95 to-background/90 dark:from-slate-950 dark:via-slate-950/95 dark:to-slate-900/90 min-h-full flex flex-col">
              {/* Заголовок меню */}
              <SheetHeader className="px-4 sm:px-6 py-4 border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 rounded-lg flex items-center justify-center">
                    <i className="fab fa-telegram-plane text-white text-sm"></i>
                  </div>
                  <SheetTitle className="text-left text-lg font-bold">Меню</SheetTitle>
                </div>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto">
                <div className="px-4 sm:px-6 py-4 space-y-4 sm:space-y-6">
                  {/* Навигация */}
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Навигация</h3>
                    <MobileNavigation />
                  </div>

                  {/* Действия */}
                  <div className="border-t border-border/50 pt-4">
                    <h3 className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Действия</h3>
                    <MobileActions />
                  </div>

                  {/* Аккаунт */}
                  <div className="border-t border-border/50 pt-4">
                    <h3 className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Аккаунт</h3>
                    <div className="flex flex-col gap-3">
                      {user ? (
                        <>
                          <div className="px-4 py-3 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 dark:from-blue-700/20 dark:to-cyan-600/15 rounded-lg border border-blue-400/20 dark:border-blue-500/20">
                            {user.photoUrl && (
                              <img 
                                src={user.photoUrl} 
                                alt={user.firstName}
                                className="w-10 h-10 rounded-full ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/20 mb-2"
                              />
                            )}
                            <p className="text-sm font-bold text-foreground">{user.firstName}</p>
                            {user.username && (
                              <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">@{user.username}</p>
                            )}
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              logout();
                              setIsMobileMenuOpen(false);
                            }}
                            className="w-full font-medium"
                          >
                            <LogOut className="w-4 h-4 mr-2" />
                            Выход из аккаунта
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={handleTelegramLogin}
                          size="sm"
                          className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
                          title="Войти через Telegram"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Вход в Telegram
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

    </header>
    </>
  );
}