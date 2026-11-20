/** @fileoverview Переключатель между ботами и аккаунтами в общей рабочей области. */

import { Bot, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/utils';

/** Разделы рабочей области ботов. */
export type BotWorkspaceMode = 'bots' | 'accounts';

/** Свойства переключателя разделов. */
interface BotWorkspaceModeSwitchProps {
  /** Текущий раздел. */
  mode: BotWorkspaceMode;
  /** Выбирает новый раздел. */
  onModeChange: (mode: BotWorkspaceMode) => void;
  /** Дополнительные классы для размещения в шапке. */
  className?: string;
}

/** Подписи и значки доступных разделов. */
const sections = [
  { id: 'bots', label: 'Боты', Icon: Bot },
  { id: 'accounts', label: 'Аккаунты', Icon: Users },
] as const;

/**
 * Выделяет выбранный режим синим акцентом и передаёт подписи адаптивной шапке.
 * @param props - Выбранный раздел и обработчик переключения.
 * @returns Переключатель режимов рабочей области.
 */
export function BotWorkspaceModeSwitch({ mode, onModeChange, className }: BotWorkspaceModeSwitchProps) {
  return (
    <div
      role="group"
      aria-label="Раздел вкладки „Боты“"
      className={cn('inline-flex h-8 shrink-0 items-center rounded-md border border-border bg-background p-0.5', className)}
    >
      {sections.map(({ id, label, Icon }) => (
        <Button
          key={id}
          type="button"
          variant="ghost"
          size="sm"
          aria-label={label}
          aria-pressed={mode === id}
          title={label}
          onClick={() => { if (mode !== id) onModeChange(id); }}
          className="h-7 gap-1 rounded-sm px-2 text-xs text-muted-foreground hover:text-foreground aria-pressed:bg-primary/15 aria-pressed:text-primary"
        >
          <Icon className="size-3.5" aria-hidden="true" />
          <span data-workspace-label="bot-section">{label}</span>
        </Button>
      ))}
    </div>
  );
}
