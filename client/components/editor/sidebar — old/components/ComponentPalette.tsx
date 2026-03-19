/**
 * @fileoverview Компонент палитры компонентов для sidebar
 * Отображает категории компонентов с поддержкой сворачивания
 * @module components/editor/sidebar/components/ComponentPalette
 */

import React, { useState } from 'react';
import { ComponentDefinition } from '@shared/schema';
import { cn } from '@/utils/utils';

import { ChevronDown, ChevronRight, GripVertical } from 'lucide-react';

/**
 * Категория компонентов
 */
export interface ComponentCategory {
  /** Название категории */
  name: string;
  /** Описание категории */
  description: string;
  /** Иконка категории */
  icon: string;
  /** Компоненты в категории */
  components: ComponentDefinition[];
}

/**
 * Пропсы для компонента ComponentPalette
 */
export interface ComponentPaletteProps {
  /** Категории компонентов */
  categories: ComponentCategory[];
  /** Обработчик начала перетаскивания компонента */
  onComponentDragStart: (e: React.DragEvent, component: ComponentDefinition) => void;
}

/**
 * Компонент палитры компонентов
 */
export const ComponentPalette: React.FC<ComponentPaletteProps> = ({
  categories,
  onComponentDragStart,
}) => {
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (categoryName: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryName)) {
        next.delete(categoryName);
      } else {
        next.add(categoryName);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {categories.map(category => {
        const isCollapsed = collapsedCategories.has(category.name);

        return (
          <div key={category.name} className="border rounded-lg overflow-hidden">
            {/* Заголовок категории */}
            <button
              className={cn(
                'w-full flex items-center gap-2 p-3 bg-muted/50 hover:bg-muted transition-colors',
                'text-left font-medium'
              )}
              onClick={() => toggleCategory(category.name)}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              <span className="flex items-center gap-2">
                <i className={category.icon} />
                {category.name}
              </span>
              <span className="ml-auto text-xs text-muted-foreground">
                {category.components.length}
              </span>
            </button>

            {/* Список компонентов */}
            {!isCollapsed && (
              <div className="p-3 space-y-2 bg-background">
                {category.components.map(component => (
                  <div
                    key={component.id}
                    className={cn(
                      'flex items-center gap-2 p-2 rounded-md border',
                      'hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing',
                      component.color
                    )}
                    draggable
                    onDragStart={(e) => onComponentDragStart(e, component)}
                  >
                    <GripVertical className="w-4 h-4 opacity-50" />
                    <i className={component.icon} />
                    <span className="text-sm font-medium">{component.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
