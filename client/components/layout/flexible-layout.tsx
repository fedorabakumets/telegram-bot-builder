import React from 'react';
import { SimpleLayoutConfig } from './simple-layout-customizer';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Navigation, Sidebar, Sliders, Monitor } from 'lucide-react';
import { useMediaQuery } from '@/hooks/use-media-query';

/**
 * @interface FlexibleLayoutProps
 * @description Свойства гибкого компонента макета
 * @property {SimpleLayoutConfig} config - Конфигурация макета
 * @property {React.ReactNode} headerContent - Контент заголовка
 * @property {React.ReactNode} sidebarContent - Контент боковой панели
 * @property {React.ReactNode} canvasContent - Контент холста
 * @property {React.ReactNode} propertiesContent - Контент панели свойств
 * @property {React.ReactNode} [codeContent] - Контент панели кода
 * @property {React.ReactNode} [codeEditorContent] - Контент редактора кода
 * @property {React.ReactNode} [dialogContent] - Контент диалогового окна
 * @property {React.ReactNode} [userDetailsContent] - Контент информации о пользователе
 * @property {React.ReactNode} [fileExplorerContent] - Контент панели проводника файлов
 * @property {(newConfig: SimpleLayoutConfig) => void} [onConfigChange] - Функция обратного вызова при изменении конфигурации
 * @property {boolean} [hideOnMobile] - Скрывать боковые панели на маленьких устройствах
 * @property {string} [currentTab] - Текущая активная вкладка
 */
interface FlexibleLayoutProps {
  config: SimpleLayoutConfig;
  headerContent: React.ReactNode;
  sidebarContent: React.ReactNode;
  canvasContent: React.ReactNode;
  propertiesContent: React.ReactNode;
  codeContent?: React.ReactNode;
  codeEditorContent?: React.ReactNode;
  dialogContent?: React.ReactNode;
  userDetailsContent?: React.ReactNode;
  fileExplorerContent?: React.ReactNode;
  onConfigChange?: (newConfig: SimpleLayoutConfig) => void;
  hideOnMobile?: boolean; // Скрывать боковые панели на маленьких устройствах
  currentTab?: string; // Текущая активная вкладка
}

/**
 * @function FlexibleLayout
 * @description Гибкий компонент макета интерфейса
 * Позволяет настраивать расположение элементов интерфейса в зависимости от конфигурации
 * @param {FlexibleLayoutProps} props - Свойства компонента
 * @returns {JSX.Element} Гибкий компонент макета
 */
