/**
 * @fileoverview Компонент вкладки компонентов для sidebar редактора ботов
 * Отображает список категорий компонентов с поддержкой сворачивания/разворачивания
 * и drag-and-drop для мобильных и десктопных устройств
 * @module components/editor/sidebar/components/components-tab
 */

import { ComponentDefinition } from '@shared/schema';
import { cn } from '@/utils/utils';
import { Plus, ChevronDown, ChevronRight } from 'lucide-react';

/** Пропсы компонента ComponentsTab */
export interface ComponentsTabProps {
  /** Массив категорий компонентов */
  categories: Array<{ title: string, components: ComponentDefinition[] }>;
  /** Множество свёрнутых категорий */
  collapsedCategories: Set<string>;
  /** Состояние touch-перетаскивания */
  touchState: {
    /** Компонент, который перетаскивают */
    touchedComponent: ComponentDefinition | null;
    /** Идёт ли перетаскивание */
    isDragging: boolean;
  };
  /** Обработчик сворачивания/разворачивания категории */
  onToggleCategory: (categoryTitle: string) => void;
  /** Обработчик начала touch-перетаскивания */
  onTouchStart: (e: React.TouchEvent, component: ComponentDefinition) => void;
  /** Обработчик движения touch-перетаскивания */
  onTouchMove: (e: React.TouchEvent) => void;
  /** Обработчик конца touch-перетаскивания */
  onTouchEnd: (e: React.TouchEvent) => void;
  /** Обработчик перетаскивания компонента */
  onComponentDrag: (component: ComponentDefinition) => void;
  /** Обработчик добавления компонента (опционально) */
  onComponentAdd?: (component: ComponentDefinition) => void;
}

/**
 * Компонент вкладки компонентов
 * Отображает категории компонентов с кнопками сворачивания/разворачивания
 * Поддерживает drag-and-drop и touch-перетаскивание для мобильных устройств
 * @param props - Свойства компонента
 * @returns JSX элемент вкладки компонентов
 */
export function ComponentsTab({
  categories,
  collapsedCategories,
  touchState,
  onToggleCategory,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onComponentDrag,
  onComponentAdd,
}: ComponentsTabProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {categories.map((category) => {
        /** Флаг свёрнутости категории */
        const isCollapsed = collapsedCategories.has(category.title);

        return (
          <div key={category.title} className="space-y-2 sm:space-y-3">
            {/* Заголовок категории */}
            <button
              onClick={() => onToggleCategory(category.title)}
              className="w-full flex items-center justify-between gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-slate-100/80 to-slate-50/40 dark:from-slate-800/60 dark:to-slate-900/40 hover:from-slate-200/60 hover:to-slate-100/30 dark:hover:from-slate-700/50 dark:hover:to-slate-800/30 transition-all duration-200 group border border-slate-200/40 dark:border-slate-700/40 hover:border-primary/30"
              data-testid={`category-${category.title}`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="truncate">{category.title}</span>
                <span className="text-xs normal-case bg-muted/60 dark:bg-slate-700/60 px-2 py-0.5 rounded-full font-semibold text-muted-foreground whitespace-nowrap flex-shrink-0 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                  {category.components.length}
                </span>
              </div>
              <div className="flex-shrink-0 p-1 rounded-md group-hover:bg-muted/50 transition-colors">
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                ) : (
                  <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                )}
              </div>
            </button>

            {/* Список компонентов категории */}
            {!isCollapsed && (
              <div className="space-y-1.5 sm:space-y-2 transition-all duration-200 ease-in-out">
                {category.components.map((component) => (
                  <div
                    key={component.id}
                    draggable
                    onDragStart={() => onComponentDrag(component)}
                    onTouchStart={(e) => onTouchStart(e, component)}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                    className={cn(
                      "component-item group/item flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3",
                      "bg-gradient-to-br from-muted/40 to-muted/20 dark:from-slate-800/50 dark:to-slate-900/30",
                      "hover:from-muted/70 hover:to-muted/40 dark:hover:from-slate-700/60 dark:hover:to-slate-800/40",
                      "rounded-lg sm:rounded-xl cursor-move transition-all duration-200 touch-action-none no-select",
                      "border border-border/30 hover:border-primary/30",
                      touchState.touchedComponent?.id === component.id && touchState.isDragging
                        ? 'opacity-50 scale-95'
                        : ''
                    )}
                    data-testid={`component-${component.id}`}
                  >
                    {/* Иконка компонента */}
                    <div className={cn(
                      "w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                      "transition-transform group-hover/item:scale-110",
                      component.color
                    )}>
                      <i className={`${component.icon} text-xs sm:text-sm`}></i>
                    </div>

                    {/* Название и описание */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
                        {component.name}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {component.description}
                      </p>
                    </div>

                    {/* Кнопка добавления компонента */}
                    {onComponentAdd && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onComponentAdd(component);
                        }}
                        className={cn(
                          "ml-1 flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-lg",
                          "bg-primary/10 hover:bg-primary/20 text-primary",
                          "dark:bg-primary/15 dark:hover:bg-primary/25",
                          "hidden group-hover/item:flex items-center justify-center",
                          "transition-all duration-200 hover:shadow-md hover:shadow-primary/20"
                        )}
                        title={`Добавить ${component.name} на холст`}
                        data-testid={`button-add-${component.id}`}
                      >
                        <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
