/**
 * @fileoverview Переключатель режима отображения карточки бота
 *
 * Позволяет переключаться между режимом «Настройки» (тогглы/селекты)
 * и режимом «Переменные» (таблица key=value как у Railway).
 *
 * @module BotCardViewToggle
 */

import { Settings, Braces } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

/** Режим отображения карточки бота */
export type BotCardViewMode = 'settings' | 'variables';

/** Свойства переключателя режимов */
interface BotCardViewToggleProps {
  /** Текущий режим */
  mode: BotCardViewMode;
  /** Колбэк при смене режима */
  onModeChange: (mode: BotCardViewMode) => void;
}

/**
 * Переключатель режима отображения карточки бота
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BotCardViewToggle({ mode, onModeChange }: BotCardViewToggleProps) {
  return (
    <Tabs
      value={mode}
      onValueChange={(v) => onModeChange(v as BotCardViewMode)}
      className="w-full"
    >
      <TabsList className="h-8 w-full grid grid-cols-2 bg-muted/60">
        <TabsTrigger value="settings" className="h-6 text-xs gap-1.5 px-2">
          <Settings className="h-3.5 w-3.5" />
          <span>Настройки</span>
        </TabsTrigger>
        <TabsTrigger value="variables" className="h-6 text-xs gap-1.5 px-2">
          <Braces className="h-3.5 w-3.5" />
          <span>Переменные</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
