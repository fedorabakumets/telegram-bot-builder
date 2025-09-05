import React, { useMemo } from 'react';
import { SimpleLayoutConfig } from './simple-layout-customizer';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Navigation, Sidebar, Sliders, Monitor } from 'lucide-react';

interface FlexibleLayoutProps {
  config: SimpleLayoutConfig;
  headerContent: React.ReactNode;
  sidebarContent: React.ReactNode;
  canvasContent: React.ReactNode;
  propertiesContent: React.ReactNode;
  onConfigChange?: (newConfig: SimpleLayoutConfig) => void;
}

export const FlexibleLayout: React.FC<FlexibleLayoutProps> = ({
  config,
  headerContent,
  sidebarContent,
  canvasContent,
  propertiesContent,
  onConfigChange
}) => {
  const layoutStyles = useMemo(() => {
    const visibleElements = config.elements.filter(el => el.visible);
    
    // Определяем элементы по позициям
    const topElements = visibleElements.filter(el => el.position === 'top');
    const bottomElements = visibleElements.filter(el => el.position === 'bottom');
    const leftElements = visibleElements.filter(el => el.position === 'left');
    const rightElements = visibleElements.filter(el => el.position === 'right');
    const centerElements = visibleElements.filter(el => el.position === 'center');
    
    // Вычисляем размеры
    const topSize = topElements.reduce((sum, el) => sum + el.size, 0);
    const bottomSize = bottomElements.reduce((sum, el) => sum + el.size, 0);
    const leftSize = leftElements.reduce((sum, el) => sum + el.size, 0);
    const rightSize = rightElements.reduce((sum, el) => sum + el.size, 0);
    
    return {
      container: {
        display: 'grid',
        height: '100vh',
        gridTemplateRows: `${topSize > 0 ? `${topSize}px` : ''} 1fr ${bottomSize > 0 ? `${bottomSize}px` : ''}`.trim(),
        gridTemplateColumns: `${leftSize > 0 ? `${leftSize}%` : ''} 1fr ${rightSize > 0 ? `${rightSize}%` : ''}`.trim(),
        gridTemplateAreas: `
          ${topSize > 0 ? `"${leftSize > 0 ? 'top-left' : ''} top ${rightSize > 0 ? 'top-right' : ''}"` : ''}
          "${leftSize > 0 ? 'left' : ''} center ${rightSize > 0 ? 'right' : ''}"
          ${bottomSize > 0 ? `"${leftSize > 0 ? 'bottom-left' : ''} bottom ${rightSize > 0 ? 'bottom-right' : ''}"` : ''}
        `.trim()
      },
      elements: {
        top: topSize > 0 ? { gridArea: 'top' } : undefined,
        bottom: bottomSize > 0 ? { gridArea: 'bottom' } : undefined,
        left: leftSize > 0 ? { gridArea: 'left' } : undefined,
        right: rightSize > 0 ? { gridArea: 'right' } : undefined,
        center: { gridArea: 'center' }
      }
    };
  }, [config]);

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
      default:
        return null;
    }
  };

  const renderElement = (element: any) => {
    const content = getElementContent(element.type);
    if (!content) return null;

    const gridArea = element.position === 'center' ? 'center' : 
                    element.position === 'top' ? 'top' :
                    element.position === 'bottom' ? 'bottom' :
                    element.position === 'left' ? 'left' :
                    element.position === 'right' ? 'right' : 'center';

    return (
      <div
        key={element.id}
        className={`
          ${element.type === 'header' ? 'border-b' : ''}
          ${element.type === 'sidebar' ? 'border-r' : ''}
          ${element.type === 'properties' ? 'border-l' : ''}
          ${config.compactMode ? 'text-sm' : ''}
          border-border bg-background
          ${config.showGrid ? 'relative' : ''}
        `}
        style={{
          gridArea: gridArea,
          minHeight: element.type === 'header' ? '60px' : '200px',
          overflow: 'hidden'
        }}
      >
        {config.showGrid && (
          <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
            backgroundImage: `
              linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }} />
        )}
        <div className="relative z-10 h-full">
          {content}
        </div>
      </div>
    );
  };

  // Создаем упрощенный CSS Grid layout
  const createSimpleLayout = () => {
    const visibleElements = config.elements.filter(el => el.visible);
    
    if (visibleElements.length === 0) {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground bg-background relative">
          <div className="text-center mb-8">
            <h3 className="text-lg font-medium mb-2">Все панели скрыты</h3>
            <p className="text-sm">Используйте кнопки ниже для показа панелей</p>
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
    const rightEl = visibleElements.find(el => el.position === 'right');
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
    
    if (rightEl) middleArea += 'properties';
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
    
    if (rightEl) columns.push(`${rightEl.size}%`);
    else columns.push('0px');

    // Если есть только верхняя/нижняя панель и основной контент
    if (topEl && !leftEl && !rightEl && (centerEl || bottomEl)) {
      return (
        <ResizablePanelGroup direction="vertical" className="h-full">
          <ResizablePanel defaultSize={topEl.size} minSize={15} maxSize={30}>
            <div className="h-full border-b border-border bg-background overflow-auto">
              {getElementContent(topEl.type)}
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={100 - topEl.size}>
            <div className="h-full bg-background overflow-auto">
              {centerEl ? getElementContent(centerEl.type) : (bottomEl ? getElementContent(bottomEl.type) : null)}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      );
    }

    // Если есть боковые панели и основной контент
    if ((leftEl || rightEl) && centerEl && !topEl && !bottomEl) {
      const leftSize = leftEl?.size || 0;
      const rightSize = rightEl?.size || 0;
      const centerSize = Math.max(100 - leftSize - rightSize, 30); // минимум 30% для центра
      
      return (
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {leftEl && (
            <>
              <ResizablePanel defaultSize={leftSize} minSize={15} maxSize={40}>
                <div className="h-full border-r border-border bg-background overflow-auto">
                  {getElementContent(leftEl.type)}
                </div>
              </ResizablePanel>
              <ResizableHandle />
            </>
          )}
          <ResizablePanel defaultSize={centerSize} minSize={30}>
            <div className="h-full bg-background overflow-auto">
              {getElementContent(centerEl.type)}
            </div>
          </ResizablePanel>
          {rightEl && (
            <>
              <ResizableHandle />
              <ResizablePanel defaultSize={rightSize} minSize={15} maxSize={40}>
                <div className="h-full border-l border-border bg-background overflow-auto">
                  {getElementContent(rightEl.type)}
                </div>
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
          <div className="border-b border-border bg-background" style={{ minHeight: `${topEl.size}px` }}>
            {getElementContent(topEl.type)}
          </div>
        )}
        <div className="flex-1 min-h-0">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {leftEl && (
              <>
                <ResizablePanel defaultSize={leftEl.size} minSize={15} maxSize={40}>
                  <div className="h-full border-r border-border bg-background overflow-auto">
                    {getElementContent(leftEl.type)}
                  </div>
                </ResizablePanel>
                <ResizableHandle />
              </>
            )}
            <ResizablePanel defaultSize={Math.max(100 - (leftEl?.size || 0) - (rightEl?.size || 0), 30)} minSize={30}>
              <div className="h-full bg-background overflow-auto">
                {centerEl ? getElementContent(centerEl.type) : null}
              </div>
            </ResizablePanel>
            {rightEl && (
              <>
                <ResizableHandle />
                <ResizablePanel defaultSize={rightEl.size} minSize={15} maxSize={40}>
                  <div className="h-full border-l border-border bg-background overflow-auto">
                    {getElementContent(rightEl.type)}
                  </div>
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

export default FlexibleLayout;