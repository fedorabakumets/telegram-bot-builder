/**
 * @fileoverview Шаг 2 wizard: редактор сообщения рассылки
 * @module client/components/editor/broadcast/wizard/step-message
 */

import { Button } from '@/components/ui/button';
import { CompactInlineEditor } from '@/components/editor/inline-rich/compact-inline-editor';
import type { NewBroadcastFormData } from '../types';

/**
 * Пропсы компонента StepMessage
 */
interface StepMessageProps {
  /** Текущие данные формы */
  formData: NewBroadcastFormData;
  /** Обновление данных формы */
  onChange: (data: Partial<NewBroadcastFormData>) => void;
  /** Переход к следующему шагу */
  onNext: () => void;
  /** Возврат к предыдущему шагу */
  onBack: () => void;
}

/** Доступные переменные для вставки в сообщение */
const VARIABLES = [
  { key: '{first_name}', label: 'Имя' },
  { key: '{last_name}', label: 'Фамилия' },
  { key: '{username}', label: 'Username' },
  { key: '{user_id}', label: 'ID' },
];

/**
 * Шаг редактирования текста сообщения рассылки с поддержкой переменных
 * @param props - Свойства компонента
 * @returns JSX элемент шага редактора сообщения
 */
export function StepMessage({ formData, onChange, onNext, onBack }: StepMessageProps) {
  /**
   * Вставляет переменную в конец текста сообщения
   * @param variable - Переменная для вставки
   */
  const insertVariable = (variable: string) => {
    onChange({ messageText: formData.messageText + variable });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-medium">Текст сообщения</p>
        <CompactInlineEditor
          value={formData.messageText}
          onChange={(val) => onChange({ messageText: val })}
          placeholder="Введите текст рассылки..."
          showStats
        />
      </div>

      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground">Вставить переменную:</p>
        <div className="flex flex-wrap gap-1.5">
          {VARIABLES.map(({ key, label }) => (
            <Button
              key={key}
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => insertVariable(key)}
            >
              {key} <span className="ml-1 text-muted-foreground">({label})</span>
            </Button>
          ))}
        </div>
      </div>

      {formData.messageText && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Предпросмотр:</p>
          <div className="border rounded p-3 bg-muted/30 text-sm whitespace-pre-wrap break-words max-h-24 overflow-auto">
            {formData.messageText.replace(/<[^>]+>/g, '')}
          </div>
        </div>
      )}

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack}>← Назад</Button>
        <Button onClick={onNext} disabled={!formData.messageText.trim()}>Далее →</Button>
      </div>
    </div>
  );
}
