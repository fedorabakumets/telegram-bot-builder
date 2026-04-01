/**
 * @fileoverview Секция основных настроек
 * 
 * Компонент отображает базовые настройки узла: команды, синонимы, управление.
 */

import { SectionHeader } from '../layout/section-header';
import { SynonymEditor } from '../synonyms/synonym-editor';
import { CommandEditor } from '../synonyms/CommandEditor';
import { CommandSectionComplete } from '../commands/command-section-complete';
import { NodeTypeConfigurations } from './node-type-configurations';
import { useSynonymSync } from '../synonyms/use-synonym-sync';
import { useCommandSync } from '../synonyms/use-command-sync';
import { useNodeCommandTriggerSync } from '../synonyms/use-node-command-trigger-sync';
import type { Node } from '@shared/schema';

/** Пропсы компонента */
interface BasicSettingsSectionProps {
  /** Выбранный узел */
  selectedNode: Node;
  /** ID проекта */
  projectId: number;
  /** Флаг открытости секции */
  isOpen: boolean;
  /** Функция переключения открытости */
  onToggle: () => void;
  /** Значение команды */
  commandValue: string;
  /** Значение описания */
  descriptionValue: string;
  /** Флаг валидности команды */
  isValid: boolean;
  /** Ошибки валидации */
  errors: string[];
  /** Подсказки команд */
  suggestions: Array<{ command: string; description: string }>;
  /** Флаг отображения подсказок */
  showSuggestions: boolean;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
  /** Функция изменения ID узла */
  onNodeIdChange?: (oldId: string, newId: string) => void;
  /** Функция установки значения команды */
  onCommandInput: (value: string) => void;
  /** Функция установки флага подсказок */
  onShowSuggestions: (show: boolean) => void;
  /** Все узлы текущего листа (для поиска связанных text_trigger) */
  allNodes?: Node[];
  /** Добавить узел на холст */
  onNodeAdd?: (node: Node) => void;
  /** Удалить узел с холста */
  onNodeDelete?: (nodeId: string) => void;
  /** Компоненты конфигурации узлов */
  StickerConfiguration: any;
  VoiceConfiguration: any;
  AnimationConfiguration: any;
  LocationCoordinatesSection: any;
  LocationDetailsSection: any;
  FoursquareIntegrationSection: any;
  MapServicesSection: any;
  ContactConfiguration: any;
  ContentManagementConfiguration: any;
  ForwardMessageConfiguration: any;
  CreateForumTopicConfiguration: any;
  UserManagementConfiguration: any;
  AdminRightsInfo: any;
}

/**
 * Компонент секции основных настроек
 * 
 * @param {BasicSettingsSectionProps} props - Пропсы компонента
 * @returns {JSX.Element} Секция основных настроек
 */
