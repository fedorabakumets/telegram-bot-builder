/**
 * @fileoverview Компонент футера панели свойств
 *
 * Содержит кнопки сброса и применения изменений узла.
 *
 * @module PropertiesFooter
 */

import { Node } from '@shared/schema';
import { handleNodeReset } from '../action-loggers/node-reset';
import { ApplyButton } from '../common/apply-button';
import type { PropertiesView } from './properties-view-toggle';

/**
 * Пропсы компонента футера панели свойств
 */
interface PropertiesFooterProps {
  /** Выбранный узел для редактирования */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
  /** Функция логирования действий */
  onActionLog?: (type: string, description: string) => void;
  /** Функция сохранения проекта */
  onSaveProject?: () => void;
  /** Режим панели свойств */
  propertiesView?: PropertiesView;
  /** Применить JSON node.data; возвращает успех */
  onJsonApply?: () => boolean;
  /** Ошибка парсинга JSON */
  jsonError?: string | null;
}

/**
 * Компонент футера панели свойств
 *
 * Содержит кнопки:
 * - Сбросить — возвращает узел к значениям по умолчанию
 * - Применить — сохраняет изменения и проект
 *
 * @param {PropertiesFooterProps} props - Пропсы компонента
 * @returns {JSX.Element} Футер панели свойств
 */
export function PropertiesFooter({
  selectedNode,
  onNodeUpdate,
  onActionLog,
  onSaveProject,
  propertiesView,
  onJsonApply,
  jsonError,
}: PropertiesFooterProps) {
  const handleReset = () => {
    handleNodeReset({
      node: selectedNode,
      onNodeUpdate,
      onActionLog
    });
  };

  const handleNodeApply = () => {
    if (propertiesView === 'json' && onJsonApply) {
      return onJsonApply();
    }
    onNodeUpdate(selectedNode.id, {});
    return true;
  };

  const applyDisabled = propertiesView === 'json' && Boolean(jsonError);

  return (
    <div className="sticky bottom-0 p-2.5 sm:p-3 lg:p-4 border-t border-border/50 bg-gradient-to-r from-background via-background to-muted/5 dark:from-background dark:via-background dark:to-muted/2 backdrop-blur-sm">
      <div className="flex flex-col xs:flex-row gap-2 xs:space-x-2">
        <button
          type="button"
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-md border border-input bg-background hover:bg-muted/80 dark:hover:bg-muted/60 transition-all duration-200 h-8 sm:h-9"
          onClick={handleReset}
        >
          <i className="fas fa-redo-alt"></i>
          Сбросить
        </button>
        <ApplyButton
          onNodeUpdate={handleNodeApply}
          onSaveProject={onSaveProject}
          onActionLog={onActionLog}
          disabled={applyDisabled}
        />
      </div>
    </div>
  );
}
