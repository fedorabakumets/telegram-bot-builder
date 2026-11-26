/**
 * @fileoverview Компонент вкладок страницы сценариев
 * @module client/components/editor/scenariy/components/TemplateTabs
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layers, Sparkles, Flame, Bookmark } from 'lucide-react';
import { cn } from '@/utils/utils';
import { TemplateGrid } from './TemplateGrid';
import type { TemplateTabsProps } from '../types/scenariy-tipy';
import type { BotTemplate } from '@shared/schema';

/** Расширенные пропсы вкладок */
interface TemplateTabsFullProps extends TemplateTabsProps {
  /** Отфильтрованные сценарии */
  templates: BotTemplate[];
  /** Загрузка основного списка */
  isLoading: boolean;
  /** Загрузка рекомендуемых */
  isLoadingFeatured: boolean;
  /** Загрузка моих */
  isLoadingMy: boolean;
  /** Использовать сценарий */
  onUse: (template: BotTemplate) => void;
  /** Удалить сценарий */
  onDelete: (template: BotTemplate) => void;
  /** Режим обучения: вкладки по одной */
  guideMode?: boolean;
  /** Сколько вкладок видно (0–4) */
  visibleTabCount?: number;
  /** Показать сетку карточек */
  showCards?: boolean;
}

/** Активную подборку выделяет среднее начертание текста, а клавиатурный фокус — пунктир. */
const BAZOVYE_KLASSY =
  'gap-1.5 rounded-none transition-colors focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:underline focus-visible:decoration-dotted focus-visible:underline-offset-4 px-2 py-2 text-xs sm:text-sm text-foreground font-normal data-[state=active]:font-medium data-[state=active]:bg-transparent data-[state=active]:shadow-none hover:text-foreground';

/** Вкладки по порядку */
const TAB_ITEMS = [
  { value: 'all', label: 'Все', Icon: Layers, color: 'text-sky-700 dark:text-sky-400' },
  { value: 'featured', label: 'Рекомендуемые', Icon: Sparkles, color: 'text-violet-700 dark:text-violet-400' },
  { value: 'popular', label: 'Популярные', Icon: Flame, color: 'text-orange-700 dark:text-orange-400' },
  { value: 'my', label: 'Мои', Icon: Bookmark, color: 'text-emerald-700 dark:text-emerald-400' },
] as const;

/**
 * Вкладки сценариев
 * @param props - свойства
 * @returns JSX элемент
 */
export function TemplateTabs({
  currentTab,
  onTabChange,
  templates,
  isLoading,
  isLoadingFeatured,
  isLoadingMy,
  onUse,
  onDelete,
  guideMode = false,
  visibleTabCount = 4,
  showCards = true,
}: TemplateTabsFullProps) {
  const count = guideMode ? visibleTabCount : 4;
  const visibleItems = TAB_ITEMS.filter((_, index) => index < count);

  return (
    <Tabs value={currentTab} onValueChange={(v) => onTabChange(v as typeof currentTab)}>
      {visibleItems.length > 0 ? (
        <TabsList
          className={cn(
            'flex w-full min-w-0 flex-nowrap justify-start overflow-x-auto items-stretch gap-1',
            'bg-transparent p-0 h-auto rounded-none',
            '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          )}
        >
          {visibleItems.map(({ value, label, Icon, color }) => (
            <TabsTrigger
              key={value}
              value={value}
              className={cn(
                BAZOVYE_KLASSY,
                visibleItems.length === 1
                  ? 'w-full'
                  : 'shrink-0 sm:flex-1',
                guideMode && 'animate-in fade-in duration-300',
              )}
            >
              <Icon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0", color)} />
              <span>{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      ) : null}

      <TabsContent value="all" className="mt-4">
        <TemplateGrid
          templates={templates}
          isLoading={isLoading}
          onUse={onUse}
          showDelete={false}
          onDelete={onDelete}
          staggerReveal={guideMode}
          reveal={showCards}
        />
      </TabsContent>
      <TabsContent value="featured" className="mt-4">
        <TemplateGrid
          templates={templates}
          isLoading={isLoadingFeatured}
          onUse={onUse}
          showDelete={false}
          onDelete={onDelete}
          staggerReveal={guideMode}
          reveal={showCards}
        />
      </TabsContent>
      <TabsContent value="popular" className="mt-4">
        <TemplateGrid
          templates={templates}
          isLoading={isLoading}
          onUse={onUse}
          showDelete={false}
          onDelete={onDelete}
          staggerReveal={guideMode}
          reveal={showCards}
        />
      </TabsContent>
      <TabsContent value="my" className="mt-4">
        <TemplateGrid
          templates={templates}
          isLoading={isLoadingMy}
          onUse={onUse}
          showDelete={true}
          onDelete={onDelete}
          staggerReveal={guideMode}
          reveal={showCards}
        />
      </TabsContent>
    </Tabs>
  );
}
