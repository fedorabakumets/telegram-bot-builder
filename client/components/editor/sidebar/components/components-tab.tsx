/**
 * @fileoverview Вкладка компонентов: иерархия + липкий контекст «главная › под»
 * @module components/editor/sidebar/components/components-tab
 */

import { useRef, useState } from 'react';
import { ComponentDefinition } from '@shared/schema';
import type { CommandPreset } from '../massive/commands';
import type { PaletteMainCategory } from '../constants';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useComponentsFilter } from './use-components-filter';
import { PaletteCategoryHeader } from './palette-category-header';
import { PaletteComponentCard } from './palette-component-card';
import { PaletteContextBar } from './palette-context-bar';
import { paletteSubCollapseKey } from './palette-collapse-key';
import { CommandPresetCard, CommandPresetsSection } from './palette-command-presets';
import { usePaletteScrollContext } from './use-palette-scroll-context';

/** Заголовок секции пресетов команд внутри Bot API */
const COMMANDS_TITLE = 'Команды';

/** Пропсы вкладки компонентов */
export interface ComponentsTabProps {
  /** Главные категории палитры */
  categories: PaletteMainCategory[];
  /** Пресеты команд */
  commandPresets?: CommandPreset[];
  /** Свёрнутые секции */
  collapsedCategories: Set<string>;
  /** Touch-состояние */
  touchState: {
    /** Компонент под пальцем */
    touchedComponent: ComponentDefinition | null;
    /** Идёт ли drag */
    isDragging: boolean;
  };
  /** Переключить секцию */
  onToggleCategory: (categoryTitle: string) => void;
  /** Touch start */
  onTouchStart: (e: React.TouchEvent, component: ComponentDefinition) => void;
  /** Touch move */
  onTouchMove: (e: React.TouchEvent) => void;
  /** Touch end */
  onTouchEnd: (e: React.TouchEvent) => void;
  /** Начало drag */
  onComponentDrag: (component: ComponentDefinition) => void;
  /** Добавить на холст */
  onComponentAdd?: (component: ComponentDefinition) => void;
}

/**
 * Вкладка компонентов с иерархией категорий
 * @param props - Свойства
 * @returns JSX элемент
 */
export function ComponentsTab({
  categories,
  commandPresets,
  collapsedCategories,
  touchState,
  onToggleCategory,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onComponentDrag,
  onComponentAdd,
}: ComponentsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const filtered = useComponentsFilter(categories, commandPresets, searchQuery);
  const listRef = useRef<HTMLDivElement>(null);
  const scrollCtx = usePaletteScrollContext(listRef, !filtered);

  /**
   * Старт HTML5 drag для компонента
   * @param e - Событие
   * @param component - Компонент
   */
  const handleDragStart = (e: React.DragEvent, component: ComponentDefinition) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/json', JSON.stringify(component));
    e.dataTransfer.setData('text/plain', component.type);
    onComponentDrag(component);
  };

  return (
    <div className="px-2 pb-2 pt-3 space-y-2 sm:space-y-3">
      <div className="relative mb-2">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск компонентов..."
          className="h-8 text-xs pl-8 pr-2"
        />
      </div>

      {filtered && !filtered.hasResults && (
        <p className="text-xs text-muted-foreground text-center py-4">Ничего не найдено</p>
      )}

      {filtered && filtered.hasResults && (
        <div className="space-y-1.5 sm:space-y-2">
          {filtered.components.map((component) => (
            <PaletteComponentCard
              key={component.id}
              component={component}
              isTouchDragging={
                touchState.touchedComponent?.id === component.id && touchState.isDragging
              }
              onDragStart={handleDragStart}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              onComponentAdd={onComponentAdd}
            />
          ))}
          {filtered.presets.map((preset) => (
            <CommandPresetCard key={preset.id} preset={preset} />
          ))}
        </div>
      )}

      {!filtered && (
        <>
          <PaletteContextBar
            context={scrollCtx}
            mainCollapsed={collapsedCategories.has(scrollCtx?.main ?? '')}
            subCollapsed={
              !!scrollCtx?.main
              && !!scrollCtx.sub
              && collapsedCategories.has(paletteSubCollapseKey(scrollCtx.main, scrollCtx.sub))
            }
            onToggleMain={() => {
              if (scrollCtx?.main) onToggleCategory(scrollCtx.main);
            }}
            onToggleSub={() => {
              if (!scrollCtx?.main || !scrollCtx.sub) return;
              onToggleCategory(paletteSubCollapseKey(scrollCtx.main, scrollCtx.sub));
            }}
          />
          <div ref={listRef} className="space-y-2 sm:space-y-3">
            {categories.map((main) => {
              const mainCount = main.subcategories.reduce((n, s) => n + s.components.length, 0)
                + (main.title === 'Telegram Bot API' && commandPresets ? commandPresets.length : 0);
              const mainCollapsed = collapsedCategories.has(main.title);

              return (
                <div key={main.title} className="space-y-1.5">
                  <div
                    data-palette-section
                    data-palette-main={main.title}
                    data-palette-sub=""
                    data-palette-icon={main.icon}
                  >
                    <PaletteCategoryHeader
                      title={main.title}
                      description={main.description}
                      count={mainCount}
                      collapsed={mainCollapsed}
                      onToggle={() => onToggleCategory(main.title)}
                      variant="main"
                      icon={main.icon}
                      testId={`category-${main.title}`}
                    />
                  </div>
                  {!mainCollapsed && (
                    <div className="space-y-2 pl-1 sm:pl-2">
                      {main.subcategories.map((sub) => {
                        const subKey = paletteSubCollapseKey(main.title, sub.title);
                        const subCollapsed = collapsedCategories.has(subKey);
                        return (
                          <div
                            key={subKey}
                            data-palette-section
                            data-palette-main={main.title}
                            data-palette-sub={sub.title}
                            data-palette-icon={main.icon}
                          >
                            <PaletteCategoryHeader
                              title={sub.title}
                              description={sub.description}
                              count={sub.components.length}
                              collapsed={subCollapsed}
                              onToggle={() => onToggleCategory(subKey)}
                              variant="sub"
                              testId={`category-${subKey}`}
                            />
                            {!subCollapsed && (
                              <div className="space-y-1.5 sm:space-y-2 mt-2 sm:mt-3">
                                {sub.components.map((component) => (
                                  <PaletteComponentCard
                                    key={component.id}
                                    component={component}
                                    isTouchDragging={
                                      touchState.touchedComponent?.id === component.id
                                      && touchState.isDragging
                                    }
                                    onDragStart={handleDragStart}
                                    onTouchStart={onTouchStart}
                                    onTouchMove={onTouchMove}
                                    onTouchEnd={onTouchEnd}
                                    onComponentAdd={onComponentAdd}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {main.title === 'Telegram Bot API'
                        && commandPresets
                        && commandPresets.length > 0 && (
                        <div
                          data-palette-section
                          data-palette-main={main.title}
                          data-palette-sub={COMMANDS_TITLE}
                          data-palette-icon={main.icon}
                        >
                          <CommandPresetsSection
                            presets={commandPresets}
                            collapsed={collapsedCategories.has(
                              paletteSubCollapseKey(main.title, COMMANDS_TITLE),
                            )}
                            onToggle={() =>
                              onToggleCategory(paletteSubCollapseKey(main.title, COMMANDS_TITLE))
                            }
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
