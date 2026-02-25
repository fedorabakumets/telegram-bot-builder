/**
 * @fileoverview Поле ввода описания токена
 *
 * Компонент отображает поле для редактирования описания токена.
 *
 * @module TokenDescriptionField
 */

import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface TokenDescriptionFieldProps {
  editDescription: string;
  setEditDescription: (desc: string) => void;
  isPending: boolean;
}

/**
 * Поле ввода описания токена
 */
export function TokenDescriptionField({
  editDescription,
  setEditDescription,
  isPending
}: TokenDescriptionFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="edit-bot-description" className="text-sm sm:text-base font-semibold">
        Описание
      </Label>
      <Textarea
        id="edit-bot-description"
        placeholder="Описание назначения этого токена (необязательно)"
        value={editDescription}
        onChange={(e) => setEditDescription(e.target.value)}
        disabled={isPending}
        rows={3}
        className="text-xs sm:text-sm resize-none"
        data-testid="textarea-edit-bot-description"
      />
      <p className="text-xs text-muted-foreground">
        Добавьте описание для лучшей организации (максимум 500 символов)
      </p>
    </div>
  );
}
