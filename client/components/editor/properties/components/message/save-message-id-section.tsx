/**
 * @fileoverview Секция сохранения ID отправленного сообщения в переменную
 * @module components/editor/properties/components/message/save-message-id-section
 */

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { VariableSelector } from '../variables/variable-selector';
import type { Node } from '@shared/schema';
import type { Variable } from '../../../inline-rich/types';

/** Пропсы секции сохранения ID сообщения */
interface SaveMessageIdSectionProps {
  /** Выбранный узел */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
  /** Доступные переменные для выбора */
  textVariables: Variable[];
}

/**
 * Секция сохранения ID отправленного сообщения в переменную.
 * После отправки бот получает message_id ответа и сохраняет его в указанную переменную.
 * @param props - Свойства компонента
 * @returns JSX элемент секции
 */
export function SaveMessageIdSection({ selectedNode, onNodeUpdate, textVariables }: SaveMessageIdSectionProps) {
  const data = selectedNode.data as any;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-slate-600 dark:text-slate-400">
          Сохранить ID сообщения в переменную
        </Label>
      </div>
      <div className="flex gap-2">
        <Input
          value={data.saveMessageIdTo ?? ''}
          onChange={(e) => onNodeUpdate(selectedNode.id, { saveMessageIdTo: e.target.value })}
          placeholder="message_id (необязательно)"
          className="flex-1 h-8 text-sm"
        />
        <VariableSelector
          availableVariables={textVariables}
          onSelect={(name) => onNodeUpdate(selectedNode.id, { saveMessageIdTo: name })}
        />
      </div>
      <p className="text-[10px] text-slate-400">
        После отправки ID сообщения будет сохранён в эту переменную. Используй в узле «Редактировать сообщение».
      </p>
    </div>
  );
}
