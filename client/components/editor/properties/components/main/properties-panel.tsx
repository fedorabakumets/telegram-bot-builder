import { Node, Button } from '@shared/schema';
import { getCommandSuggestions, STANDARD_COMMANDS } from '@/lib/commands';
import { useState, useMemo, useEffect } from 'react';

import { EmptyState } from '../layout/empty-state';
import { getNodeDefaults } from '../../utils/node-defaults';
import { collectAllNodesFromSheets } from '../../utils/node-utils';
import { detectRuleConflicts as detectConflicts, autoFixRulePriorities, RuleConflict } from '../../utils/conditional-utils';
import { collectAvailableQuestions, extractVariables } from '../../utils/variables-utils';
import { useMediaVariables } from '../../hooks/use-media-variables';
import { useNodeCommandValidation } from '../../hooks/use-node-command-validation';
import { formatNodeDisplay } from '../../utils/node-formatters';
import { isManagementNode } from '../../utils/node-constants';
import { AdminRightsInfo } from '../configuration/admin-rights-info';
import { CommandAdvancedSettingsWrapper } from './command-advanced-settings-wrapper';
import { PropertiesFooterWrapper } from './properties-footer-wrapper';
import { PropertiesHeader } from '../layout/properties-header';
import { BasicSettingsSection } from './basic-settings-section';
import { MessageContentSection } from './message-content-section';
import { KeyboardSectionHeader } from './keyboard-section-header';
import { KeyboardButtonsSection } from './keyboard-buttons-section';
import { ConditionalMessagesHeader } from './conditional-messages-header';
import { ConditionalMessagesToggle } from './conditional-messages-toggle';
import { ConditionalMessagesInfoBlock } from './conditional-messages-info-block';
import { ConditionalMessagesActions } from './conditional-messages-actions';
import { UserInputSettingsSection } from './user-input-settings-section';
import { AutoTransitionWrapper } from './auto-transition-wrapper';
import { KeyboardTypeSelector } from '../keyboard/keyboard-type-selector';
import { MultipleSelectionSettings } from '../questions/multiple-selection-settings';
import { EmptyConditionalState } from '../conditional/empty-conditional-state';
import { ConditionalMessageCard } from '../conditional-message-card/conditional-message-card';
import { StickerConfiguration } from '../configuration/sticker-configuration';
import { VoiceConfiguration } from '../configuration/voice-configuration';
import { AnimationConfiguration } from '../configuration/animation-configuration';
import { ContactConfiguration } from '../configuration/contact-configuration';
import { ContentManagementConfiguration } from '../configuration/content-management-configuration';
import { UserManagementConfiguration } from '../configuration/user-management-configuration';
import { LocationCoordinatesSection } from '../configuration/location-coordinates-section';
import { LocationDetailsSection } from '../configuration/location-details-section';
import { FoursquareIntegrationSection } from '../configuration/foursquare-integration-section';
import { MapServicesSection } from '../configuration/map-services-section';
import { BroadcastNodeProperties } from '../broadcast/broadcast-properties';

/**
 * Интерфейс пропсов для панели свойств узлов
 * @interface PropertiesPanelProps
 */
interface PropertiesPanelProps {
  /** ID проекта */
  projectId: number;
  /** Выбранный узел для редактирования */
  selectedNode: Node | null;
  /** Все узлы текущего листа */
  allNodes?: Node[] | undefined;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
  /** Функция изменения типа узла */
  onNodeTypeChange?: (nodeId: string, newType: Node['type'], newData: Partial<Node['data']>) => void;
  /** Функция изменения ID узла */
  onNodeIdChange?: (oldId: string, newId: string) => void;
  /** Функция добавления кнопки к узлу */
  onButtonAdd: (nodeId: string, button: Button) => void;
  /** Функция обновления кнопки узла */
  onButtonUpdate: (nodeId: string, buttonId: string, updates: Partial<Button>) => void;
  /** Функция удаления кнопки узла */
  onButtonDelete: (nodeId: string, buttonId: string) => void;
  /** Все листы проекта для поддержки межлистовых соединений */
  allSheets?: any[] | undefined;
  /** ID текущего листа */
  currentSheetId?: string | undefined;
  /** Функция закрытия панели */
  onClose?: (() => void) | undefined;
  /** Функция логирования действий */
  onActionLog?: (type: string, description: string) => void;
  /** Функция сохранения проекта */
  onSaveProject?: () => void;
}

