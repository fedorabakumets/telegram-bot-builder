import { ComponentDefinition, BotProject } from '@shared/schema';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef, memo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SheetsManager } from '@/utils/sheets-manager';

import QuickLayoutSwitcher from '@/components/layout/quick-layout-switcher';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { apiRequest } from '@/lib/queryClient';

interface ComponentsSidebarProps {
  isDragging: boolean;
  isActuallyMobile: boolean;
  currentProjectId?: number;
  onComponentDrag?: (component: ComponentDefinition) => void;
  onComponentAdd?: (component: ComponentDefinition) => void;
  onLoadTemplate?: () => void;
}

function ComponentsSidebar({
  isDragging,
  isActuallyMobile,
  currentProjectId,
  onComponentDrag,
  onComponentAdd,
  onLoadTemplate,
  onOpenLayoutCustomizer,
  onLayoutChange,
  onGoToProjects,
  onProjectSelect,
  activeSheetId,
  headerContent,
  sidebarContent,
  canvasContent,
  propertiesContent,
  onToggleCanvas,
  onToggleHeader,
  onToggleProperties,
  onShowFullLayout,
  canvasVisible,
  headerVisible,
  propertiesVisible,
  showLayoutButtons,
  onSheetAdd,
  onSheetDelete,
  onSheetRename,
  onSheetDuplicate,
  onSheetSelect,
  isMobile: isMobileProp
}: ComponentsSidebarProps) {
  const isMobile = useIsMobile();
  const sidebarRef = useRef<HTMLElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  // Отслеживание позиции мышки для диагностики пульсирования
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const sidebarRect = sidebarRef.current?.getBoundingClientRect();
      if (sidebarRect && e.clientX < sidebarRect.right) {
        setMousePos({ x: e.clientX, y: e.clientY });
      }
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [touchedComponent, setTouchedComponent] = useState<string | null>(null);
  const touchStartElement = useRef<HTMLElement | null>(null);

  // Handle drag start
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, component: ComponentDefinition) => {
    if (onComponentDrag) {
      onComponentDrag(component);
    }
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('component', JSON.stringify(component));
  };

  // Handle touch for mobile
  useEffect(() => {
    const handleGlobalTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      const componentElement = target.closest('[data-component]');
      if (componentElement) {
        touchStartElement.current = componentElement;
        const componentData = componentElement.getAttribute('data-component');
        if (componentData) {
          setTouchedComponent(componentData);
        }
      }
    };

    const handleGlobalTouchEnd = (e: TouchEvent) => {
      if (touchStartElement.current && touchedComponent) {
        try {
          const component = JSON.parse(touchedComponent);
          if (onComponentAdd) {
            onComponentAdd(component);
          }
        } catch (error) {
          console.error('Failed to parse component data:', error);
        }
      }
      setTouchedComponent(null);
      touchStartElement.current = null;
    };

    if (isDragging) {
      document.addEventListener('touchstart', handleGlobalTouchStart);
      document.addEventListener('touchend', handleGlobalTouchEnd);
    }

    return () => {
      document.removeEventListener('touchstart', handleGlobalTouchStart);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [isDragging, touchedComponent, touchStartElement]);

  
  // 🔥 FIX ПУЛЬСИРОВАНИЯ: Отключаем ВСЕ типы refetch
  // ВАЖНО: staleTime: Infinity + refetchInterval: false = НОЛЬ refetch и ноль рендеров!
  const { data: projects = [], isLoading } = useQuery<BotProject[]>({
    queryKey: ['/api/projects'],
    queryFn: () => apiRequest('GET', '/api/projects'),
    staleTime: Infinity,
    gcTime: Infinity,
    refetchInterval: false,
    refetchIntervalInBackground: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Здесь мы получаем структуру компонентов
  const components: { [category: string]: ComponentDefinition[] } = {
    'Основные': [
      {
        id: 'text',
        name: 'Текст',
        type: 'text',
        icon: '📝',
        defaultData: { content: 'Привет!' }
      },
      {
        id: 'button',
        name: 'Кнопка',
        type: 'button',
        icon: '🔘',
        defaultData: { label: 'Нажми меня', action: '' }
      },
      {
        id: 'input',
        name: 'Ввод',
        type: 'input',
        icon: '📥',
        defaultData: { placeholder: 'Введи текст' }
      }
    ],
    'Контроль потока': [
      {
        id: 'condition',
        name: 'Условие',
        type: 'condition',
        icon: '❓',
        defaultData: { condition: '' }
      },
      {
        id: 'loop',
        name: 'Цикл',
        type: 'loop',
        icon: '🔄',
        defaultData: { count: 3 }
      }
    ],
    'Данные': [
      {
        id: 'variable',
        name: 'Переменная',
        type: 'variable',
        icon: '📦',
        defaultData: { name: 'var', value: '' }
      },
      {
        id: 'api',
        name: 'API запрос',
        type: 'api',
        icon: '🌐',
        defaultData: { url: '', method: 'GET' }
      }
    ]
  };

  const toggleCategory = (category: string) => {
    const newCollapsed = new Set(collapsedCategories);
    if (newCollapsed.has(category)) {
      newCollapsed.delete(category);
    } else {
      newCollapsed.add(category);
    }
    setCollapsedCategories(newCollapsed);
  };

  const SidebarContent = () => (
    <div className="space-y-4 p-4 overflow-y-auto h-full">
      {Object.entries(components).map(([category, comps]) => (
        <div key={category} className="space-y-2">
          <button
            onClick={() => toggleCategory(category)}
            className="w-full text-left font-semibold text-sm text-foreground hover:text-primary transition-colors flex items-center justify-between p-2 rounded hover:bg-muted"
            data-testid={`button-toggle-category-${category.toLowerCase()}`}
          >
            <span>{category}</span>
            <span className="text-xs text-muted-foreground">
              {collapsedCategories.has(category) ? '▶' : '▼'}
            </span>
          </button>
          
          {!collapsedCategories.has(category) && (
            <div className="space-y-2 pl-2">
              {comps.map((component) => (
                <div
                  key={component.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, component)}
                  onClick={() => onComponentAdd && onComponentAdd(component)}
                  data-component={JSON.stringify(component)}
                  className="p-3 bg-muted rounded border border-border hover:bg-muted/80 cursor-move transition-colors"
                  data-testid={`card-component-${component.id}`}
                >
                  <div className="text-2xl mb-1">{component.icon}</div>
                  <div className="text-sm font-medium text-foreground">{component.name}</div>
                  <div className="text-xs text-muted-foreground">Перетащи или нажми</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {onLoadTemplate && (
        <div className="pt-4 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={onLoadTemplate}
            className="w-full"
            data-testid="button-load-template"
          >
            📋 Загрузить шаблон
          </Button>
        </div>
      )}
    </div>
  );

  // На мобильных устройствах возвращаем обёртку с контролем видимости
  if (isActuallyMobile || isMobile) {
    return <SidebarContent />;
  }

  // Десктопная версия
  return (
    <aside ref={sidebarRef} className="w-full bg-background h-full flex flex-col overflow-hidden">
      <SidebarContent />
    </aside>
  );
}

// ✅ MEMO с CUSTOM СРАВНЕНИЕМ - игнорируем функции в props
function propsAreEqual(prev: any, next: any) {
  for (const key in next) {
    const prevVal = prev[key];
    const nextVal = next[key];
    
    // Игнорируем функции - они всегда разные
    if (typeof nextVal === 'function') continue;
    
    // Сравниваем остальное
    if (prevVal !== nextVal) {
      return false;
    }
  }
  return true;
}

export default memo(ComponentsSidebar, propsAreEqual);
