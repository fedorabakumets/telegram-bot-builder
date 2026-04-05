/**
 * @fileoverview Тогглы запроса контакта и геолокации для reply кнопок
 * @module client/components/editor/properties/components/button-card/button-request-toggles
 */

import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { Button } from '@shared/schema';

/** Пропсы компонента тогглов запроса */
interface ButtonRequestTogglesProps {
  /** Объект кнопки */
  button: Button;
  /** Функция обновления кнопки */
  onButtonUpdate: (nodeId: string, buttonId: string, updates: Partial<Button>) => void;
  /** ID узла */
  nodeId: string;
  /** Тип клавиатуры */
  keyboardType?: string;
}

/**
 * Тогглы запроса контакта и геолокации для reply кнопок.
 * Поля взаимоисключающие: включение одного выключает другое.
 * При включении меняет action кнопки на 'contact' или 'location'.
 *
 * @param props - Свойства компонента
 * @returns JSX элемент или null если тип клавиатуры не reply
 */
export function ButtonRequestToggles({
  button,
  onButtonUpdate,
  nodeId,
  keyboardType,
}: ButtonRequestTogglesProps) {
  if (keyboardType !== 'reply') return null;

  /** Обработчик переключения запроса контакта */
  const handleContactToggle = (checked: boolean) => {
    onButtonUpdate(nodeId, button.id, {
      requestContact: checked,
      requestLocation: false,
      action: checked ? 'contact' : 'default',
    });
  };

  /** Обработчик переключения запроса геолокации */
  const handleLocationToggle = (checked: boolean) => {
    onButtonUpdate(nodeId, button.id, {
      requestLocation: checked,
      requestContact: false,
      action: checked ? 'location' : 'default',
    });
  };

  /** Обработчик переключения запроса управляемого бота */
  const handleManagedBotToggle = (checked: boolean) => {
    onButtonUpdate(nodeId, button.id, {
      requestContact: false,
      requestLocation: false,
      action: checked ? 'request_managed_bot' : 'default',
    });
  };

  return (
    <div className="space-y-2">
      {/* Запрос контакта */}
      <div className="space-y-2.5 sm:space-y-3 p-2.5 sm:p-3 rounded-lg bg-gradient-to-br from-green-50/40 to-emerald-50/30 dark:from-green-950/20 dark:to-emerald-950/10 border border-green-200/40 dark:border-green-800/30 hover:border-green-300/60 dark:hover:border-green-700/60 hover:bg-green-50/60 dark:hover:bg-green-950/30 transition-all duration-200 group">
        <div className="flex items-center gap-2.5 sm:gap-3 justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
            <div className="w-6 sm:w-7 h-6 sm:h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-green-200/50 dark:bg-green-900/40 group-hover:bg-green-300/50 dark:group-hover:bg-green-800/50 transition-all text-sm">
              📞
            </div>
            <Label className="text-xs sm:text-sm font-semibold text-green-900 dark:text-green-100 cursor-pointer">
              Запросить контакт
            </Label>
          </div>
          <Switch
            checked={button.requestContact ?? false}
            onCheckedChange={handleContactToggle}
          />
        </div>
      </div>

      {/* Запрос геолокации */}
      <div className="space-y-2.5 sm:space-y-3 p-2.5 sm:p-3 rounded-lg bg-gradient-to-br from-blue-50/40 to-sky-50/30 dark:from-blue-950/20 dark:to-sky-950/10 border border-blue-200/40 dark:border-blue-800/30 hover:border-blue-300/60 dark:hover:border-blue-700/60 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 transition-all duration-200 group">
        <div className="flex items-center gap-2.5 sm:gap-3 justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
            <div className="w-6 sm:w-7 h-6 sm:h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-200/50 dark:bg-blue-900/40 group-hover:bg-blue-300/50 dark:group-hover:bg-blue-800/50 transition-all text-sm">
              📍
            </div>
            <Label className="text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-100 cursor-pointer">
              Запросить геолокацию
            </Label>
          </div>
          <Switch
            checked={button.requestLocation ?? false}
            onCheckedChange={handleLocationToggle}
          />
        </div>
      </div>

      {/* Запрос управляемого бота (Bot API 9.6) */}
      <div className="space-y-2.5 sm:space-y-3 p-2.5 sm:p-3 rounded-lg bg-gradient-to-br from-indigo-50/40 to-violet-50/30 dark:from-indigo-950/20 dark:to-violet-950/10 border border-indigo-200/40 dark:border-indigo-800/30 hover:border-indigo-300/60 dark:hover:border-indigo-700/60 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/30 transition-all duration-200 group">
        <div className="flex items-center gap-2.5 sm:gap-3 justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
            <div className="w-6 sm:w-7 h-6 sm:h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-indigo-200/50 dark:bg-indigo-900/40 group-hover:bg-indigo-300/50 dark:group-hover:bg-indigo-800/50 transition-all text-sm">
              🤖
            </div>
            <Label className="text-xs sm:text-sm font-semibold text-indigo-900 dark:text-indigo-100 cursor-pointer">
              Запросить управляемого бота
            </Label>
          </div>
          <Switch
            checked={button.action === 'request_managed_bot'}
            onCheckedChange={handleManagedBotToggle}
          />
        </div>
      </div>
    </div>
  );
}
