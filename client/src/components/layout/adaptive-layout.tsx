import { ReactNode, useMemo } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { LayoutConfig } from './layout-manager';

interface AdaptiveLayoutProps {
  config: LayoutConfig;
  header: ReactNode;
  sidebar: ReactNode;
  canvas: ReactNode;
  properties: ReactNode;
  children?: ReactNode;
}

export function AdaptiveLayout({
  config,
  header,
  sidebar,
  canvas,
  properties,
  children
}: AdaptiveLayoutProps) {
  
  // Вычисляем CSS классы для контейнера на основе конфигурации
  const containerClasses = useMemo(() => {
    const classes = ['h-screen overflow-hidden bg-gray-50 dark:bg-gray-900'];
    
    if (config.compactMode) {
      classes.push('text-sm');
    }
    
    return classes.join(' ');
  }, [config.compactMode]);

  // Вычисляем размеры заголовка
  const headerSize = useMemo(() => {
    if (config.headerPosition === 'top' || config.headerPosition === 'bottom') {
      return config.compactMode ? 48 : 64; // 3rem или 4rem
    }
    return config.compactMode ? 240 : 320; // 15rem или 20rem
  }, [config.headerPosition, config.compactMode]);

  // Функция для создания макета с заголовком сверху/снизу
  const createVerticalLayout = () => {
    const headerElement = (
      <div 
        className={`${config.headerPosition === 'top' ? 'order-1' : 'order-3'} flex-shrink-0`}
        style={{ height: `${headerSize}px` }}
      >
        {header}
      </div>
    );

    const contentElement = (
      <div className={`${config.headerPosition === 'top' ? 'order-2' : 'order-1'} flex-1 min-h-0`}>
        {createHorizontalPanels()}
      </div>
    );

    return (
      <div className={`${containerClasses} flex flex-col`}>
        {config.headerPosition === 'top' ? headerElement : contentElement}
        {config.headerPosition === 'top' ? contentElement : headerElement}
        {children}
      </div>
    );
  };

  // Функция для создания макета с заголовком слева/справа
  const createHorizontalLayout = () => {
    const headerElement = (
      <div 
        className={`${config.headerPosition === 'left' ? 'order-1' : 'order-3'} flex-shrink-0`}
        style={{ width: `${headerSize}px` }}
      >
        <div className="h-full flex flex-col">
          {header}
        </div>
      </div>
    );

    const contentElement = (
      <div className={`${config.headerPosition === 'left' ? 'order-2' : 'order-1'} flex-1 min-w-0`}>
        {createVerticalPanels()}
      </div>
    );

    return (
      <div className={`${containerClasses} flex`}>
        {config.headerPosition === 'left' ? headerElement : contentElement}
        {config.headerPosition === 'left' ? contentElement : headerElement}
        {children}
      </div>
    );
  };

  // Создает горизонтальные панели (сайдбар | холст | свойства)
  const createHorizontalPanels = () => {
    const panels = [];
    
    // Определяем порядок панелей
    if (config.sidebarPosition === 'left') {
      panels.push(
        <ResizablePanel 
          key="sidebar"
          defaultSize={config.panelSizes.sidebar} 
          minSize={10} 
          maxSize={40}
          className="flex-shrink-0"
        >
          {sidebar}
        </ResizablePanel>
      );
      panels.push(<ResizableHandle key="handle1" withHandle />);
    }

    if (config.propertiesPosition === 'left' && config.sidebarPosition === 'right') {
      panels.push(
        <ResizablePanel 
          key="properties-left"
          defaultSize={config.panelSizes.properties} 
          minSize={15} 
          maxSize={40}
          className="flex-shrink-0"
        >
          {properties}
        </ResizablePanel>
      );
      panels.push(<ResizableHandle key="handle-prop-left" withHandle />);
    }

    // Центральная панель холста
    panels.push(
      <ResizablePanel 
        key="canvas"
        defaultSize={config.panelSizes.canvas} 
        minSize={30}
        className="flex-1"
      >
        {config.canvasFullscreen ? (
          <div className="h-full relative">
            {canvas}
            <div className="absolute inset-0 pointer-events-none">
              {config.showGrid && (
                <div className="absolute inset-0 opacity-10 bg-grid-small bg-grid-slate-200 dark:bg-grid-slate-800" />
              )}
            </div>
          </div>
        ) : (
          canvas
        )}
      </ResizablePanel>
    );

    if (config.propertiesPosition === 'right' || (config.propertiesPosition === 'left' && config.sidebarPosition === 'left')) {
      panels.push(<ResizableHandle key="handle2" withHandle />);
      panels.push(
        <ResizablePanel 
          key="properties-right"
          defaultSize={config.panelSizes.properties} 
          minSize={15} 
          maxSize={40}
          className="flex-shrink-0"
        >
          {properties}
        </ResizablePanel>
      );
    }

    if (config.sidebarPosition === 'right') {
      panels.push(<ResizableHandle key="handle3" withHandle />);
      panels.push(
        <ResizablePanel 
          key="sidebar-right"
          defaultSize={config.panelSizes.sidebar} 
          minSize={10} 
          maxSize={40}
          className="flex-shrink-0"
        >
          {sidebar}
        </ResizablePanel>
      );
    }

    return (
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {panels}
      </ResizablePanelGroup>
    );
  };

  // Создает вертикальные панели (для горизонтального заголовка)
  const createVerticalPanels = () => {
    return (
      <ResizablePanelGroup direction="vertical" className="h-full">
        <ResizablePanel defaultSize={20} minSize={15} maxSize={35}>
          {sidebar}
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        <ResizablePanel defaultSize={60} minSize={30}>
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={75} minSize={50}>
              {canvas}
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
              {properties}
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    );
  };

  // Главная логика выбора макета
  if (config.headerPosition === 'top' || config.headerPosition === 'bottom') {
    return createVerticalLayout();
  } else {
    return createHorizontalLayout();
  }
}