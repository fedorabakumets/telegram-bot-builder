/**
 * @fileoverview Пресеты команд в палитре сайдбара
 * @module components/editor/sidebar/components/palette-command-presets
 */

import { cn } from '@/utils/utils';
import type { CommandPreset } from '../massive/commands';
import { PaletteCategoryHeader } from './palette-category-header';

/** Пропсы секции пресетов */
export interface CommandPresetsSectionProps {
  /** Пресеты */
  presets: CommandPreset[];
  /** Свёрнута ли */
  collapsed: boolean;
  /** Переключить */
  onToggle: () => void;
}

/**
 * Подкатегория пресетов команд
 * @param props - Свойства
 * @returns JSX элемент
 */
export function CommandPresetsSection({ presets, collapsed, onToggle }: CommandPresetsSectionProps) {
  return (
    <div>
      <PaletteCategoryHeader
        title="Команды"
        description="Готовые пары команда + сообщение"
        count={presets.length}
        collapsed={collapsed}
        onToggle={onToggle}
        variant="sub"
        testId="category-Команды"
      />
      {!collapsed && (
        <div className="space-y-1.5 sm:space-y-2 mt-2 sm:mt-3">
          {presets.map((preset) => (
            <CommandPresetCard key={preset.id} preset={preset} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Пропсы карточки пресета */
interface CommandPresetCardProps {
  /** Пресет */
  preset: CommandPreset;
}

/**
 * Карточка пресета команды
 * @param props - Свойства
 * @returns JSX элемент
 */
export function CommandPresetCard({ preset }: CommandPresetCardProps) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('application/command-preset', JSON.stringify(preset));
        e.dataTransfer.setData('text/plain', 'command_preset');
      }}
      className={cn(
        'component-item group/item flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3',
        'bg-gradient-to-br from-muted/40 to-muted/20 dark:from-slate-800/50 dark:to-slate-900/30',
        'hover:from-muted/70 hover:to-muted/40 dark:hover:from-slate-700/60 dark:hover:to-slate-800/40',
        'rounded-lg sm:rounded-xl cursor-move transition-all duration-200 touch-action-none no-select',
        'border border-border/30 hover:border-primary/30',
      )}
      data-testid={`command-preset-${preset.id}`}
    >
      <div
        className={cn(
          'w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0',
          'transition-transform group-hover/item:scale-110',
          preset.color,
        )}
      >
        <i className={`${preset.icon} text-xs sm:text-sm`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm font-semibold text-foreground break-words whitespace-normal">
          {preset.name}
        </p>
        {preset.description ? (
          <p className="text-xs text-muted-foreground leading-snug break-words whitespace-normal mt-0.5">
            {preset.description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
