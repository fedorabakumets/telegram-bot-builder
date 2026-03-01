import { Node, Button } from '@shared/schema';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button as UIButton } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MediaVariablesList } from '../media/media-variables-list';
import { nanoid } from 'nanoid';
import { validateCommand, getCommandSuggestions, STANDARD_COMMANDS } from '@/lib/commands';

import { SYSTEM_VARIABLES } from '../variables/system-variables';
import { SectionHeader } from '../layout/section-header';
import { SynonymEditor } from '../synonyms/synonym-editor';
import { EmptyState } from '../layout/empty-state';
import { MessageTextSection } from '../message/message-text-section';
import { MediaFileSection } from '../media-file/media-file-section';
import { isManagementNode } from '../../utils/node-constants';
import { AdminRightsInfo } from '../configuration/admin-rights-info';
import { CommandAdvancedSettings } from '../commands/command-advanced-settings';
import { CommandSectionComplete } from '../commands/command-section-complete';
import { ManagementCommandSection } from '../commands/management-command-section';
import { ButtonCard } from '../button-card/button-card';
import { ContinueButtonSection } from '../continue-button/continue-button-section';
import { AutoTransitionSection } from '../navigation/auto-transition-section';
import { PropertiesFooter } from '../layout/properties-footer';
import { PropertiesHeader } from '../layout/properties-header';
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
import { KeyboardTypeSelector } from '../keyboard/keyboard-type-selector';
import { formatNodeDisplay } from '../../utils/node-formatters';
import { getNodeDefaults } from '../../utils/node-defaults';
import { collectAllNodesFromSheets } from '../../utils/node-utils';
import { detectRuleConflicts as detectConflicts, autoFixRulePriorities, RuleConflict } from '../../utils/conditional-utils';
import { collectAvailableQuestions, extractVariables } from '../../utils/variables-utils';
import { usePropertiesPanelState, usePropertiesPanelMemo, useCommandValidation, useHandleAddButton } from '../../hooks';
import { MediaInputToggles } from '../media/media-input-toggles';
import { VariableInputGrid } from '../variables/variable-input-grid';
import { InputNavigationGrid } from '../navigation/input-navigation-grid';
import { ResponseOptionsList } from '../common/response-options-list';
import { EmptyConditionalState } from '../conditional/empty-conditional-state';
import { ConditionalMessageCard } from '../conditional-message-card/conditional-message-card';
import { MultipleSelectionSettings } from '../questions/multiple-selection-settings';
import { ButtonTypeSelector } from '../keyboard/button-type-selector';
import { BroadcastNodeProperties } from '../broadcast/broadcast-properties';
import { SaveToUserIdsSwitch } from '../csv/save-to-user-ids-switch';
import { SaveToCsvSwitch } from '../csv/save-to-csv-switch';

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
  const [] = useState<{ [key: string]: { isValid: boolean; message?: string } }>({});
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
  const [] = useState(false);
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

  // Валидация команды
  const commandValidation = useMemo(() => {
    if (selectedNode && (
      selectedNode.type === 'start' ||
      selectedNode.type === 'command' ||
      selectedNode.type === 'pin_message' ||
      selectedNode.type === 'unpin_message' ||
      selectedNode.type === 'delete_message' ||
      selectedNode.type === 'ban_user' ||
      selectedNode.type === 'unban_user' ||
      selectedNode.type === 'mute_user' ||
      selectedNode.type === 'unmute_user' ||
      selectedNode.type === 'kick_user' ||
      selectedNode.type === 'promote_user' ||
      selectedNode.type === 'demote_user'
    )) {
      const commandValue = selectedNode.data.command || getNodeDefaults(selectedNode.type).command || '';
      return validateCommand(commandValue);
    }
    return { isValid: true, errors: [] };
  }, [selectedNode?.data.command, selectedNode?.type]);

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

  const handleAddButton = () => {
    const newButton: Button = {
      id: nanoid(),
      text: 'Новая кнопка',
      action: 'goto',
      target: '',
      buttonType: 'normal',
      skipDataCollection: false,
      hideAfterClick: false
    };
    onButtonAdd(selectedNode.id, newButton);
  };

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

          {/* Basic Settings */}
          <div className="space-y-3 sm:space-y-4">
            <SectionHeader
              title="Основные настройки"
              isOpen={isBasicSettingsOpen}
              onToggle={() => setIsBasicSettingsOpen(!isBasicSettingsOpen)}
              icon="sliders-h"
              iconGradient="from-slate-100 to-slate-200 dark:from-slate-900/50 dark:to-slate-800/50"
              iconColor="text-slate-600 dark:text-slate-400"
            />
            {isBasicSettingsOpen && (
              <div className="space-y-3 sm:space-y-4 bg-gradient-to-br from-slate-50/30 to-slate-100/20 dark:from-slate-950/30 dark:to-slate-900/20 rounded-xl p-3 sm:p-4 border border-slate-200/30 dark:border-slate-800/30 backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-300">

                {(selectedNode.type === 'start' || selectedNode.type === 'command') && (
                  <CommandSectionComplete
                    selectedNodeId={selectedNode.id}
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
                  />
                )}

                {/* Synonyms for all nodes */}
                <div className="space-y-3 sm:space-y-4 bg-gradient-to-br from-emerald-50/40 to-green-50/20 dark:from-emerald-950/30 dark:to-green-900/20 rounded-xl p-3 sm:p-4 md:p-5 border border-emerald-200/40 dark:border-emerald-800/40 backdrop-blur-sm">
                  <SynonymEditor
                    synonyms={selectedNode.data.synonyms || []}
                    onUpdate={(synonyms) => onNodeUpdate(selectedNode.id, { synonyms })}
                    title="Синонимы"
                    description="Дополнительные текстовые варианты для вызова этого экрана. Например: старт, привет, начать"
                    placeholder="Например: старт, привет, начать"
                  />
                </div>

                {/* Command for Content Management and User Management */}
                {(selectedNode.type === 'pin_message' || selectedNode.type === 'unpin_message' || selectedNode.type === 'delete_message' ||
                  selectedNode.type === 'ban_user' || selectedNode.type === 'unban_user' || selectedNode.type === 'mute_user' ||
                  selectedNode.type === 'unmute_user' || selectedNode.type === 'kick_user' || selectedNode.type === 'promote_user' ||
                  selectedNode.type === 'demote_user' || selectedNode.type === 'admin_rights') && (
                  <ManagementCommandSection
                    selectedNode={selectedNode}
                    onNodeUpdate={onNodeUpdate}
                  />
                )}


              </div>
            )}

            {/* Sticker Configuration */}
            {selectedNode.type === 'sticker' && (
              <StickerConfiguration
                selectedNode={selectedNode}
                onNodeUpdate={onNodeUpdate}
              />
            )}

            {/* Voice Message Configuration */}
            {selectedNode.type === 'voice' && (
              <VoiceConfiguration
                projectId={projectId}
                selectedNode={selectedNode}
                onNodeUpdate={onNodeUpdate}
              />
            )}

            {/* Animation (GIF) Configuration */}
            {selectedNode.type === 'animation' && (
              <AnimationConfiguration
                projectId={projectId}
                selectedNode={selectedNode}
                onNodeUpdate={onNodeUpdate}
              />
            )}

            {/* Location Configuration */}
            {selectedNode.type === 'location' && (
              <div className="space-y-6">
                {/* Coordinates Section */}
                <LocationCoordinatesSection
                  selectedNode={selectedNode}
                  onNodeUpdate={onNodeUpdate}
                />

                {/* Location Details Section */}
                <LocationDetailsSection
                  selectedNode={selectedNode}
                  onNodeUpdate={onNodeUpdate}
                />

                {/* Foursquare Integration Section */}
                <FoursquareIntegrationSection
                  selectedNode={selectedNode}
                  onNodeUpdate={onNodeUpdate}
                />

                {/* Map Services Section */}
                <MapServicesSection
                  selectedNode={selectedNode}
                  onNodeUpdate={onNodeUpdate}
                />
              </div>
            )}

            {/* Contact Configuration */}
            {selectedNode.type === 'contact' && (
              <ContactConfiguration
                selectedNode={selectedNode}
                onNodeUpdate={onNodeUpdate}
              />
            )}

            {/* Broadcast Configuration */}
            {selectedNode.type === 'broadcast' && (
              <BroadcastNodeProperties
                node={selectedNode}
                onUpdate={onNodeUpdate}
              />
            )}

            {/* Content Management Configuration */}
            {(selectedNode.type === 'pin_message' || selectedNode.type === 'unpin_message' || selectedNode.type === 'delete_message') && (
              <ContentManagementConfiguration
                selectedNode={selectedNode}
                onNodeUpdate={onNodeUpdate}
              />
            )}

            {/* User Management Configuration */}
            {(selectedNode.type === 'ban_user' || selectedNode.type === 'unban_user' || selectedNode.type === 'mute_user' ||
              selectedNode.type === 'unmute_user' || selectedNode.type === 'kick_user' || selectedNode.type === 'promote_user' ||
              selectedNode.type === 'demote_user' || selectedNode.type === 'admin_rights') && (
              <UserManagementConfiguration
                selectedNode={selectedNode}
                onNodeUpdate={onNodeUpdate}
              />
            )}

            {/* Admin Rights Configuration */}
            {selectedNode.type === 'admin_rights' && (
              <AdminRightsInfo />
            )}

          </div>
        </div>

        {/* Message Content - скрыто для узлов управления */}
        {!isManagementNode(selectedNode.type) && (
            <div>
              <div className="space-y-4">
                {/* Media Variables Section */}
                <MediaVariablesList
                  variables={attachedMediaVariables}
                  onRemove={handleMediaVariableRemove}
                />

                {/* Message Text Section */}
                <MessageTextSection
                  selectedNode={selectedNode}
                  allNodes={allNodes}
                  textVariables={textVariables}
                  mediaVariables={mediaVariables}
                  isOpen={isMessageTextOpen}
                  onToggle={() => setIsMessageTextOpen(!isMessageTextOpen)}
                  onNodeUpdate={onNodeUpdate}
                  onMediaVariableSelect={handleMediaVariableSelect}
                />

                {/* File Attachment Section */}
                {!isManagementNode(selectedNode.type) && (
                  <MediaFileSection
                    projectId={projectId}
                    selectedNode={selectedNode}
                    isOpen={isMediaSectionOpen}
                    onToggle={() => setIsMediaSectionOpen(!isMediaSectionOpen)}
                    onNodeUpdate={onNodeUpdate}
                  />
                )}
              </div>
            </div>
          )}


        {/* Keyboard Settings - скрыто для узлов управления */}
        {!isManagementNode(selectedNode.type) && (
            <div className="space-y-3 sm:space-y-4 bg-gradient-to-br from-amber-50/40 to-yellow-50/30 dark:from-amber-950/20 dark:to-yellow-950/10 border border-amber-200/30 dark:border-amber-800/30 rounded-xl p-3 sm:p-4 md:p-5 backdrop-blur-sm">
              {/* Header with Spoiler */}
              <button
                onClick={() => setIsKeyboardSectionOpen(!isKeyboardSectionOpen)}
                className="w-full flex items-start justify-between gap-2 sm:gap-3 hover:opacity-80 transition-opacity"
              >
                <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
                  <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-lg bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/50 dark:to-yellow-900/50 flex items-center justify-center flex-shrink-0 pt-0.5">
                    <i className="fas fa-keyboard text-amber-600 dark:text-amber-400 text-sm sm:text-base"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-amber-900 dark:text-amber-100 text-left">Клавиатура</h3>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {selectedNode.data.keyboardType !== 'none' && (
                    <Badge variant="secondary" className="text-xs font-medium">
                      {selectedNode.data.keyboardType === 'inline' ? '📍 Inline' : '💬 Reply'}
                    </Badge>
                  )}
                  <i className={`fas fa-chevron-down text-amber-600 dark:text-amber-400 text-sm transition-transform duration-300 ${isKeyboardSectionOpen ? 'rotate-0' : '-rotate-90'}`}></i>
                </div>
              </button>

              {/* Content - Toggleable with Spoiler */}
              {isKeyboardSectionOpen && (
                <>
                  {/* Keyboard Type Selection */}
                  <KeyboardTypeSelector selectedNode={selectedNode} onNodeUpdate={onNodeUpdate} />

                  <div className="space-y-2">

                    {/* Multiple Selection Setting */}
                    {selectedNode.data.keyboardType !== 'none' && (
                      <MultipleSelectionSettings
                        selectedNode={selectedNode}
                        keyboardType={selectedNode.data.keyboardType as 'inline' | 'reply'}
                        onNodeUpdate={onNodeUpdate}
                      />
                    )}

                    {/* Buttons List */}
                    {selectedNode.data.keyboardType !== 'none' && (
                      <div className="space-y-3">
                        <div className="border-t border-border/20 pt-4"></div>
                        <div className="flex flex-col gap-2.5 sm:gap-3 p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-orange-50/40 to-amber-50/30 dark:from-orange-950/20 dark:to-amber-950/10 border border-orange-200/40 dark:border-orange-800/30 hover:border-orange-300/60 dark:hover:border-orange-700/60 hover:bg-orange-50/60 dark:hover:bg-orange-950/30 transition-all duration-200 group">
                          <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                            <div className="w-6 sm:w-7 md:w-8 h-6 sm:h-7 md:h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-orange-200/50 dark:bg-orange-900/40 group-hover:bg-orange-300/50 dark:group-hover:bg-orange-800/50 transition-all">
                              <i className="fas fa-square-plus text-xs sm:text-sm text-orange-600 dark:text-orange-400"></i>
                            </div>
                            <div className="min-w-0">
                              <Label className="text-xs sm:text-sm font-semibold text-orange-900 dark:text-orange-100 cursor-pointer block">
                                Кнопки
                              </Label>
                              <div className="text-xs text-orange-700/70 dark:text-orange-300/70 mt-0.5 leading-snug">
                                Добавляйте и управляйте кнопками
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1.5 flex-wrap">
                            <UIButton
                              size="sm"
                              variant="outline"
                              onClick={handleAddButton}
                              className="text-xs font-medium h-8 px-2 border-orange-300/50 dark:border-orange-700/50 text-orange-700 dark:text-orange-300 hover:bg-orange-100/50 dark:hover:bg-orange-900/30 transition-all"
                            >
                              <i className="fas fa-plus text-xs mr-1.5"></i>
                              <span className="hidden sm:inline">Кнопка</span>
                            </UIButton>
                            {selectedNode.data.allowMultipleSelection && (
                              <>
                                <UIButton
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const newButton = {
                                      id: Date.now().toString(),
                                      text: 'Новая опция',
                                      action: 'selection' as const,
                                      target: '',
                                      buttonType: 'option' as const,
                                      skipDataCollection: false,
                                      hideAfterClick: false
                                    };

                                    const currentButtons = selectedNode.data.buttons || [];
                                    const updatedButtons = [...currentButtons, newButton];
                                    onNodeUpdate(selectedNode.id, { buttons: updatedButtons });
                                  }}
                                  className="text-xs font-medium h-8 px-2 border-green-300/50 dark:border-green-700/50 text-green-700 dark:text-green-300 hover:bg-green-100/50 dark:hover:bg-green-900/30 transition-all"
                                >
                                  <i className="fas fa-check text-xs mr-1.5"></i>
                                  <span className="hidden sm:inline">Опция</span>
                                </UIButton>
                                <UIButton
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const newButton = {
                                      id: Date.now().toString(),
                                      text: 'Готово',
                                      action: 'goto' as const,
                                      target: '',
                                      buttonType: 'complete' as const,
                                      skipDataCollection: false,
                                      hideAfterClick: false
                                    };

                                    const currentButtons = selectedNode.data.buttons || [];
                                    const updatedButtons = [...currentButtons, newButton];
                                    onNodeUpdate(selectedNode.id, { buttons: updatedButtons });
                                  }}
                                  className="text-xs font-medium h-8 px-2 border-purple-300/50 dark:border-purple-700/50 text-purple-700 dark:text-purple-300 hover:bg-purple-100/50 dark:hover:bg-purple-900/30 transition-all"
                                >
                                  <i className="fas fa-flag-checkered text-xs mr-1.5"></i>
                                  <span className="hidden sm:inline">Завершение</span>
                                </UIButton>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3">
                          {/* Show Continue Button for Multiple Selection */}
                          {selectedNode.data.allowMultipleSelection && (
                            <ContinueButtonSection
                              selectedNode={selectedNode}
                              getAllNodesFromAllSheets={getAllNodesFromAllSheets}
                              onNodeUpdate={onNodeUpdate}
                              formatNodeDisplay={formatNodeDisplay}
                            />
                          )}

                          {(selectedNode.data.buttons || []).map((button) => (
                            <ButtonCard
                              key={button.id}
                              nodeId={selectedNode.id}
                              button={button}
                              textVariables={textVariables}
                              getAllNodesFromAllSheets={getAllNodesFromAllSheets}
                              onButtonUpdate={onButtonUpdate}
                              onButtonDelete={onButtonDelete}
                              keyboardType={selectedNode.data.keyboardType as 'inline' | 'reply' | 'none'}
                              allowMultipleSelection={selectedNode.data.allowMultipleSelection}
                              collectUserInput={selectedNode.data.collectUserInput}
                              selectedNode={selectedNode}
                              allNodes={allNodes}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

        {/* Conditional Messages - скрыто для узлов управления */}
        {/* Conditional Messages - скрыто для узлов управления */}
        {!isManagementNode(selectedNode.type) && (
            <div className="w-full">
              {/* Header with Collapse Toggle */}
              <div className="flex items-start gap-2.5 sm:gap-3 w-full hover:opacity-75 transition-opacity duration-200 group" onClick={() => setIsConditionalMessagesSectionOpen(!isConditionalMessagesSectionOpen)}>
                <button
                  className="flex items-start gap-2.5 sm:gap-3 w-full"
                  title={isConditionalMessagesSectionOpen ? 'Свернуть' : 'Развернуть'}
                >
                  <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/50 dark:to-indigo-900/50 flex items-center justify-center flex-shrink-0 pt-0.5">
                    <i className="fas fa-code-branch text-purple-600 dark:text-purple-400 text-sm sm:text-base"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-purple-900 dark:text-purple-100 text-left">Условные сообщения</h3>
                    <p className="text-xs sm:text-sm text-purple-700/70 dark:text-purple-300/70 mt-0.5 text-left">Разные ответы на основе условий</p>
                  </div>
                </button>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                    {(selectedNode.data.conditionalMessages || []).length}
                  </span>
                  <i className={`fas fa-chevron-down text-xs sm:text-sm text-purple-600 dark:text-purple-400 transition-transform duration-300 ${isConditionalMessagesSectionOpen ? 'rotate-0' : '-rotate-90'}`}></i>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-lg bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200/40 dark:border-purple-800/40">
                <span className="text-xs sm:text-sm font-medium text-purple-900 dark:text-purple-100">Включить</span>
                <Switch
                  checked={selectedNode.data.enableConditionalMessages ?? false}
                  onCheckedChange={(checked) => {
                    onNodeUpdate(selectedNode.id, { enableConditionalMessages: checked });
                  }}
                />
              </div>

              {isConditionalMessagesSectionOpen && (
                <div className="space-y-3 sm:space-y-4">

                  {/* Conditional Messages Settings */}
                  {selectedNode.data.enableConditionalMessages && (
                    <div className="space-y-3 sm:space-y-4 bg-gradient-to-br from-purple-50/40 to-indigo-50/20 dark:from-purple-950/15 dark:to-indigo-950/10 border border-purple-200/40 dark:border-purple-800/30 rounded-lg sm:rounded-xl p-3 sm:p-4 transition-all duration-200 hover:border-purple-300/60 dark:hover:border-purple-700/60">

                      {/* Information Block - Collapsible on mobile */}
                      <details className="group cursor-pointer">
                        <summary className="flex items-center gap-2 text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300 select-none hover:text-blue-800 dark:hover:text-blue-200 transition-colors">
                          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-500/10 transition-transform duration-300" style={{ transform: 'rotate(-90deg)' }}>
                            <i className="fas fa-chevron-down text-xs"></i>
                          </span>
                          <span>ℹ️ Как это работает?</span>
                        </summary>
                        <div className="mt-2 ml-6 space-y-1 text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
                          <div className="flex gap-2"><span className="flex-shrink-0">📝</span> <span>Бот запомнит ответы пользователей</span></div>
                          <div className="flex gap-2"><span className="flex-shrink-0">🎯</span> <span>Покажет разные сообщения</span></div>
                          <div className="flex gap-2"><span className="flex-shrink-0">⚡</span> <span>Например: новым - "Добро пожаловать!", старым - "С возвращением!"</span></div>
                        </div>
                      </details>

                      {/* Conditional Messages List */}
                      <div className="space-y-2 sm:space-y-3">
                        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
                          <Label className="text-xs sm:text-sm font-semibold text-purple-700 dark:text-purple-300">
                            📋 Условия
                          </Label>
                          <div className="flex gap-1.5 w-full sm:w-auto">
                            <UIButton
                              size="sm"
                              variant="outline"
                              onClick={autoFixPriorities}
                              className="flex-1 sm:flex-none text-xs border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all duration-200"
                              title="Автоматически расставить приоритеты для избежания конфликтов"
                            >
                              <i className="fas fa-sort-amount-down text-xs"></i>
                              <span className="hidden sm:inline ml-1.5">Приоритеты</span>
                            </UIButton>
                            <UIButton
                              size="sm"
                              variant="default"
                              onClick={() => {
                                const currentConditions = selectedNode.data.conditionalMessages || [];
                                const nextPriority = Math.max(0, ...currentConditions.map(c => c.priority || 0)) + 10;

                                const newCondition = {
                                  id: `condition-${Date.now()}`,
                                  condition: 'user_data_exists' as const,
                                  variableName: '',
                                  variableNames: [],
                                  logicOperator: 'AND' as const,
                                  messageText: 'Добро пожаловать обратно!',
                                  formatMode: 'text' as const,
                                  keyboardType: 'none' as const,
                                  buttons: [],
                                  collectUserInput: false,
                                  enableTextInput: false,
                                  enablePhotoInput: false,
                                  enableVideoInput: false,
                                  enableAudioInput: false,
                                  enableDocumentInput: false,
                                  waitForTextInput: false,
                                  priority: nextPriority
                                };
                                onNodeUpdate(selectedNode.id, {
                                  conditionalMessages: [...currentConditions, newCondition]
                                });
                              }}
                              className="flex-1 sm:flex-none text-xs bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 dark:from-purple-500 dark:to-purple-600 dark:hover:from-purple-600 dark:hover:to-purple-700 transition-all duration-200"
                            >
                              <i className="fas fa-plus text-xs"></i>
                              <span className="hidden sm:inline ml-1.5">Новое</span>
                            </UIButton>
                          </div>
                        </div>

                        <div className="space-y-2 sm:space-y-3">
                          {(selectedNode.data.conditionalMessages || [])
                            .sort((a, b) => (b.priority || 0) - (a.priority || 0))
                            .map((condition, index) => {
                              const ruleConflicts = detectRuleConflicts.filter(c => c.ruleIndex === index);
                              const hasErrors = ruleConflicts.some(c => c.severity === 'error');
                              const hasWarnings = ruleConflicts.some(c => c.severity === 'warning');

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
        {!isManagementNode(selectedNode.type) && (
            <div className="w-full">
              <SectionHeader
                title="Сбор ответов"
                description="Собирать ввод пользователя в переменные"
                isOpen={isUserInputSectionOpen}
                onToggle={() => setIsUserInputSectionOpen(!isUserInputSectionOpen)}
                icon="inbox"
                iconGradient="from-blue-100 to-cyan-100 dark:from-blue-900/50 dark:to-cyan-900/50"
                iconColor="text-blue-600 dark:text-blue-400"
              />

              <div className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-lg bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/40 dark:border-blue-800/40">
                <span className="text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-100">Включить</span>
                <Switch
                  checked={selectedNode.data.collectUserInput ?? false}
                  onCheckedChange={(checked) => {
                    onNodeUpdate(selectedNode.id, { collectUserInput: checked });
                  }}
                />
              </div>
              {isUserInputSectionOpen && (
                <div className="space-y-4">

                  {/* Input Collection Settings */}
                  {selectedNode.data.collectUserInput && (
                    <div className="space-y-3 sm:space-y-4 bg-gradient-to-br from-blue-50/40 to-indigo-50/20 dark:from-blue-950/15 dark:to-indigo-950/5 border border-blue-200/25 dark:border-blue-800/25 rounded-xl p-3 sm:p-4">

                      {/* Save to User IDs Database Switch */}
                      <SaveToUserIdsSwitch
                        selectedNode={selectedNode}
                        onNodeUpdate={onNodeUpdate}
                      />

                      {/* Save to CSV File Switch */}
                      <SaveToCsvSwitch
                        selectedNode={selectedNode}
                        onNodeUpdate={onNodeUpdate}
                      />

                      {/* Media Input Toggles Grid */}
                      <MediaInputToggles
                        selectedNode={selectedNode}
                        onNodeUpdate={onNodeUpdate}
                      />

                      {/* Variable Inputs Grid */}
                      <VariableInputGrid
                        selectedNode={selectedNode}
                        onNodeUpdate={onNodeUpdate}
                      />

                      {/* Button Type for button responses */}
                      {selectedNode.data.responseType === 'buttons' && (
                        <ButtonTypeSelector
                          selectedNode={selectedNode}
                          onNodeUpdate={onNodeUpdate}
                        />
                      )}

                      {/* Response Options for buttons */}
                      {selectedNode.data.responseType === 'buttons' && (
                        <ResponseOptionsList
                          selectedNode={selectedNode}
                          getAllNodesFromAllSheets={getAllNodesFromAllSheets}
                          onNodeUpdate={onNodeUpdate}
                          formatNodeDisplay={formatNodeDisplay}
                        />
                      )}

                      {/* Variable Name & Navigation Grid */}
                      <InputNavigationGrid
                        selectedNode={selectedNode}
                        getAllNodesFromAllSheets={getAllNodesFromAllSheets}
                        onNodeUpdate={onNodeUpdate}
                        formatNodeDisplay={formatNodeDisplay}
                      />

                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        {/* Auto Transition Section - скрыто для узлов управления */}
        {!isManagementNode(selectedNode.type) &&
          (selectedNode.data.keyboardType === 'none') &&
          (selectedNode.data.collectUserInput !== true) && (
            <AutoTransitionSection
              selectedNode={selectedNode}
              getAllNodesFromAllSheets={getAllNodesFromAllSheets}
              onNodeUpdate={onNodeUpdate}
              isOpen={isAutoTransitionOpen}
              onToggle={() => setIsAutoTransitionOpen(!isAutoTransitionOpen)}
            />
          )}

        {/* Command Advanced Settings */}
        <CommandAdvancedSettings
          selectedNode={selectedNode}
          onNodeUpdate={onNodeUpdate}
          isOpen={isBasicSettingsOpen}
          onToggle={() => setIsBasicSettingsOpen(!isBasicSettingsOpen)}
        />
      </div>

      {/* Properties Footer */}
      <PropertiesFooter selectedNode={selectedNode} onNodeUpdate={onNodeUpdate} onActionLog={onActionLog} onSaveProject={onSaveProject} />
    </aside>
  );
}


