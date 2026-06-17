/**
 * @fileoverview Обёртка PropertiesFooter
 * 
 * Компонент для отображения футера панели свойств.
 */

import { PropertiesFooter } from '../layout/properties-footer';
import type { Node } from '@shared/schema';
import type { PropertiesView } from '../layout/properties-view-toggle';

/** Пропсы компонента */
interface PropertiesFooterWrapperProps {
  /** Выбранный узел */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
  /** Функция логирования действий */
  onActionLog?: (type: string, description: string) => void;
  /** Функция сохранения проекта */
  onSaveProject?: () => void;
  /** Режим панели свойств */
  propertiesView?: PropertiesView;
  /** Применить JSON node.data */
  onJsonApply?: () => boolean;
  /** Ошибка парсинга JSON */
  jsonError?: string | null;
}

/**
 * Компонент обёртки PropertiesFooter
 * 
 * @param {PropertiesFooterWrapperProps} props - Пропсы компонента
 * @returns {JSX.Element} PropertiesFooter
 */
export function PropertiesFooterWrapper({
  selectedNode,
  onNodeUpdate,
  onActionLog,
  onSaveProject,
  propertiesView,
  onJsonApply,
  jsonError,
}: PropertiesFooterWrapperProps) {
  return (
    <PropertiesFooter
      selectedNode={selectedNode}
      onNodeUpdate={onNodeUpdate}
      onActionLog={onActionLog}
      onSaveProject={onSaveProject}
      propertiesView={propertiesView}
      onJsonApply={onJsonApply}
      jsonError={jsonError}
    />
  );
}
