/** @fileoverview Карточка проекта на холсте ботов. */
import { Folder, Settings } from 'lucide-react';
import type { LaunchMode } from '../card/bot-launch-helpers';

/** Свойства карточки проекта. */
interface BotProjectNodeProps {
  /** Название проекта. */
  name: string;
  /** Количество подключённых ботов. */
  botCount: number;
  /** Режим получения обновлений по умолчанию. */
  launchMode?: LaunchMode;
  /** Открыта ли панель проекта. */
  selected: boolean;
  /** Открывает панель проекта. */
  onSelect: () => void;
  /** Положение над центром группы карточек. */
  left?: number;
}

/**
 * Показывает проект над карточками его ботов.
 * @param props - Свойства карточки.
 * @returns Кнопка открытия настроек проекта.
 */
export function BotProjectNode({ name, botCount, launchMode, selected, onSelect, left = 48 }: BotProjectNodeProps) {
  return (
    <button
      type="button"
      data-canvas-node="true"
      data-bot-project-node="true"
      aria-pressed={selected}
      aria-label={`Настройки ботов проекта «${name}»`}
      onClick={onSelect}
      style={{ left }}
      className={[
        'absolute top-12 flex w-[240px] items-center gap-3 rounded-xl border bg-card p-3 text-left shadow-sm',
        'hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        selected ? 'border-primary/70 ring-1 ring-primary/30' : 'border-border',
      ].join(' ')}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Folder className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold" title={name}>{name}</span>
        <span className="block text-xs text-muted-foreground">
          Боты проекта · {botCount}{launchMode && (launchMode === 'webhook' ? ' · Webhook' : ' · Polling')}
        </span>
      </span>
      <Settings className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </button>
  );
}
