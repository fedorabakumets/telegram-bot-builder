/**
 * @fileoverview Компонент сетки полей ввода переменных для медиа
 * 
 * Отображает поля ввода имён переменных для:
 * - Фото
 * - Видео
 * - Аудио
 * - Документа
 * 
 * Показывает только включённые типы ввода.
 */

import { Node } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VARIABLE_INPUT_CONFIGS, VariableInputConfig } from './variable-input-config';

/** Пропсы компонента VariableInputGrid */
interface VariableInputGridProps {
  /** Выбранный узел */
  selectedNode: Node;
  /** Функция обновления узла */
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
}

/**
 * Компонент сетки полей ввода переменных для медиа
 * 
 * @param {VariableInputGridProps} props - Пропсы компонента
 * @returns {JSX.Element} Сетка полей ввода переменных
 */
export function VariableInputGrid({ selectedNode, onNodeUpdate }: VariableInputGridProps) {
  const hasAnyInput = 
    selectedNode.data.enablePhotoInput || 
    selectedNode.data.enableVideoInput || 
    selectedNode.data.enableAudioInput || 
    selectedNode.data.enableDocumentInput;

  if (!hasAnyInput) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 pt-1">
      {VARIABLE_INPUT_CONFIGS.map((config: VariableInputConfig) => (
        selectedNode.data[config.enableKey] && (
          <div key={config.variableKey}>
            <Label className={`text-xs sm:text-sm font-medium ${config.colors.text} mb-1 block`}>
              <i className="fas fa-tag mr-1"></i>
              {config.title}
            </Label>
            <Input
              value={selectedNode.data[config.variableKey] || ''}
              onChange={(e) => onNodeUpdate(selectedNode.id, { [config.variableKey]: e.target.value })}
              className={`text-xs sm:text-sm ${config.colors.border} ${config.colors.focusBorder} ${config.colors.focusRing}`}
              placeholder={config.placeholder}
            />
          </div>
        )
      ))}
    </div>
  );
}
