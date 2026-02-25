/**
 * @fileoverview Поле ввода имени токена
 *
 * Компонент отображает поле для редактирования имени токена.
 *
 * @module TokenNameField
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TokenNameFieldProps {
  editName: string;
  setEditName: (name: string) => void;
  isPending: boolean;
}

/**
 * Поле ввода имени токена
 */
export function TokenNameField({ editName, setEditName, isPending }: TokenNameFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="edit-bot-name" className="text-sm sm:text-base font-semibold">
        Имя токена
      </Label>
      <Input
        id="edit-bot-name"
        placeholder="Например: Основной бот, Test бот"
        value={editName}
        onChange={(e) => setEditName(e.target.value)}
        disabled={isPending}
        className="text-xs sm:text-sm"
        data-testid="input-edit-bot-name"
      />
      <p className="text-xs text-muted-foreground">
        Это имя будет использоваться для идентификации токена в приложении
      </p>
    </div>
  );
}
