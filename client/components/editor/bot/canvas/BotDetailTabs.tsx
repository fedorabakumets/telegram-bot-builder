/**
 * @fileoverview Горизонтальные вкладки detail-панели бота
 * @module bot/canvas/BotDetailTabs
 */

import { History, Settings, Braces, Terminal } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { BotDetailTabId } from './bot-detail-tab-context';

/** Описание вкладки */
const TABS: Array<{ id: BotDetailTabId; label: string; icon: typeof History }> = [
  { id: 'history', label: 'История', icon: History },
  { id: 'settings', label: 'Настройки', icon: Settings },
  { id: 'variables', label: 'Переменные', icon: Braces },
  { id: 'terminal', label: 'Терминал', icon: Terminal },
];

/** Пропсы вкладок */
interface BotDetailTabsProps {
  /** Активная вкладка */
  value: BotDetailTabId;
  /** Смена вкладки */
  onChange: (tab: BotDetailTabId) => void;
}

/**
 * Вкладки История / Настройки / Переменные / Терминал
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BotDetailTabs({ value, onChange }: BotDetailTabsProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as BotDetailTabId)} className="w-full">
      <TabsList className="h-9 w-full grid grid-cols-4 bg-muted/50 p-0.5">
        {TABS.map(({ id, label, icon: Icon }) => (
          <TabsTrigger key={id} value={id} className="h-8 text-[11px] sm:text-xs gap-1 px-1">
            <Icon className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate hidden xs:inline sm:inline">{label}</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
