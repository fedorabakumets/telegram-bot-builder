/** @fileoverview Метка потери доступа бота и ручная проверка любого чата. */

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { GroupAccessData } from '../hooks/group-sync-request';
import { statusAppearance } from '@shared/status-appearance';

/** Свойства строки состояния группового чата. */
interface GroupAccessStatusProps {
  /** Результат последней проверки доступа. */
  status?: GroupAccessData['status'];
  /** Обработчик повторного запроса к Telegram. */
  onCheck?: () => void;
  /** Тип чата для точной формулировки причины. */
  chatType?: string;
  /** Подтверждённая проблема самого бота важнее старого результата проверки чата. */
  botAvailability?: string | null;
}

/**
 * Показывает причину отсутствия данных и отдельную кнопку повторной проверки.
 * @param props - Состояние чата и обработчик проверки
 * @returns Строка состояния или отсутствие элемента для доступного чата
 */
export function GroupAccessStatus({ status, onCheck, chatType, botAvailability }: GroupAccessStatusProps) {
  if (!botAvailability && (!status || status === 'available' || status === 'unknown')) return null;
  const checking = status === 'checking';
  const kicked = status === 'kicked';
  const privateChat = chatType === 'private';
  /** Подпись и оформление переиспользуют общий справочник статусов. */
  const label = botAvailability || (kicked ? (privateChat ? 'Пользователь заблокировал бота' : 'Бот исключён') : 'Не удалось проверить чат');
  const explanation = botAvailability ? `${botAvailability}. Проверка доступа к чату и отправка сообщений могут быть недоступны. Сохранённая история сообщений доступна.` : kicked
    ? privateChat
      ? 'Пользователь заблокировал бота. Сохранённая история сообщений доступна.'
      : 'Бота исключили из чата. Нет доступа к названию и аватарке. История сообщений сохранена.'
    : 'Не удалось проверить доступ к чату. История сообщений сохранена. Можно повторить проверку.';

  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px]">
      {checking ? <span role="status">Проверка доступа…</span> : (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0} style={statusAppearance(label)} className="rounded px-1.5 py-0.5">
                {label}
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-64">{explanation}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      {onCheck && <button type="button" onClick={onCheck} disabled={checking}
        className="text-primary underline underline-offset-2 disabled:opacity-50">
        Проверить доступ
      </button>}
    </div>
  );
}
