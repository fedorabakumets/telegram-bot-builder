/**
 * @fileoverview Поля для кнопки запроса управляемого бота (Bot API 9.6)
 *
 * Показывает инпуты suggestedBotName и suggestedBotUsername только когда
 * action === 'request_managed_bot' и keyboardType === 'reply'.
 * @module client/components/editor/properties/components/button-card/button-request-managed-bot-fields
 */

import { Input } from '@/components/ui/input';
import type { Button } from '@shared/schema';

/** Пропсы компонента полей управляемого бота */
interface ButtonRequestManagedBotFieldsProps {
  /** ID узла */
  nodeId: string;
  /** Объект кнопки */
  button: Button;
  /** Функция обновления кнопки */
  onButtonUpdate: (nodeId: string, buttonId: string, updates: Partial<Button>) => void;
  /** Тип клавиатуры */
  keyboardType?: string;
}

/**
 * Поля ввода для кнопки запроса управляемого бота.
 * Отображается только при action === 'request_managed_bot' и keyboardType === 'reply'.
 *
 * @param props - Свойства компонента
 * @returns JSX элемент или null
 */
export function ButtonRequestManagedBotFields({
  nodeId,
  button,
  onButtonUpdate,
  keyboardType,
}: ButtonRequestManagedBotFieldsProps) {
  if (button.action !== 'request_managed_bot' || keyboardType !== 'reply') return null;

  return (
    <div className="space-y-2">
      {/* Предложенное имя бота */}
      <div className="space-y-1">
        <span className="text-xs text-indigo-700 dark:text-indigo-300 font-medium">
          Предложенное имя бота
        </span>
        <Input
          value={(button as any).suggestedBotName || ''}
          onChange={(e) =>
            onButtonUpdate(nodeId, button.id, { suggestedBotName: e.target.value || undefined } as any)
          }
          className="text-xs sm:text-sm bg-white/60 dark:bg-slate-950/60 border border-blue-300/40 dark:border-blue-700/40 text-blue-900 dark:text-blue-50 placeholder:text-blue-500/50 dark:placeholder:text-blue-400/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400/30 rounded-lg"
          placeholder="Мой бот"
        />
      </div>

      {/* Предложенный username бота */}
      <div className="space-y-1">
        <span className="text-xs text-indigo-700 dark:text-indigo-300 font-medium">
          Предложенный username
        </span>
        <Input
          value={(button as any).suggestedBotUsername || ''}
          onChange={(e) =>
            onButtonUpdate(nodeId, button.id, { suggestedBotUsername: e.target.value || undefined } as any)
          }
          className="text-xs sm:text-sm bg-white/60 dark:bg-slate-950/60 border border-blue-300/40 dark:border-blue-700/40 text-blue-900 dark:text-blue-50 placeholder:text-blue-500/50 dark:placeholder:text-blue-400/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400/30 rounded-lg"
          placeholder="my_bot"
        />
      </div>
    </div>
  );
}
