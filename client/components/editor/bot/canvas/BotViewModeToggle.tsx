/**
 * @fileoverview Переключатель Список / Холст для вкладки «Бот»
 * @module bot/canvas/BotViewModeToggle
 */

import { LayoutList, Network } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { BotViewMode } from './use-bot-view-mode';

/** Пропсы переключателя вида */
interface BotViewModeToggleProps {
  /** Текущий режим */
  mode: BotViewMode;
  /** Смена режима */
  onModeChange: (mode: BotViewMode) => void;
}

/**
 * Сегмент Список | Холст в шапке панели ботов
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BotViewModeToggle({ mode, onModeChange }: BotViewModeToggleProps) {
  return (
    <Tabs
      value={mode}
      onValueChange={(v) => onModeChange(v as BotViewMode)}
      className="w-auto flex-shrink-0"
    >
      <TabsList className="h-7 sm:h-8 grid grid-cols-2 bg-muted/60 p-0.5">
        <TabsTrigger value="list" className="h-6 text-xs gap-1 px-2 sm:px-2.5" aria-label="Список">
          <LayoutList className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Список</span>
        </TabsTrigger>
        <TabsTrigger value="canvas" className="h-6 text-xs gap-1 px-2 sm:px-2.5" aria-label="Холст">
          <Network className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Холст</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