export function BasicSettingsSection({
  selectedNode,
  projectId,
  isOpen,
  onToggle,
  commandValue,
  descriptionValue,
  isValid,
  errors,
  suggestions,
  showSuggestions,
  onNodeUpdate,
  onNodeIdChange,
  onCommandInput,
  onShowSuggestions,
  allNodes = [],
  onNodeAdd,
  onNodeDelete,
  StickerConfiguration,
  VoiceConfiguration,
  AnimationConfiguration,
  LocationCoordinatesSection,
  LocationDetailsSection,
  FoursquareIntegrationSection,
  MapServicesSection,
  ContactConfiguration,
  ContentManagementConfiguration,
  ForwardMessageConfiguration,
  CreateForumTopicConfiguration,
  UserManagementConfiguration,
  AdminRightsInfo
}: BasicSettingsSectionProps) {
  const { displaySynonyms, handleSynonymsUpdate } = useSynonymSync({
    selectedNode,
    allNodes,
    onNodeUpdate,
    onNodeAdd,
    onNodeDelete,
  });

  const { commandTriggers, handleCommandAdd, handleCommandDelete } = useCommandSync({
    node: selectedNode,
    allNodes,
    onNodeAdd,
    onNodeDelete,
  });

  // Синхронизация command_trigger только для узлов start/command
  // Для остальных узлов (message, condition и др.) этот хук не должен вызываться
  useNodeCommandTriggerSync(
    (selectedNode.type === 'start' || selectedNode.type === 'command')
      ? { node: selectedNode, allNodes, onNodeAdd, onNodeDelete, onNodeUpdate }
      : { node: selectedNode, allNodes, onNodeAdd: undefined, onNodeDelete: undefined, onNodeUpdate: undefined }
  );
  return (
    <div className="w-full bg-gradient-to-br from-violet-50/40 to-purple-50/20 dark:from-violet-950/30 dark:to-purple-900/20 rounded-xl p-3 sm:p-4 md:p-5 border border-violet-200/40 dark:border-violet-800/40 backdrop-blur-sm">
      <SectionHeader
        title="Основные настройки"
        isOpen={isOpen}
        onToggle={onToggle}
        icon="sliders-h"
        iconGradient="from-violet-100 to-purple-100 dark:from-violet-900/50 dark:to-purple-900/50"
        iconColor="text-violet-600 dark:text-violet-400"
      />
      {isOpen && (
        <div className="space-y-3 sm:space-y-4">

          {(selectedNode.type === 'start' || selectedNode.type === 'command') && (
            <CommandSectionComplete
              selectedNodeId={selectedNode.id}
              commandValue={commandValue}
              descriptionValue={descriptionValue}
              isValid={isValid}
              errors={errors}
              suggestions={suggestions}
              showSuggestions={showSuggestions}
              onNodeUpdate={onNodeUpdate}
              onNodeIdChange={onNodeIdChange}
              onCommandInput={onCommandInput}
              onShowSuggestions={onShowSuggestions}
            />
          )}

          {/* Синонимы - скрыто для узла рассылка */}
          {selectedNode.type !== 'broadcast' && (
            <div className="space-y-3 sm:space-y-4 bg-gradient-to-br from-emerald-50/40 to-green-50/20 dark:from-emerald-950/30 dark:to-green-900/20 rounded-xl p-3 sm:p-4 md:p-5 border border-emerald-200/40 dark:border-emerald-800/40 backdrop-blur-sm">
              <SynonymEditor
                synonyms={displaySynonyms}
                onUpdate={handleSynonymsUpdate}
                description="Дополнительные текстовые варианты для вызова этого экрана. Например: старт, привет, начать"
                placeholder="Например: старт, привет, начать"
              />
            </div>
          )}

          {/* Команды — для всех узлов кроме рассылки и триггеров */}
          {selectedNode.type !== 'broadcast' && (
            <div className="space-y-3 sm:space-y-4 bg-gradient-to-br from-yellow-50/40 to-orange-50/20 dark:from-yellow-950/30 dark:to-orange-900/20 rounded-xl p-3 sm:p-4 md:p-5 border border-yellow-200/40 dark:border-yellow-800/40 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <i className="fas fa-bolt text-yellow-500 dark:text-yellow-400 text-sm"></i>
                <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Команды</span>
              </div>
              <CommandEditor
                commandTriggers={commandTriggers}
                onCommandAdd={handleCommandAdd}
                onCommandDelete={handleCommandDelete}
              />
            </div>
          )}
          {selectedNode.type !== 'forward_message' && selectedNode.type !== 'create_forum_topic' && (
            <NodeTypeConfigurations
              selectedNode={selectedNode}
              projectId={projectId}
              onNodeUpdate={onNodeUpdate}
              StickerConfiguration={StickerConfiguration}
              VoiceConfiguration={VoiceConfiguration}
              AnimationConfiguration={AnimationConfiguration}
              LocationCoordinatesSection={LocationCoordinatesSection}
              LocationDetailsSection={LocationDetailsSection}
              FoursquareIntegrationSection={FoursquareIntegrationSection}
              MapServicesSection={MapServicesSection}
              ContactConfiguration={ContactConfiguration}
              ContentManagementConfiguration={ContentManagementConfiguration}
              ForwardMessageConfiguration={ForwardMessageConfiguration}
              CreateForumTopicConfiguration={CreateForumTopicConfiguration}
              UserManagementConfiguration={UserManagementConfiguration}
              AdminRightsInfo={AdminRightsInfo}
            />
          )}

        </div>
      )}
    </div>
  );
}
