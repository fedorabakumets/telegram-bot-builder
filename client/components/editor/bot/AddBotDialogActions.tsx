/**
 * @fileoverview Кнопки действий диалога добавления бота
 *
 * Компонент отображает кнопки отмены и добавления бота.
 * Поддерживает оба режима: ввод нового токена и выбор существующего.
 *
 * @module AddBotDialogActions
 */

import { Button } from '@/components/ui/button';

/**
 * Свойства кнопок действий диалога
 */
interface AddBotDialogActionsProps {
  /** Идёт ли парсинг информации о боте */
  isParsingBot: boolean;
  /** Мутация создания бота */
  createBotMutation: any;
  /** Введённый токен (для режима "новый") */
  newBotToken: string;
  /** ID выбранного проекта */
  projectForNewBot: number | null;
  /** Обработчик добавления бота */
  handleAddBot: () => void;
  /** Обработчик отмены */
  onCancel: () => void;
  /** Текущий режим добавления токена */
  tokenMode: 'new' | 'existing';
  /** ID выбранного существующего токена */
  selectedTokenId: number | null;
}

/**
 * Кнопки действий диалога добавления бота
 */
export function AddBotDialogActions({
  isParsingBot,
  createBotMutation,
  newBotToken,
  projectForNewBot,
  handleAddBot,
  onCancel,
  tokenMode,
  selectedTokenId,
}: AddBotDialogActionsProps) {
  const isBusy = isParsingBot || createBotMutation.isPending;

  const isDisabled =
    isBusy ||
    !projectForNewBot ||
    (tokenMode === 'new' ? !newBotToken.trim() : !selectedTokenId);

  return (
    <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end pt-2">
      <Button
        variant="outline"
        onClick={onCancel}
        disabled={isBusy}
        className="text-sm sm:text-base"
        data-testid="button-cancel-add-bot"
      >
        Отмена
      </Button>
      <Button
        onClick={handleAddBot}
        disabled={isDisabled}
        className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200 text-sm sm:text-base"
        data-testid="button-add-bot"
      >
        {isParsingBot ? 'Проверка...' : createBotMutation.isPending ? 'Добавление...' : 'Добавить бота'}
      </Button>
    </div>
  );
}
