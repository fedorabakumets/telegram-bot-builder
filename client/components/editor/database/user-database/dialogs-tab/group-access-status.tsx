/**
 * @fileoverview Метка исключённого бота и ручная проверка доступа к группе.
 */

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { GroupSyncStatus } from '../hooks/group-sync-request';

/** Свойства строки состояния группового чата. */
interface GroupAccessStatusProps {
  /** Результат последней проверки доступа. */
  status?: GroupSyncStatus;
  /** Обработчик повторного запроса к Telegram. */
  onCheck: () => void;
}

/**
 * Показывает причину отсутствия данных и отдельную кнопку повторной проверки.
 * @param props - Состояние чата и обработчик проверки
 * @returns Строка состояния или отсутствие элемента для доступного чата
 */
export function GroupAccessStatus({ status, onCheck }: GroupAccessStatusProps) {
  if (!status || status === 'available') return null;
  const checking = status === 'checking';
  const kicked = status === 'kicked';
  const explanation = kicked
    ? 'Бота исключили из чата. Нет доступа к названию и аватарке. История сообщений сохранена.'
    : 'Не удалось проверить доступ к чату. История сообщений сохранена. Можно повторить проверку.';

  return (
    <div className="flex flex-wrap items-center gap-2 pl-16 pr-3 pb-2 text-[11px]">
      {checking ? <span role="status">Проверка доступа…</span> : (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0} className="rounded bg-amber-500/15 px-1.5 py-0.5 text-amber-700 dark:text-amber-300">
                {kicked ? 'Бот исключён' : 'Ошибка проверки'}
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-64">{explanation}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      <button type="button" onClick={onCheck} disabled={checking}
        className="text-primary underline underline-offset-2 disabled:opacity-50">
        Проверить доступ
      </button>
    </div>
  );
}
