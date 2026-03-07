/**
 * @fileoverview Секция настроек сбора ответов
 * 
 * Компонент отображает настройки сбора пользовательского ввода.
 */

import { Switch } from '@/components/ui/switch';
import { SectionHeader } from '../layout/section-header';
import { SaveToUserIdsSwitch } from '../csv/save-to-user-ids-switch';
import { SaveToCsvSwitch } from '../csv/save-to-csv-switch';
import { MediaInputToggles } from '../media/media-input-toggles';
import { VariableInputGrid } from '../variables/variable-input-grid';
import { ButtonTypeSelector } from '../keyboard/button-type-selector';
import { ResponseOptionsList } from '../common/response-options-list';
import { InputNavigationGrid } from '../navigation/input-navigation-grid';
import type { Node } from '@shared/schema';

/** Пропсы компонента */
interface UserInputSettingsSectionProps {
  /** Выбранный узел */
  selectedNode: Node;
  /** Все узлы для навигации */
  getAllNodesFromAllSheets: any[];
  /** Флаг открытости секции */
  isOpen: boolean;
  /** Функция переключения открытости */
  onToggle: () => void;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
  /** Функция форматирования отображения узла */
  formatNodeDisplay: (node: any, sheetName?: string) => string;
}

/**
 * Компонент секции настроек сбора ответов
 * 
 * @param {UserInputSettingsSectionProps} props - Пропсы компонента
 * @returns {JSX.Element} Секция настроек сбора ответов
 */
export function UserInputSettingsSection({
  selectedNode,
  getAllNodesFromAllSheets,
  isOpen,
  onToggle,
  onNodeUpdate,
  formatNodeDisplay
}: UserInputSettingsSectionProps) {
  return (
    <div className="w-full bg-gradient-to-br from-blue-50/40 to-cyan-50/20 dark:from-blue-950/30 dark:to-cyan-900/20 rounded-xl p-3 sm:p-4 md:p-5 border border-blue-200/40 dark:border-blue-800/40 backdrop-blur-sm">
      <SectionHeader
        title="Сбор ответов"
        description="Собирать ввод пользователя в переменные"
        isOpen={isOpen}
        onToggle={onToggle}
        icon="inbox"
        iconGradient="from-blue-100 to-cyan-100 dark:from-blue-900/50 dark:to-cyan-900/50"
        iconColor="text-blue-600 dark:text-blue-400"
        descriptionColor="text-blue-700/70 dark:text-blue-300/70"
      />

      <div className="flex items-center gap-2.5 p-3 sm:p-4 md:p-5 rounded-lg bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/40 dark:border-blue-800/40">
        <span className="text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-100">Включить</span>
        <Switch
          checked={selectedNode.data.collectUserInput ?? false}
          onCheckedChange={(checked) => {
            // Если включаем сбор ответов, выключаем автопереход
            if (checked && selectedNode.data.enableAutoTransition) {
              onNodeUpdate(selectedNode.id, { enableAutoTransition: false });
            }
            onNodeUpdate(selectedNode.id, { collectUserInput: checked });
            // Раскрываем секцию после обновления данных
            if (checked && onToggle) {
              setTimeout(() => onToggle(), 0);
            }
          }}
        />
      </div>

      {isOpen && selectedNode.data.collectUserInput && (
        <div className="space-y-3 sm:space-y-4 bg-gradient-to-br from-blue-50/40 to-indigo-50/20 dark:from-blue-950/15 dark:to-indigo-950/5 border border-blue-200/25 dark:border-blue-800/25 rounded-xl p-3 sm:p-4 md:p-5">
          <SaveToUserIdsSwitch
            selectedNode={selectedNode}
            onNodeUpdate={onNodeUpdate}
          />

          <SaveToCsvSwitch
            selectedNode={selectedNode}
            onNodeUpdate={onNodeUpdate}
          />

          <MediaInputToggles
            selectedNode={selectedNode}
            onNodeUpdate={onNodeUpdate}
          />

          <VariableInputGrid
            selectedNode={selectedNode}
            onNodeUpdate={onNodeUpdate}
          />

          {selectedNode.data.responseType === 'buttons' && (
            <ButtonTypeSelector
              selectedNode={selectedNode}
              onNodeUpdate={onNodeUpdate}
            />
          )}

          {selectedNode.data.responseType === 'buttons' && (
            <ResponseOptionsList
              selectedNode={selectedNode}
              getAllNodesFromAllSheets={getAllNodesFromAllSheets}
              onNodeUpdate={onNodeUpdate}
              formatNodeDisplay={formatNodeDisplay}
            />
          )}

          <InputNavigationGrid
            selectedNode={selectedNode}
            getAllNodesFromAllSheets={getAllNodesFromAllSheets}
            onNodeUpdate={onNodeUpdate}
            formatNodeDisplay={formatNodeDisplay}
          />
        </div>
      )}
    </div>
  );
}
