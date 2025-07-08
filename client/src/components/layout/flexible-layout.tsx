import React, { useMemo } from 'react';
import { SimpleLayoutConfig } from './simple-layout-customizer';

interface FlexibleLayoutProps {
  config: SimpleLayoutConfig;
  headerContent: React.ReactNode;
  sidebarContent: React.ReactNode;
  canvasContent: React.ReactNode;
  propertiesContent: React.ReactNode;
}

export const FlexibleLayout: React.FC<FlexibleLayoutProps> = ({
  config,
  headerContent,
  sidebarContent,
  canvasContent,
  propertiesContent
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
      return <div className="h-full flex items-center justify-center text-muted-foreground">
        Нет видимых элементов
      </div>;
    }

    // Если есть только один элемент
    if (visibleElements.length === 1) {
      return (
        <div className="h-full">
          {renderElement(visibleElements[0])}
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

    return (
      <div
        className="h-full"
        style={{
          display: 'grid',
          gridTemplateAreas: areas.join(' '),
          gridTemplateRows: rows.join(' '),
          gridTemplateColumns: columns.join(' '),
          gap: '0px'
        }}
      >
        {topEl && (
          <div key="header" style={{ gridArea: 'header' }} className="border-b border-border bg-background">
            {getElementContent(topEl.type)}
          </div>
        )}
        {leftEl && (
          <div key="sidebar" style={{ gridArea: 'sidebar' }} className="border-r border-border bg-background">
            {getElementContent(leftEl.type)}
          </div>
        )}
        {centerEl && (
          <div key="main" style={{ gridArea: 'main' }} className="bg-background">
            {getElementContent(centerEl.type)}
          </div>
        )}
        {rightEl && (
          <div key="properties" style={{ gridArea: 'properties' }} className="border-l border-border bg-background">
            {getElementContent(rightEl.type)}
          </div>
        )}
        {bottomEl && (
          <div key="footer" style={{ gridArea: 'footer' }} className="border-t border-border bg-background">
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