/**
 * @fileoverview Кнопки действий диалога добавления бота
 *
 * Компонент отображает кнопки отмены и добавления бота.
 *
 * @module AddBotDialogActions
 */

import { Button } from '@/components/ui/button';

interface AddBotDialogActionsProps {
  isParsingBot: boolean;
  createBotMutation: any;
  newBotToken: string;
  projectForNewBot: number | null;
  handleAddBot: () => void;
  onCancel: () => void;
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
  onCancel
}: AddBotDialogActionsProps) {
  const isDisabled = isParsingBot || createBotMutation.isPending || !newBotToken.trim() || !projectForNewBot;

  return (
    <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end pt-2">
      <Button
        variant="outline"
        onClick={onCancel}
        disabled={isParsingBot || createBotMutation.isPending}
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
