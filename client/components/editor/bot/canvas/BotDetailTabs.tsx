/**
 * @fileoverview Горизонтальные вкладки detail-панели в стиле Railway
 * @module bot/canvas/BotDetailTabs
 */

import { History, Settings, Users, Braces, Terminal } from 'lucide-react';
import type { BotDetailTabId } from './bot-detail-tab-context';

/** Описание вкладки */
const TABS: Array<{ id: BotDetailTabId; label: string; icon: typeof History }> = [
  { id: 'history', label: 'История', icon: History },
  { id: 'settings', label: 'Настройки', icon: Settings },
  { id: 'variables', label: 'Переменные', icon: Braces },
  { id: 'terminal', label: 'Терминал', icon: Terminal },
  { id: 'collaborators', label: 'Коллабораторы', icon: Users },
];

/** Пропсы вкладок */
interface BotDetailTabsProps {
  /** Активная вкладка */
  value: BotDetailTabId;
  /** Смена вкладки */
  onChange: (tab: BotDetailTabId) => void;
}

/**
 * Underline-вкладки: липкая полоса, hover-подложка, индикатор активной
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BotDetailTabs({ value, onChange }: BotDetailTabsProps) {
  return (
    <div className="@container sticky top-0 z-10 shrink-0 border-b border-border/60 bg-background/95 backdrop-blur">
      <nav className="flex gap-1 px-4 overflow-x-auto" role="tablist" aria-label="Разделы бота">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = value === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(id)}
              className={[
                'group relative flex h-10 items-center gap-1.5 px-3',
                'text-xs font-medium whitespace-nowrap transition-colors',
                'outline-none focus-visible:bg-muted/50',
                active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
              ].join(' ')}
            >
              <Icon
                className={[
                  'hidden h-3.5 w-3.5 shrink-0 @[320px]:block',
                  active ? 'opacity-100' : 'opacity-50 group-hover:opacity-80',
                ].join(' ')}
              />
              <span>{label}</span>
              <span
                aria-hidden
                className={[
                  'absolute inset-x-2 -bottom-px h-0.5 rounded-full transition-colors',
                  active ? 'bg-blue-500' : 'bg-transparent',
                ].join(' ')}
              />
            </button>
          );
        })}
      </nav>
    </div>
  );
}