export const FlexibleLayout: React.FC<FlexibleLayoutProps> = ({
  config,
  headerContent,
  sidebarContent,
  canvasContent,
  propertiesContent,
  codeContent,
  codeEditorContent,
  dialogContent,
  userDetailsContent,
  fileExplorerContent,
  onConfigChange,
  hideOnMobile = false}) => {
  // Определяем мобильное устройство (экраны меньше 1200px для тестирования)
  const isMobile = useMediaQuery('(max-width: 1200px)');


  /**
   * @function getElementContent
   * @description Возвращает контент элемента по его типу
   * @param {string} type - Тип элемента ('header', 'sidebar', 'canvas', 'properties', 'code', 'codeEditor', 'dialog', 'userDetails', 'fileExplorer')
   * @returns {React.ReactNode | null} Контент элемента или null
   */
  const getElementContent = (type: string) => {
    switch (type) {
      case 'header':
        return headerContent;
      case 'sidebar':
        return sidebarContent;
      case 'canvas':
        return canvasContent;
      case 'properties':
        return propertiesContent;
      case 'code':
        return codeContent;
      case 'codeEditor':
        return codeEditorContent;
      case 'dialog':
        return dialogContent;
      case 'userDetails':
        return userDetailsContent;
      case 'fileExplorer':
        return fileExplorerContent;
      default:
        return null;
    }
  };


  /**
   * @function createSimpleLayout
   * @description Создает упрощенный CSS Grid layout на основе конфигурации
   * @returns {JSX.Element} Сгенерированный макет
   */
  // Создаем упрощенный CSS Grid layout
  const createSimpleLayout = () => {
    const visibleElements = config.elements.filter(el => {
      if (!el.visible) return false;
      
      // Скрываем боковые панели на мобильных устройствах, если включен режим hideOnMobile
      if (hideOnMobile && isMobile && (el.type === 'sidebar' || el.type === 'properties')) {
        return false;
      }
      
      return true;
    });
    
    if (visibleElements.length === 0) {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground bg-background relative">
          <div className="text-center mb-8">
            <h3 className="text-lg font-medium mb-2">
              {hideOnMobile && isMobile ? 'Мобильный режим' : 'Все панели скрыты'}
            </h3>
            <p className="text-sm">
              {hideOnMobile && isMobile 
                ? 'На мобильных устройствах боковые панели скрыты для экономии места' 
                : 'Используйте кнопки ниже для показа панелей'
              }
            </p>
          </div>
          
          {/* Кнопки управления макетом */}
          <div className="flex items-center space-x-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-lg shadow-lg border border-gray-200/50 dark:border-slate-700/50 p-3">
            <button
              onClick={() => {
                if (onConfigChange) {
                  const newConfig = { ...config };
                  const headerElement = newConfig.elements.find(el => el.id === 'header');
                  if (headerElement) {
                    headerElement.visible = true;
                    onConfigChange(newConfig);
                  }
                }
              }}
              className="p-3 rounded-md transition-all duration-200 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400"
              title="Показать шапку"
            >
              <Navigation className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => {
                if (onConfigChange) {
                  const newConfig = { ...config };
                  const sidebarElement = newConfig.elements.find(el => el.id === 'sidebar');
                  if (sidebarElement) {
                    sidebarElement.visible = true;
                    onConfigChange(newConfig);
                  }
                }
              }}
              className="p-3 rounded-md transition-all duration-200 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400"
              title="Показать боковую панель"
            >
              <Sidebar className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => {
                if (onConfigChange) {
                  const newConfig = { ...config };
                  const canvasElement = newConfig.elements.find(el => el.id === 'canvas');
                  if (canvasElement) {
                    canvasElement.visible = true;
                    onConfigChange(newConfig);
                  }
                }
              }}
              className="p-3 rounded-md transition-all duration-200 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400"
              title="Показать холст"
            >
              <Monitor className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => {
                if (onConfigChange) {
                  const newConfig = { ...config };
                  const propertiesElement = newConfig.elements.find(el => el.id === 'properties');
                  if (propertiesElement) {
                    propertiesElement.visible = true;
                    onConfigChange(newConfig);
                  }
                }
              }}
              className="p-3 rounded-md transition-all duration-200 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400"
              title="Показать панель свойств"
            >
              <Sliders className="w-5 h-5" />
            </button>
          </div>
        </div>
      );
    }

    // Если есть только один элемент
    if (visibleElements.length === 1) {
      const singleElement = visibleElements[0];
      return (
        <div className="h-full w-full overflow-hidden bg-background">
          <div className="h-full w-full">
            {getElementContent(singleElement.type)}
          </div>
        </div>
      );
    }

    // Определяем элементы по позициям
    const topEl = visibleElements.find(el => el.position === 'top');
    const bottomEl = visibleElements.find(el => el.position === 'bottom');
    const leftEl = visibleElements.find(el => el.position === 'left');
    const rightElements = visibleElements.filter(el => el.position === 'right');
    const centerEl = visibleElements.find(el => el.position === 'center');

    // Простая структура: top / middle / bottom
    const rows = [];
    const areas = [];
    
    // Верхняя строка
    if (topEl) {
      rows.push(`${topEl.size}px`);
      areas.push('"header header header"');
    }
    
    // Средняя строка
    rows.push('1fr');
    let middleArea = '"';
    if (leftEl) middleArea += 'sidebar ';
    else middleArea += '. ';
    
    if (centerEl) middleArea += 'main ';
    else middleArea += '. ';
    
    if (rightElements.length > 0) middleArea += 'properties';
    else middleArea += '.';
    
    middleArea += '"';
    areas.push(middleArea);
    
    // Нижняя строка  
    if (bottomEl) {
      rows.push(`${bottomEl.size}px`);
      areas.push('"footer footer footer"');
    }

    // Колонки
    const columns = [];
    if (leftEl) columns.push(`${leftEl.size}%`);
    else columns.push('0px');
    
    columns.push('1fr');
    
    const totalRightSize = rightElements.reduce((sum, el) => sum + el.size, 0);
    if (totalRightSize > 0) columns.push(`${totalRightSize}%`);
    else columns.push('0px');

    // Если есть только верхняя/нижняя панель и основной контент
    if (topEl && !leftEl && rightElements.length === 0 && (centerEl || bottomEl)) {
      // Скрываем ResizableHandle на мобильных устройствах для вкладки "Бот"
      
      return (
        <ResizablePanelGroup direction="vertical" className="h-full gap-0">
          <ResizablePanel defaultSize={isMobile ? 7 : topEl.size} minSize={isMobile ? 7 : 15} maxSize={30} className="p-0 m-0">
            <div className="h-full bg-background overflow-auto">
              {getElementContent(topEl.type)}
            </div>
          </ResizablePanel>
          <ResizableHandle className="!hidden" style={{ height: 0, margin: 0, padding: 0 }} />
          <ResizablePanel defaultSize={isMobile ? 93 : (100 - topEl.size)} className="p-0 m-0">
            <div className="h-full bg-background overflow-auto">
              {centerEl ? getElementContent(centerEl.type) : (bottomEl ? getElementContent(bottomEl.type) : null)}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      );
    }

    // Если есть боковые панели и основной контент
    if ((leftEl || rightElements.length > 0) && centerEl && !topEl && !bottomEl) {
      const leftSize = leftEl?.size || 0;
      const totalRightSize = rightElements.reduce((sum, el) => sum + el.size, 0);
      
      return (
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {leftEl && (
            <>
              <ResizablePanel 
                defaultSize={leftSize} 
                minSize={15} 
                maxSize={40}
              >
                <div className="h-full w-full bg-background overflow-hidden flex flex-col">
                  {getElementContent(leftEl.type)}
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
            </>
          )}
          <ResizablePanel 
            minSize={30}
          >
            <div className="h-full w-full bg-background overflow-hidden flex flex-col">
              {getElementContent(centerEl.type)}
            </div>
          </ResizablePanel>
          {rightElements.length > 0 && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel 
                defaultSize={totalRightSize} 
                minSize={15} 
                maxSize={40}
              >
                <ResizablePanelGroup direction="horizontal" className="h-full w-full">
                  {rightElements.flatMap((rightEl, index) => [
                    ...(index > 0 ? [<ResizableHandle key={`handle-${rightEl.id}`} withHandle />] : []),
                    <ResizablePanel 
                      key={`panel-${rightEl.id}`}
                      defaultSize={totalRightSize > 0 ? (rightEl.size / totalRightSize) * 100 : 50}
                      minSize={10}
                      maxSize={100}
                    >
                      <div className="h-full w-full overflow-hidden flex flex-col">
                        {getElementContent(rightEl.type)}
                      </div>
                    </ResizablePanel>
                  ])}
                </ResizablePanelGroup>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      );
    }

    // Комбинированный макет (верх + боковые панели)
    return (
      <div className="h-full flex flex-col">
        {topEl && (
          <div className="bg-background" style={{ minHeight: `${topEl.size}rem` }}>
            {getElementContent(topEl.type)}
          </div>
        )}
        <div className="flex-1 min-h-0">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {leftEl && (
              <>
                <ResizablePanel 
                  defaultSize={leftEl.size} 
                  minSize={15} 
                  maxSize={40}
                >
                  <div className="h-full w-full border-r border-border bg-background overflow-hidden flex flex-col">
                    {getElementContent(leftEl.type)}
                  </div>
                </ResizablePanel>
                <ResizableHandle 
                  withHandle 
                  className="bg-gradient-to-r from-transparent via-slate-300/0 to-transparent hover:from-blue-500/20 hover:via-blue-500/40 hover:to-blue-500/20 dark:hover:from-blue-600/20 dark:hover:via-blue-500/30 dark:hover:to-blue-600/20 transition-all duration-300 w-0.5 hover:w-1.5 active:w-2 active:bg-gradient-to-r active:from-blue-500/30 active:via-blue-600/50 active:to-blue-500/30 cursor-col-resize relative flex items-center justify-center group shadow-sm hover:shadow-md active:shadow-lg"
                >
                  <div className="absolute h-16 md:h-20 w-1.5 md:w-2 bg-gradient-to-b from-transparent via-blue-400 dark:via-blue-500 to-transparent opacity-0 group-hover:opacity-100 active:opacity-100 transition-all duration-200 pointer-events-none rounded-full blur-sm"></div>
                  <div className="absolute h-8 w-0.5 md:w-1 bg-gradient-to-b from-blue-400 via-blue-500 to-blue-400 dark:from-blue-500 dark:via-blue-400 dark:to-blue-500 opacity-0 group-hover:opacity-60 active:opacity-100 transition-all duration-200 pointer-events-none rounded-full"></div>
                </ResizableHandle>
              </>
            )}
            <ResizablePanel 
              minSize={30}
            >
              <div className="h-full w-full bg-background overflow-hidden flex flex-col">
                {centerEl ? getElementContent(centerEl.type) : null}
              </div>
            </ResizablePanel>
            {rightElements.length > 0 && (
              <>
                <ResizableHandle 
                  withHandle 
                  className="bg-gradient-to-r from-transparent via-slate-300/0 to-transparent hover:from-blue-500/20 hover:via-blue-500/40 hover:to-blue-500/20 dark:hover:from-blue-600/20 dark:hover:via-blue-500/30 dark:hover:to-blue-600/20 transition-all duration-300 w-0.5 hover:w-1.5 active:w-2 active:bg-gradient-to-r active:from-blue-500/30 active:via-blue-600/50 active:to-blue-500/30 cursor-col-resize relative flex items-center justify-center group shadow-sm hover:shadow-md active:shadow-lg"
                >
                  <div className="absolute h-16 md:h-20 w-1.5 md:w-2 bg-gradient-to-b from-transparent via-blue-400 dark:via-blue-500 to-transparent opacity-0 group-hover:opacity-100 active:opacity-100 transition-all duration-200 pointer-events-none rounded-full blur-sm"></div>
                  <div className="absolute h-8 w-0.5 md:w-1 bg-gradient-to-b from-blue-400 via-blue-500 to-blue-400 dark:from-blue-500 dark:via-blue-400 dark:to-blue-500 opacity-0 group-hover:opacity-60 active:opacity-100 transition-all duration-200 pointer-events-none rounded-full"></div>
                </ResizableHandle>
                <ResizablePanel 
                  defaultSize={totalRightSize} 
                  minSize={15}
                >
                  <ResizablePanelGroup direction="horizontal" className="h-full w-full">
                    {rightElements.flatMap((rightEl, index) => [
                      ...(index > 0 ? [<ResizableHandle key={`handle-${rightEl.id}`} withHandle className="bg-gradient-to-r from-transparent via-slate-200/0 to-transparent hover:from-purple-500/15 hover:via-purple-500/30 hover:to-purple-500/15 dark:hover:from-purple-600/15 dark:hover:via-purple-500/25 dark:hover:to-purple-600/15 transition-all duration-300 w-0.5 hover:w-1.5 active:w-2 cursor-col-resize relative flex items-center justify-center group shadow-sm hover:shadow-md" />] : []),
                      <ResizablePanel 
                        key={`panel-${rightEl.id}`}
                        defaultSize={totalRightSize > 0 ? (rightEl.size / totalRightSize) * 100 : 50}
                        minSize={10}
                        maxSize={100}
                      >
                        <div className="h-full w-full overflow-hidden flex flex-col">
                          {getElementContent(rightEl.type)}
                        </div>
                      </ResizablePanel>
                    ])}
                  </ResizablePanelGroup>
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </div>
        {bottomEl && (
          <div className="border-t border-border bg-background" style={{ minHeight: `${bottomEl.size}px` }}>
            {getElementContent(bottomEl.type)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen overflow-hidden">
      {createSimpleLayout()}
    </div>
  );
};

/**
 * @exports FlexibleLayout
 * @description Экспортирует компонент FlexibleLayout по умолчанию
 */
export default FlexibleLayout;