/**
 * @fileoverview Компонент вкладок страницы сценариев: все / рекомендуемые / популярные / мои
 * @module client/components/editor/scenariy/components/TemplateTabs
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layers, Sparkles, Flame, Bookmark } from 'lucide-react';
import { TemplateGrid } from './TemplateGrid';
import type { TemplateTabsProps } from '../types/scenariy-tipy';
import type { BotTemplate } from '@shared/schema';

/**
 * Расширенные пропсы вкладок с данными для каждой вкладки
 */
interface TemplateTabsFullProps extends TemplateTabsProps {
  /** Отфильтрованные и отсортированные сценарии */
  templates: BotTemplate[];
  /** Флаг загрузки основного списка */
  isLoading: boolean;
  /** Флаг загрузки рекомендуемых */
  isLoadingFeatured: boolean;
  /** Флаг загрузки моих */
  isLoadingMy: boolean;
  /** Обработчик использования сценария */
  onUse: (template: BotTemplate) => void;
  /** Обработчик удаления сценария */
  onDelete: (template: BotTemplate) => void;
}

/** CSS-классы для активной вкладки по цвету */
const AKTIVNYE_KLASSY: Record<string, string> = {
  all:      'data-[state=active]:from-blue-500/20 data-[state=active]:to-cyan-500/20 data-[state=active]:border-blue-500/40 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-300',
  featured: 'data-[state=active]:from-amber-500/20 data-[state=active]:to-yellow-500/20 data-[state=active]:border-amber-500/40 data-[state=active]:text-amber-700 dark:data-[state=active]:text-amber-300',
  popular:  'data-[state=active]:from-red-500/20 data-[state=active]:to-orange-500/20 data-[state=active]:border-red-500/40 data-[state=active]:text-red-700 dark:data-[state=active]:text-red-300',
  my:       'data-[state=active]:from-purple-500/20 data-[state=active]:to-pink-500/20 data-[state=active]:border-purple-500/40 data-[state=active]:text-purple-700 dark:data-[state=active]:text-purple-300',
};

const BAZOVYE_KLASSY = 'flex items-center justify-center xs:justify-start gap-1.5 xs:gap-2 px-2 xs:px-3 py-2 xs:py-2.5 text-xs xs:text-sm font-semibold rounded-lg transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:border hover:bg-muted/60 active:scale-95';

/**
 * Вкладки страницы сценариев с контентом каждой вкладки
 * @param props - свойства компонента
 * @returns JSX элемент вкладок
 */
export function TemplateTabs({ currentTab, onTabChange, templates, isLoading, isLoadingFeatured, isLoadingMy, onUse, onDelete }: TemplateTabsFullProps) {
  return (
    <Tabs value={currentTab} onValueChange={(v) => onTabChange(v as typeof currentTab)}>
      <TabsList className="grid grid-cols-4 gap-1.5 xs:gap-2 bg-background/50 dark:bg-background/30 p-1.5 xs:p-2 h-auto rounded-xl border border-border/40 backdrop-blur-sm hover:border-border/60 transition-all">
        <TabsTrigger value="all" className={`${BAZOVYE_KLASSY} ${AKTIVNYE_KLASSY.all}`}>
          <Layers className="h-3.5 xs:h-4 w-3.5 xs:w-4 flex-shrink-0" /><span>Все</span>
        </TabsTrigger>
        <TabsTrigger value="featured" className={`${BAZOVYE_KLASSY} ${AKTIVNYE_KLASSY.featured}`}>
          <Sparkles className="h-3.5 xs:h-4 w-3.5 xs:w-4 flex-shrink-0" /><span>Рекомендуемые</span>
        </TabsTrigger>
        <TabsTrigger value="popular" className={`${BAZOVYE_KLASSY} ${AKTIVNYE_KLASSY.popular}`}>
          <Flame className="h-3.5 xs:h-4 w-3.5 xs:w-4 flex-shrink-0" /><span>Популярные</span>
        </TabsTrigger>
        <TabsTrigger value="my" className={`${BAZOVYE_KLASSY} ${AKTIVNYE_KLASSY.my}`}>
          <Bookmark className="h-3.5 xs:h-4 w-3.5 xs:w-4 flex-shrink-0" /><span>Мои</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="all" className="mt-4">
        <TemplateGrid templates={templates} isLoading={isLoading} onUse={onUse} showDelete={false} onDelete={onDelete} />
      </TabsContent>
      <TabsContent value="featured" className="mt-4">
        <TemplateGrid templates={templates} isLoading={isLoadingFeatured} onUse={onUse} showDelete={false} onDelete={onDelete} />
      </TabsContent>
      <TabsContent value="popular" className="mt-4">
        <TemplateGrid templates={templates} isLoading={isLoading} onUse={onUse} showDelete={false} onDelete={onDelete} />
      </TabsContent>
      <TabsContent value="my" className="mt-4">
        <TemplateGrid templates={templates} isLoading={isLoadingMy} onUse={onUse} showDelete={true} onDelete={onDelete} />
      </TabsContent>
    </Tabs>
  );
}
