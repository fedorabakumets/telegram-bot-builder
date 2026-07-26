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
      <TabsList className="grid h-8 grid-cols-2 bg-muted/60 p-0.5">
        <TabsTrigger value="list" className="h-7 gap-1 px-2 text-xs @[560px]:px-2.5" aria-label="Список">
          <LayoutList className="h-3.5 w-3.5" />
          <span className="hidden @[560px]:inline">Список</span>
        </TabsTrigger>
        <TabsTrigger value="canvas" className="h-7 gap-1 px-2 text-xs @[560px]:px-2.5" aria-label="Холст">
          <Network className="h-3.5 w-3.5" />
          <span className="hidden @[560px]:inline">Холст</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
