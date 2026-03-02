/**
 * @fileoverview Секция кнопки завершения выбора
 *
 * Компонент для настройки кнопки завершения при множественном выборе.
 */

import { Input } from '@/components/ui/input';
import { ContinueButtonTargetSelector } from './continue-button-target-selector';
import type { Node } from '@shared/schema';

/** Пропсы секции кнопки завершения */
interface ContinueButtonSectionProps {
  /** Выбранный узел */
  selectedNode: Node;
  /** Все узлы для навигации */
  getAllNodesFromAllSheets: any[];
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
  /** Функция форматирования отображения узла */
  formatNodeDisplay: (node: any, sheetName?: string) => string;
}

/**
 * Компонент секции кнопки завершения выбора
 * 
 * @param {ContinueButtonSectionProps} props - Пропсы компонента
 * @returns {JSX.Element} Секция кнопки завершения
 */
export function ContinueButtonSection({
  selectedNode,
  getAllNodesFromAllSheets,
  onNodeUpdate,
  formatNodeDisplay
}: ContinueButtonSectionProps) {
  return (
    <div className="bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/30 dark:border-blue-800/30 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <Input
          value={selectedNode.data.continueButtonText || 'Готово'}
          onChange={(e) => onNodeUpdate(selectedNode.id, { continueButtonText: e.target.value })}
          className="flex-1 text-sm font-medium bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Готово"
        />
        <div className="flex items-center gap-2">
          <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded text-xs font-medium">
            Завершение
          </div>
          <button
            onClick={() => {
              // No delete action for auto-generated button, just show info
            }}
            className="text-xs text-muted-foreground hover:text-destructive p-1"
          >
            <i className="fas fa-info-circle"></i>
          </button>
        </div>
      </div>

      <ContinueButtonTargetSelector
        nodeId={selectedNode.id}
        continueButtonTarget={selectedNode.data.continueButtonTarget}
        getAllNodesFromAllSheets={getAllNodesFromAllSheets}
        onNodeUpdate={onNodeUpdate}
        formatNodeDisplay={formatNodeDisplay}
      />
    </div>
  );
}
