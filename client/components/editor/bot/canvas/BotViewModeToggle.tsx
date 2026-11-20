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
        {/* Общая шапка открывает подписи, когда они помещаются. */}
        <TabsTrigger value="list" className="h-7 gap-1 px-2 text-xs @[920px]:px-2.5" aria-label="Список" title="Список">
          <LayoutList className="h-3.5 w-3.5" />
          <span data-workspace-label="view">Список</span>
        </TabsTrigger>
        <TabsTrigger value="canvas" className="h-7 gap-1 px-2 text-xs @[920px]:px-2.5" aria-label="Холст" title="Холст">
          <Network className="h-3.5 w-3.5" />
          <span data-workspace-label="view">Холст</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
