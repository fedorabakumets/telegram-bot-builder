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
import { InfoBlock } from '@/components/ui/info-block';
import { CommandAdvancedSettingsWrapper } from './command-advanced-settings-wrapper';
import { PropertiesFooterWrapper } from './properties-footer-wrapper';
import { PropertiesHeader } from '../layout/properties-header';
import { BasicSettingsSection } from './basic-settings-section';
import { MessageContentSection } from './message-content-section';
import { MediaFileSection } from '../media-file/media-file-section';
import { KeyboardSectionHeader } from '../keyboard/keyboard-section-header';
import { KeyboardButtonsSection } from '../keyboard/keyboard-buttons-section';
// Временно скрыто: import { ConditionalMessagesHeader } from '../conditional-message-card/conditional-messages-header';
// Временно скрыто: import { ConditionalMessagesToggle } from '../conditional-message-card/conditional-messages-toggle';
// Временно скрыто: import { ConditionalMessagesInfoBlock } from '../conditional-message-card/conditional-messages-info-block';
// Временно скрыто: import { ConditionalMessagesActions } from '../conditional-message-card/conditional-messages-actions';
import { UserInputSettingsSection } from './user-input-settings-section';
import { AutoTransitionWrapper } from './auto-transition-wrapper';
import { KeyboardTypeSelector } from '../keyboard/keyboard-type-selector';
import { KeyboardLayoutEditor } from '../keyboard/keyboard-layout-editor';
import { MultipleSelectionSettings } from '../questions/multiple-selection-settings';
import { ButtonCard } from '../button-card/button-card';
// Временно скрыто: import { EmptyConditionalState } from '../conditional/empty-conditional-state';
// Временно скрыто: import { ConditionalMessageCard } from '../conditional-message-card/conditional-message-card';
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
import { ClientAuthProperties } from '../client-auth/client-auth-properties';

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
  const [isBasicSettingsOpen, setIsBasicSettingsOpen] = useState(false);
  const [isMessageTextOpen, setIsMessageTextOpen] = useState(true);
  const [isMediaSectionOpen, setIsMediaSectionOpen] = useState(false);
  const [isAutoTransitionOpen, setIsAutoTransitionOpen] = useState(false);
  const [isKeyboardSectionOpen, setIsKeyboardSectionOpen] = useState(false);
  const [isConditionalMessagesSectionOpen, setIsConditionalMessagesSectionOpen] = useState(false);
  const [isUserInputSectionOpen, setIsUserInputSectionOpen] = useState(false);
  const [displayNodeId, setDisplayNodeId] = useState(selectedNode?.id || '');

  // Синхронизируем displayNodeId с selectedNode.id при изменении узла
  useEffect(() => {
    if (selectedNode?.id) {
      setDisplayNodeId(selectedNode.id);
    }
  }, [selectedNode?.id]);

  // Раскрываем секции при наличии контента
  useEffect(() => {
    if (!selectedNode?.data) return;

    // Секция медиафайлов
    const hasMedia = selectedNode.data.attachedMedia?.length > 0 || 
                     selectedNode.data.imageUrl || 
                     selectedNode.data.videoUrl || 
                     selectedNode.data.audioUrl || 
                     selectedNode.data.documentUrl;
    if (hasMedia && !isMediaSectionOpen) {
      setIsMediaSectionOpen(true);
    }

    // Секция клавиатуры
    const hasKeyboard = selectedNode.data.keyboardType && selectedNode.data.keyboardType !== 'none';
    const hasButtons = selectedNode.data.buttons?.length > 0;
    if ((hasKeyboard || hasButtons) && !isKeyboardSectionOpen) {
      setIsKeyboardSectionOpen(true);
    }

    // Секция автоперехода
    const hasAutoTransition = selectedNode.data.enableAutoTransition && selectedNode.data.autoTransitionTo;
    if (hasAutoTransition && !isAutoTransitionOpen) {
      setIsAutoTransitionOpen(true);
    }

    // Секция условных сообщений
    const hasConditionalMessages = selectedNode.data.enableConditionalMessages && selectedNode.data.conditionalMessages?.length > 0;
    if (hasConditionalMessages && !isConditionalMessagesSectionOpen) {
      setIsConditionalMessagesSectionOpen(true);
    }

    // Секция ввода пользователя
    const hasUserInput = selectedNode.data.collectUserInput || 
                         selectedNode.data.enableTextInput || 
                         selectedNode.data.enablePhotoInput || 
                         selectedNode.data.enableVideoInput || 
                         selectedNode.data.enableAudioInput || 
                         selectedNode.data.enableDocumentInput;
    if (hasUserInput && !isUserInputSectionOpen) {
      setIsUserInputSectionOpen(true);
    }
  }, [selectedNode?.data, selectedNode?.id]);

  /**
   * Мемоизированный список всех узлов из всех листов
   */
  const getAllNodesFromAllSheets = useMemo(() =>
    collectAllNodesFromSheets(allSheets, allNodes, currentSheetId),
  [allSheets, allNodes, currentSheetId]);

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
        <div className="space-y-0">

          {/* Basic Settings Section - скрыто для узла рассылка и client_auth */}
          {selectedNode.type !== 'broadcast' && selectedNode.type !== 'client_auth' && (
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
              ContentManagementConfiguration={ContentManagementConfiguration}
              UserManagementConfiguration={UserManagementConfiguration}
              AdminRightsInfo={AdminRightsInfo}
            />
          )}

          {/* Broadcast Section - только для узла рассылка */}
          {selectedNode.type === 'broadcast' && (
            <BroadcastNodeProperties
              node={selectedNode}
              onUpdate={onNodeUpdate}
            />
          )}

          {/* Client Auth Section - только для узла авторизации Client API */}
          {selectedNode.type === 'client_auth' && (
            <ClientAuthProperties
              node={selectedNode}
              onUpdate={onNodeUpdate}
            />
          )}

          {/* Message Content - скрыто для узлов управления */}
          {!isManagementNode(selectedNode.type) && (
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
          )}

          {/* Media File Section - скрыто для узлов управления */}
          {!isManagementNode(selectedNode.type) && (
            <MediaFileSection
              projectId={projectId}
              selectedNode={selectedNode}
              isOpen={isMediaSectionOpen}
              onToggle={() => setIsMediaSectionOpen(!isMediaSectionOpen)}
              onNodeUpdate={onNodeUpdate}
            />
          )}

          {/* Keyboard Section - скрыто для узлов управления */}
          {!isManagementNode(selectedNode.type) && (
            <div className="w-full bg-gradient-to-br from-amber-50/40 to-yellow-50/20 dark:from-amber-950/30 dark:to-yellow-900/20 rounded-xl p-3 sm:p-4 md:p-5 border border-amber-200/40 dark:border-amber-800/40 backdrop-blur-sm">
              <KeyboardSectionHeader
                selectedNode={selectedNode}
                isOpen={isKeyboardSectionOpen}
                onToggle={() => setIsKeyboardSectionOpen(!isKeyboardSectionOpen)}
              />

              {/* Переключатели типа клавиатуры - всегда видны */}
              <KeyboardTypeSelector
                selectedNode={selectedNode}
                onNodeUpdate={onNodeUpdate}
                onToggle={() => setIsKeyboardSectionOpen(true)}
              />

              {selectedNode.data.attachedMedia && selectedNode.data.attachedMedia.length > 1 && 
               (selectedNode.data.keyboardType === 'inline' || selectedNode.data.keyboardType === 'reply') && (
                <div className="mt-2">
                  <InfoBlock
                    variant="info"
                    title="ℹ️ При включении клавиатуры"
                    description="Только первый файл будет отображаться и отправляться. Остальные файлы сохранены. Нажмите 'Включить все файлы' чтобы использовать все медиа (клавиатура отключится)."
                  />
                </div>
              )}

              {isKeyboardSectionOpen && (
                <div className="space-y-3 sm:space-y-4">
                  {selectedNode.data.keyboardType !== 'none' && (
                    <>
                      {/* Множественный выбор */}
                      <div className="p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-50/40 to-cyan-50/30 dark:from-blue-950/20 dark:to-cyan-950/10 border border-blue-200/40 dark:border-blue-800/30">
                        <MultipleSelectionSettings
                          selectedNode={selectedNode}
                          keyboardType={selectedNode.data.keyboardType as 'inline' | 'reply'}
                          onNodeUpdate={onNodeUpdate}
                        />
                      </div>

                      {/* Кнопки добавления */}
                      <KeyboardButtonsSection
                        selectedNode={selectedNode}
                        onButtonAdd={onButtonAdd}
                      />

                      {/* Список кнопок */}
                      {selectedNode.data.buttons && selectedNode.data.buttons.length > 0 && (
                        <div className="space-y-3">
                          {(selectedNode.data.buttons || []).map((button) => (
                            <ButtonCard
                              key={button.id}
                              nodeId={selectedNode.id}
                              button={button}
                              textVariables={textVariables}
                              getAllNodesFromAllSheets={getAllNodesFromAllSheets}
                              onButtonUpdate={onButtonUpdate}
                              onButtonDelete={onButtonDelete}
                              selectedNode={selectedNode}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {selectedNode.data.keyboardType !== 'none' && selectedNode.data.buttons && selectedNode.data.buttons.length > 0 && (
                    <KeyboardLayoutEditor
                      buttons={(() => {
                        // Добавляем виртуальную кнопку "Готово" для отображения
                        const allButtons = [...selectedNode.data.buttons];
                        if (selectedNode.data.allowMultipleSelection) {
                          const hasCompleteButton = allButtons.some((b: any) => b.action === 'complete');
                          if (!hasCompleteButton) {
                            allButtons.push({
                              id: 'done-button',
                              text: '✅ Готово',
                              action: 'complete' as const,
                              target: '',
                              skipDataCollection: false,
                              hideAfterClick: false
                            });
                          }
                        }
                        return allButtons;
                      })()}
                      initialLayout={(() => {
                        // Если есть множественный выбор и нет кнопки complete, добавляем done-button в layout
                        const layout = selectedNode.data.keyboardLayout;
                        if (!layout) return undefined;

                        if (selectedNode.data.allowMultipleSelection) {
                          const hasCompleteButton = selectedNode.data.buttons.some((b: any) => b.action === 'complete');
                          if (!hasCompleteButton) {
                            // Добавляем done-button в последний ряд или создаём новый
                            const layoutWithDone = { ...layout };
                            const allButtonIds = layoutWithDone.rows.flatMap(r => r.buttonIds);

                            // Если done-button уже есть в layout, не добавляем
                            if (!allButtonIds.includes('done-button')) {
                              if (layout.autoLayout) {
                                // В авто-режиме просто добавляем в конец
                                const lastRow = layoutWithDone.rows[layoutWithDone.rows.length - 1];
                                if (lastRow && lastRow.buttonIds.length < layout.columns) {
                                  lastRow.buttonIds.push('done-button');
                                } else {
                                  layoutWithDone.rows.push({ buttonIds: ['done-button'] });
                                }
                              } else {
                                // В ручном режиме добавляем в отдельный ряд
                                layoutWithDone.rows.push({ buttonIds: ['done-button'] });
                              }
                            }

                            return layoutWithDone;
                          }
                        }

                        return layout;
                      })()}
                      onLayoutChange={(layout) => {
                        // Сохраняем layout с done-button, чтобы он отображался на канвасе
                        onNodeUpdate(selectedNode.id, { keyboardLayout: layout });
                      }}
                    />
                  )}
              </div>
            )}
          </div>
        )}

        {/* Conditional Messages Section - временно скрыто */}
        {/* {!isManagementNode(selectedNode.type) && (
          <div className="w-full bg-gradient-to-br from-purple-50/40 to-indigo-50/20 dark:from-purple-950/30 dark:to-indigo-900/20 rounded-xl p-3 sm:p-4 md:p-5 border border-purple-200/40 dark:border-purple-800/40 backdrop-blur-sm">
            <ConditionalMessagesHeader
              selectedNode={selectedNode}
              isOpen={isConditionalMessagesSectionOpen}
              onToggle={() => setIsConditionalMessagesSectionOpen(!isConditionalMessagesSectionOpen)}
            />

            <ConditionalMessagesToggle
              selectedNode={selectedNode}
              onNodeUpdate={onNodeUpdate}
              onToggle={() => setIsConditionalMessagesSectionOpen(true)}
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
        )} */}

        {/* Universal User Input Collection - скрыто для узлов управления */}
        {/* Conditional Messages - скрыто для узлов управления */}
        {!isManagementNode(selectedNode.type) && (
          <UserInputSettingsSection
            selectedNode={selectedNode}
            getAllNodesFromAllSheets={getAllNodesFromAllSheets}
            isOpen={isUserInputSectionOpen}
            onToggle={() => setIsUserInputSectionOpen(!isUserInputSectionOpen)}
            onNodeUpdate={onNodeUpdate}
            formatNodeDisplay={formatNodeDisplay}
          />
        )}

        {/* Auto Transition Section - скрыто для узлов управления */}
        {!isManagementNode(selectedNode.type) && (
          <AutoTransitionWrapper
            selectedNode={selectedNode}
            getAllNodesFromAllSheets={getAllNodesFromAllSheets}
            onNodeUpdate={onNodeUpdate}
            isOpen={isAutoTransitionOpen}
            onToggle={() => setIsAutoTransitionOpen(!isAutoTransitionOpen)}
            keyboardType={selectedNode.data.keyboardType}
            collectUserInput={selectedNode.data.collectUserInput}
          />
        )}

        <CommandAdvancedSettingsWrapper
          selectedNode={selectedNode}
          onNodeUpdate={onNodeUpdate}
          isOpen={isBasicSettingsOpen}
          onToggle={() => setIsBasicSettingsOpen(!isBasicSettingsOpen)}
        />

        </div>
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


