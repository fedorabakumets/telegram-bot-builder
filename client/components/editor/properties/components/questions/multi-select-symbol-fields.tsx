/**
 * @fileoverview Поля кастомных эмодзи отметки для multi-select / radio
 * @module client/components/editor/properties/components/questions/multi-select-symbol-fields
 */

import { Node } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/** Пропсы полей символов отметки */
interface MultiSelectSymbolFieldsProps {
  /** Узел клавиатуры */
  selectedNode: Node;
  /** Обновление data узла */
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
}

/**
 * Три поля: галочка выбранного, радио выбран/не выбран
 * @param props - Свойства компонента
 * @returns JSX блок настроек символов
 */
export function MultiSelectSymbolFields({
  selectedNode,
  onNodeUpdate,
}: MultiSelectSymbolFieldsProps) {
  const data = selectedNode.data as Node['data'] & {
    radioSelectedSymbol?: string;
    radioUnselectedSymbol?: string;
  };

  /**
   * Обновляет одно строковое поле символа (пусто → undefined)
   * @param key - Имя поля в data
   * @param value - Введённое значение
   */
  const setSymbol = (
    key: 'checkmarkSymbol' | 'radioSelectedSymbol' | 'radioUnselectedSymbol',
    value: string
  ) => {
    onNodeUpdate(selectedNode.id, { [key]: value.trim() || undefined });
  };

  return (
    <div className="space-y-2 p-2.5 sm:p-3 rounded-lg border border-amber-200/40 dark:border-amber-800/30 bg-gradient-to-br from-amber-50/40 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10">
      <Label className="text-xs sm:text-sm font-semibold text-amber-900 dark:text-amber-100">
        Символы отметки
      </Label>
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-[10px] text-amber-800/80 dark:text-amber-200/70">Выбрано</Label>
          <Input
            value={data.checkmarkSymbol || ''}
            onChange={(e) => setSymbol('checkmarkSymbol', e.target.value)}
            placeholder="✅"
            maxLength={4}
            className="text-center text-sm h-8"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-amber-800/80 dark:text-amber-200/70">Радио вкл</Label>
          <Input
            value={data.radioSelectedSymbol || ''}
            onChange={(e) => setSymbol('radioSelectedSymbol', e.target.value)}
            placeholder="🔘"
            maxLength={4}
            className="text-center text-sm h-8"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-amber-800/80 dark:text-amber-200/70">Радио выкл</Label>
          <Input
            value={data.radioUnselectedSymbol || ''}
            onChange={(e) => setSymbol('radioUnselectedSymbol', e.target.value)}
            placeholder="⚪️"
            maxLength={4}
            className="text-center text-sm h-8"
          />
        </div>
      </div>
    </div>
  );
}
