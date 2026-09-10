/**
 * @fileoverview Панель свойств узла stop_processing
 * @module components/editor/properties/components/configuration/stop-processing-configuration
 */

import type { Node } from '@shared/schema';

/** Пропсы конфигурации stop_processing */
interface StopProcessingConfigurationProps {
  /** Выбранный узел */
  selectedNode: Node;
}

/**
 * Информационная панель узла stop_processing
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function StopProcessingConfiguration({ selectedNode }: StopProcessingConfigurationProps) {
  return (
    <div className="rounded-xl bg-red-50/60 dark:bg-red-900/20 border border-red-200/50 dark:border-red-700/40 p-4 space-y-2">
      <div className="flex items-center gap-2">
        <i className="fas fa-hand-paper text-red-600 dark:text-red-400 text-sm" />
        <span className="text-sm font-medium text-red-700 dark:text-red-300">
          Стоп обработки
        </span>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
        Устанавливает <code className="text-[10px]">_stop_processing</code> для пользователя.
        Триггер входящего сообщения с включённой «Остановкой цепочки» не вызовет следующий handler.
      </p>
      <p className="text-[10px] text-muted-foreground">Узел: {selectedNode.id}</p>
    </div>
  );
}
