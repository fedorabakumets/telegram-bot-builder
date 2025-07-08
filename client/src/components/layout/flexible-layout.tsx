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
      return renderElement(visibleElements[0]);
    }

    // Определяем структуру макета
    const hasTop = visibleElements.some(el => el.position === 'top');
    const hasBottom = visibleElements.some(el => el.position === 'bottom');
    const hasLeft = visibleElements.some(el => el.position === 'left');
    const hasRight = visibleElements.some(el => el.position === 'right');
    const hasCenter = visibleElements.some(el => el.position === 'center');

    // Создаем areas строку
    const topArea = hasTop ? (hasLeft ? 'top-left ' : '') + 'top' + (hasRight ? ' top-right' : '') : '';
    const middleArea = (hasLeft ? 'left ' : '') + (hasCenter ? 'center' : '') + (hasRight ? ' right' : '');
    const bottomArea = hasBottom ? (hasLeft ? 'bottom-left ' : '') + 'bottom' + (hasRight ? ' bottom-right' : '') : '';

    const gridAreas = [topArea, middleArea, bottomArea].filter(Boolean).map(area => `"${area}"`).join(' ');

    // Создаем размеры строк
    const topSize = visibleElements.find(el => el.position === 'top')?.size || 0;
    const bottomSize = visibleElements.find(el => el.position === 'bottom')?.size || 0;
    const rowSizes = [
      hasTop ? `${topSize}px` : '',
      '1fr',
      hasBottom ? `${bottomSize}px` : ''
    ].filter(Boolean).join(' ');

    // Создаем размеры колонок
    const leftSize = visibleElements.find(el => el.position === 'left')?.size || 0;
    const rightSize = visibleElements.find(el => el.position === 'right')?.size || 0;
    const columnSizes = [
      hasLeft ? `${leftSize}%` : '',
      '1fr',
      hasRight ? `${rightSize}%` : ''
    ].filter(Boolean).join(' ');

    return (
      <div
        className="h-full"
        style={{
          display: 'grid',
          gridTemplateAreas: gridAreas,
          gridTemplateRows: rowSizes,
          gridTemplateColumns: columnSizes,
          gap: '0px'
        }}
      >
        {visibleElements.map(element => renderElement(element))}
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