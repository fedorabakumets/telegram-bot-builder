/**
 * @fileoverview Кнопки действий диалога редактирования токена
 *
 * Компонент отображает кнопки отмены и сохранения.
 *
 * @module EditTokenDialogActions
 */

import { Button } from '@/components/ui/button';

interface EditTokenDialogActionsProps {
  isPending: boolean;
  hasName: boolean;
  onCancel: () => void;
  onSave: () => void;
}

/**
 * Кнопки действий диалога редактирования токена
 */
export function EditTokenDialogActions({
  isPending,
  hasName,
  onCancel,
  onSave
}: EditTokenDialogActionsProps) {
  const isDisabled = isPending || !hasName;

  return (
    <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end pt-2">
      <Button
        variant="outline"
        onClick={onCancel}
        disabled={isPending}
        className="text-sm sm:text-base"
        data-testid="button-cancel-edit"
      >
        Отмена
      </Button>
      <Button
        onClick={onSave}
        disabled={isDisabled}
        className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-semibold shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-200 text-sm sm:text-base"
        data-testid="button-save-edit"
      >
        {isPending ? 'Сохранение...' : 'Сохранить'}
      </Button>
    </div>
  );
}
