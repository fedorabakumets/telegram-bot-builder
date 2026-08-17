/**
 * @fileoverview Форма правки текста рассылки внутри пузыря
 * @module editor/database/dialog/components/broadcast-bubble-edit-form
 */

import { Check, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CompactInlineEditor } from '@/components/editor/inline-rich/compact-inline-editor';

/**
 * Пропсы формы правки текста рассылки
 */
interface BroadcastBubbleEditFormProps {
  /** Текущий текст */
  value: string;
  /** Изменение текста */
  onChange: (value: string) => void;
  /** Сохранить */
  onSave: () => void;
  /** Отменить */
  onCancel: () => void;
  /** Идёт сохранение */
  isSaving?: boolean;
}

/**
 * Редактор текста рассылки с кнопками сохранить / отмена
 * @param props - Свойства формы
 * @returns JSX элемент
 */
export function BroadcastBubbleEditForm({
  value,
  onChange,
  onSave,
  onCancel,
  isSaving,
}: BroadcastBubbleEditFormProps) {
  return (
    <div className="rounded-lg bg-gradient-to-br from-violet-100 to-fuchsia-50 px-3 py-2 dark:from-violet-900/50 dark:to-fuchsia-900/30">
      <div className="flex min-w-[260px] flex-col gap-1">
        <CompactInlineEditor value={value} onChange={onChange} placeholder="Текст рассылки..." />
        <div className="flex justify-end gap-1">
          <Button size="sm" className="h-6 px-2 text-xs" onClick={onSave} disabled={!value.trim() || isSaving}>
            {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            <span className="ml-1">Сохранить</span>
          </Button>
          <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={onCancel} disabled={isSaving}>
            <X className="h-3 w-3" />
            <span className="ml-1">Отмена</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