/**
 * Компонент панели свойств для редактирования узлов бота
 * 
 * Основной компонент для настройки всех параметров узлов:
 * - Базовые настройки (тип, ID, команды)
 * - Текст сообщений с поддержкой переменных
 * - Медиафайлы (фото, видео, аудио, документы)
 * - Клавиатуры (inline и reply)
 * - Условные сообщения
 * - Автопереходы и таймеры
 * - Сбор пользовательских данных
 * 
 * Поддерживает:
 * - Многолистовые проекты
 * - Межлистовые соединения
 * - Валидацию данных
 * - Предпросмотр переменных
 * - Адаптивный интерфейс
 * 
 * @param {PropertiesPanelProps} props - Пропсы компонента
 * @returns {JSX.Element} Панель свойств узла
 */
export function PropertiesPanel({
  projectId,
  selectedNode,
  allNodes = [],
  onNodeUpdate,
  onNodeTypeChange,
  onNodeIdChange,
  onButtonAdd,
  onButtonUpdate,
  onButtonDelete,
  allSheets = [],
  currentSheetId,
  onClose,
  onActionLog,
  onSaveProject
}: PropertiesPanelProps) {
  const [commandInput, setCommandInput] = useState('');
  const [showCommandSuggestions, setShowCommandSuggestions] = useState(false);
  const [isBasicSettingsOpen, setIsBasicSettingsOpen] = useState(true);
  const [isMessageTextOpen, setIsMessageTextOpen] = useState(true);
  const [isMediaSectionOpen, setIsMediaSectionOpen] = useState(true);
  const [isAutoTransitionOpen, setIsAutoTransitionOpen] = useState(true);
  const [isKeyboardSectionOpen, setIsKeyboardSectionOpen] = useState(true);
  const [displayNodeId, setDisplayNodeId] = useState(selectedNode?.id || '');

  // Синхронизируем displayNodeId с selectedNode.id при изменении узла
  useEffect(() => {
    if (selectedNode?.id) {
      setDisplayNodeId(selectedNode.id);
    }
  }, [selectedNode?.id]);

  /**
   * Мемоизированный список всех узлов из всех листов
   */
  const getAllNodesFromAllSheets = useMemo(() =>
    collectAllNodesFromSheets(allSheets, allNodes, currentSheetId),
  [allSheets, allNodes, currentSheetId]);
  const [isConditionalMessagesSectionOpen, setIsConditionalMessagesSectionOpen] = useState(true);
  const [isUserInputSectionOpen, setIsUserInputSectionOpen] = useState(true);

  /**
   * Мемоизированный список доступных вопросов
   */
  const availableQuestions = useMemo(() => collectAvailableQuestions(allNodes), [allNodes]);

  /**
   * Мемоизированные текстовые и медиа переменные
   */
  const { textVariables, mediaVariables } = useMemo(() => extractVariables(allNodes), [allNodes]);

  /**
   * Хук для управления медиапеременными
   */
  const { attachedMediaVariables, handleMediaVariableSelect, handleMediaVariableRemove } = useMediaVariables(
    selectedNode,
    mediaVariables,
    onNodeUpdate
  );

  /**
   * Мемоизированная проверка конфликтов условных сообщений
   */
  const detectRuleConflicts = useMemo((): RuleConflict[] => {
    if (!selectedNode?.data.conditionalMessages) return [];
    return detectConflicts(selectedNode.data.conditionalMessages);
  }, [selectedNode?.data.conditionalMessages]);

  /**
   * Автоматическое исправление приоритетов правил
   */
  const autoFixPriorities = (): void => {
    if (!selectedNode?.data.conditionalMessages) return;
    const fixedRules = autoFixRulePriorities(selectedNode.data.conditionalMessages) as any;
    onNodeUpdate(selectedNode.id, { conditionalMessages: fixedRules });
  };

  const commandValidation = useNodeCommandValidation({ selectedNode });

  // Автодополнение команд
  const commandSuggestions = useMemo(() => {
    if (commandInput.length > 0) {
      return getCommandSuggestions(commandInput);
    }
    return STANDARD_COMMANDS.slice(0, 5);
  }, [commandInput]);

  if (!selectedNode) {
    return <EmptyState onClose={onClose} />;
  }

  return (
    <aside className="w-full h-full bg-background border-l border-border flex flex-col shadow-lg md:shadow-none overflow-hidden">
      {/* Mobile Close Button */}
      <div className="md:hidden flex items-center justify-between p-3 border-b border-border bg-muted/50 sticky top-0 z-10">
        <h3 className="font-semibold text-sm">Настройки элемента</h3>
      </div>

      {/* Properties Header */}
      <PropertiesHeader
        selectedNode={selectedNode}
        onNodeTypeChange={onNodeTypeChange}
        onClose={onClose}
        displayNodeId={displayNodeId}
      />

      {/* Properties Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 sm:p-4 md:p-5 space-y-4 sm:space-y-5 md:space-y-6">

          <BasicSettingsSection
            selectedNode={selectedNode}
            projectId={projectId}
            isOpen={isBasicSettingsOpen}
            onToggle={() => setIsBasicSettingsOpen(!isBasicSettingsOpen)}
            commandValue={selectedNode.data.command || getNodeDefaults(selectedNode.type).command || ''}
            descriptionValue={selectedNode.data.description || getNodeDefaults(selectedNode.type).description || ''}
            isValid={commandValidation.isValid}
            errors={commandValidation.errors}
            suggestions={commandSuggestions}
            showSuggestions={showCommandSuggestions}
            onNodeUpdate={onNodeUpdate}
            onNodeIdChange={onNodeIdChange}
            onCommandInput={setCommandInput}
            onShowSuggestions={setShowCommandSuggestions}
            StickerConfiguration={StickerConfiguration}
            VoiceConfiguration={VoiceConfiguration}
            AnimationConfiguration={AnimationConfiguration}
            LocationCoordinatesSection={LocationCoordinatesSection}
            LocationDetailsSection={LocationDetailsSection}
            FoursquareIntegrationSection={FoursquareIntegrationSection}
            MapServicesSection={MapServicesSection}
            ContactConfiguration={ContactConfiguration}
            BroadcastNodeProperties={BroadcastNodeProperties}
            ContentManagementConfiguration={ContentManagementConfiguration}
            UserManagementConfiguration={UserManagementConfiguration}
            AdminRightsInfo={AdminRightsInfo}
          />
        </div>

        {/* Message Content - скрыто для узлов управления */}
        <MessageContentSection
          selectedNode={selectedNode}
          allNodes={allNodes}
          textVariables={textVariables}
          mediaVariables={mediaVariables}
          attachedMediaVariables={attachedMediaVariables}
          isMessageTextOpen={isMessageTextOpen}
          isMediaSectionOpen={isMediaSectionOpen}
          onMessageTextToggle={() => setIsMessageTextOpen(!isMessageTextOpen)}
          onMediaSectionToggle={() => setIsMediaSectionOpen(!isMediaSectionOpen)}
          onNodeUpdate={onNodeUpdate}
          onMediaVariableRemove={handleMediaVariableRemove}
          onMediaVariableSelect={handleMediaVariableSelect}
          projectId={projectId}
        />


        {!isManagementNode(selectedNode.type) && (
          <div className="space-y-3 sm:space-y-4 bg-gradient-to-br from-amber-50/40 to-yellow-50/30 dark:from-amber-950/20 dark:to-yellow-950/10 border border-amber-200/30 dark:border-amber-800/30 rounded-xl p-3 sm:p-4 md:p-5 backdrop-blur-sm">
            <KeyboardSectionHeader
              selectedNode={selectedNode}
              isOpen={isKeyboardSectionOpen}
              onToggle={() => setIsKeyboardSectionOpen(!isKeyboardSectionOpen)}
            />

            {isKeyboardSectionOpen && (
              <>
                <KeyboardTypeSelector selectedNode={selectedNode} onNodeUpdate={onNodeUpdate} />

                <div className="space-y-2">
                  {selectedNode.data.keyboardType !== 'none' && (
                    <MultipleSelectionSettings
                      selectedNode={selectedNode}
                      keyboardType={selectedNode.data.keyboardType as 'inline' | 'reply'}
                      onNodeUpdate={onNodeUpdate}
                    />
                  )}

                  {selectedNode.data.keyboardType !== 'none' && (
                    <KeyboardButtonsSection
                      selectedNode={selectedNode}
                      getAllNodesFromAllSheets={getAllNodesFromAllSheets}
                      textVariables={textVariables}
                      onNodeUpdate={onNodeUpdate}
                      onButtonAdd={onButtonAdd}
                      onButtonUpdate={onButtonUpdate}
                      onButtonDelete={onButtonDelete}
                      formatNodeDisplay={formatNodeDisplay}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {!isManagementNode(selectedNode.type) && (
          <div className="w-full">
            <ConditionalMessagesHeader
              selectedNode={selectedNode}
              isOpen={isConditionalMessagesSectionOpen}
              onToggle={() => setIsConditionalMessagesSectionOpen(!isConditionalMessagesSectionOpen)}
            />

            <ConditionalMessagesToggle
              selectedNode={selectedNode}
              onNodeUpdate={onNodeUpdate}
            />

            {isConditionalMessagesSectionOpen && (
              <div className="space-y-3 sm:space-y-4">
                {selectedNode.data.enableConditionalMessages && (
                  <div className="space-y-3 sm:space-y-4 bg-gradient-to-br from-purple-50/40 to-indigo-50/20 dark:from-purple-950/15 dark:to-indigo-950/10 border border-purple-200/40 dark:border-purple-800/30 rounded-lg sm:rounded-xl p-3 sm:p-4 transition-all duration-200 hover:border-purple-300/60 dark:hover:border-purple-700/60">

                    <ConditionalMessagesInfoBlock />

                    <div className="space-y-2 sm:space-y-3">
                      <ConditionalMessagesActions
                        autoFixPriorities={autoFixPriorities}
                        onAddCondition={(newCondition) => {
                          const currentConditions = selectedNode.data.conditionalMessages || [];
                          onNodeUpdate(selectedNode.id, {
                            conditionalMessages: [...currentConditions, newCondition]
                          });
                        }}
                      />

                      <div className="space-y-2 sm:space-y-3">
                        {(selectedNode.data.conditionalMessages || [])
                          .sort((a, b) => (b.priority || 0) - (a.priority || 0))
                          .map((condition, index) => {
                            const ruleConflicts = detectRuleConflicts.filter((c: RuleConflict) => c.ruleIndex === index);
                            const hasErrors = ruleConflicts.some((c: RuleConflict) => c.severity === 'error');
                            const hasWarnings = ruleConflicts.some((c: RuleConflict) => c.severity === 'warning');

                            return (
                              <ConditionalMessageCard
                                key={condition.id}
                                index={index}
                                condition={condition}
                                selectedNode={selectedNode}
                                availableQuestions={availableQuestions}
                                textVariables={textVariables}
                                getAllNodesFromAllSheets={getAllNodesFromAllSheets}
                                formatNodeDisplay={formatNodeDisplay}
                                onNodeUpdate={onNodeUpdate}
                                ruleConflicts={ruleConflicts}
                                hasErrors={hasErrors}
                                hasWarnings={hasWarnings}
                              />
                            );
                          })}

                        {(selectedNode.data.conditionalMessages || []).length === 0 && (
                          <EmptyConditionalState
                            selectedNode={selectedNode}
                            onNodeUpdate={onNodeUpdate}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Universal User Input Collection - скрыто для узлов управления */}
        {/* Conditional Messages - скрыто для узлов управления */}
        <UserInputSettingsSection
          selectedNode={selectedNode}
          getAllNodesFromAllSheets={getAllNodesFromAllSheets}
          isOpen={isUserInputSectionOpen}
          onToggle={() => setIsUserInputSectionOpen(!isUserInputSectionOpen)}
          onNodeUpdate={onNodeUpdate}
          formatNodeDisplay={formatNodeDisplay}
        />

        {/* Auto Transition Section - скрыто для узлов управления */}
        <AutoTransitionWrapper
          selectedNode={selectedNode}
          getAllNodesFromAllSheets={getAllNodesFromAllSheets}
          onNodeUpdate={onNodeUpdate}
          isOpen={isAutoTransitionOpen}
          onToggle={() => setIsAutoTransitionOpen(!isAutoTransitionOpen)}
          keyboardType={selectedNode.data.keyboardType}
          collectUserInput={selectedNode.data.collectUserInput}
        />

        <CommandAdvancedSettingsWrapper
          selectedNode={selectedNode}
          onNodeUpdate={onNodeUpdate}
          isOpen={isBasicSettingsOpen}
          onToggle={() => setIsBasicSettingsOpen(!isBasicSettingsOpen)}
        />
      </div>

      <PropertiesFooterWrapper
        selectedNode={selectedNode}
        onNodeUpdate={onNodeUpdate}
        onActionLog={onActionLog}
        onSaveProject={onSaveProject}
      />
    </aside>
  );
}


