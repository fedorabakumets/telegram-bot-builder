/**
 * @fileoverview Шапка detail-панели бота в стиле Railway
 * @module bot/canvas/BotDetailHeader
 */

import { Play, Square, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BotAvatar } from '../card/BotAvatar';
import type { BotToken } from '@shared/schema';

/** Пропсы шапки detail-панели */
interface BotDetailHeaderProps {
  /** Токен бота */
  token: BotToken;
  /** ID проекта */
  projectId: number;
  /** Заголовок */
  title: string;
  /** Бот запущен */
  isRunning: boolean;
  /** Старт/стоп в процессе */
  controlPending: boolean;
  /** Удаление в процессе */
  deletePending: boolean;
  /** Запустить / остановить */
  onToggleRun: () => void;
  /** Удалить бота */
  onDelete: () => void;
  /** Закрыть панель */
  onClose: () => void;
}

/** Классы кнопки в группе действий */
const ACTION_BTN =
  'h-8 w-8 rounded-none first:rounded-l-md last:rounded-r-md text-muted-foreground hover:text-foreground';

/**
 * Шапка: аватар, имя, бейдж статуса, группа действий
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BotDetailHeader({
  token,
  projectId,
  title,
  isRunning,
  controlPending,
  deletePending,
  onToggleRun,
  onDelete,
  onClose,
}: BotDetailHeaderProps) {
  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3.5 shrink-0">
      <div className="overflow-hidden rounded-lg ring-1 ring-border/60 shrink-0">
        <BotAvatar
          tokenId={token.id}
          projectId={projectId}
          photoUrl={token.botPhotoUrl}
          botName={title}
          size={40}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="truncate text-[15px] font-semibold leading-tight tracking-tight">
            {title}
          </h2>
          <span
            className={[
              'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5',
              'text-[10px] font-medium uppercase tracking-wide',
              isRunning
                ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'border-border bg-muted/50 text-muted-foreground',
            ].join(' ')}
          >
            <span
              className={[
                'h-1.5 w-1.5 rounded-full',
                isRunning ? 'bg-emerald-500' : 'bg-muted-foreground/50',
              ].join(' ')}
            />
            {isRunning ? 'Онлайн' : 'Офлайн'}
          </span>
        </div>
        {token.botUsername ? (
          <a
            href={`https://t.me/${token.botUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 block truncate text-xs text-muted-foreground transition-colors hover:text-foreground hover:underline"
            title="Открыть бота в Telegram"
          >
            @{token.botUsername}
          </a>
        ) : (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">Telegram Bot</p>
        )}
      </div>
      <div className="flex shrink-0 items-center divide-x divide-border/60 overflow-hidden rounded-md border border-border/60 bg-card">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className={ACTION_BTN}
          disabled={controlPending}
          onClick={onToggleRun}
          aria-label={isRunning ? 'Остановить' : 'Запустить'}
        >
          {isRunning ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className={`${ACTION_BTN} hover:text-destructive`}
          disabled={deletePending}
          onClick={onDelete}
          aria-label="Удалить"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className={ACTION_BTN}
          onClick={onClose}
          aria-label="Закрыть"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
