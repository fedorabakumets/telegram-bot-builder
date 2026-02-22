import { Node, Button } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button as UIButton } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MediaSelector } from '@/components/media/media-selector';
import { nanoid } from 'nanoid';
import { useToast } from '@/hooks/use-toast';
import { validateCommand, getCommandSuggestions, STANDARD_COMMANDS } from '@/lib/commands';
import { useState, useMemo, useEffect } from 'react';

import { InlineRichEditor } from './inline-rich-editor';
import { SYSTEM_VARIABLES } from './system-variables';
import { VariableDropdown } from './system-variables-dropdown';
import { SectionHeader } from './section-header';
import { SynonymEditor } from './synonym-editor';
import { MessageInfoBlock } from './message-info-block';
import { DevelopmentNoticeBlock } from './development-notice-block';
import { getMediaUrlUpdates } from './media-utils';
import { isManagementNode } from './node-constants';
import { AdminRightsInfo } from './configuration/admin-rights-info';
import { CommandAdvancedSettings } from './command-advanced-settings';
import { AutoTransitionSection } from './auto-transition-section';
import { PropertiesFooter } from './properties-footer';
import { PropertiesHeader } from './properties-header';
import { StickerConfiguration } from './configuration/sticker-configuration';
import { VoiceConfiguration } from './configuration/voice-configuration';
import { AnimationConfiguration } from './configuration/animation-configuration';
import { ContactConfiguration } from './configuration/contact-configuration';
import { ContentManagementConfiguration } from './configuration/content-management-configuration';
import { UserManagementConfiguration } from './configuration/user-management-configuration';
import { LocationCoordinatesSection } from './configuration/location-coordinates-section';
import { LocationDetailsSection } from './configuration/location-details-section';
import { FoursquareIntegrationSection } from './configuration/foursquare-integration-section';
import { MapServicesSection } from './configuration/map-services-section';
import { KeyboardTypeSelector } from './keyboard-type-selector';
import { MultipleSelectionSettings } from './multiple-selection-settings';
import { formatNodeDisplay } from './node-formatters';
import { getNodeDefaults } from './node-defaults';
import { collectAllNodesFromSheets } from './node-utils';
import { detectRuleConflicts as detectConflicts, autoFixRulePriorities, RuleConflict } from './conditional-utils';
import { collectAvailableQuestions, extractVariables } from './variables-utils';
import { useMediaVariables } from './use-media-variables';
import { MediaInputToggles } from './media-input-toggles';
import { VariableInputGrid } from './variable-input-grid';
import { ButtonTypeSelector } from './button-type-selector';
import { InputNavigationGrid } from './input-navigation-grid';
import { ResponseOptionsList } from './response-options-list';
import { EmptyConditionalState } from './empty-conditional-state';
import { ConditionContent } from './condition-content';
import { GotoTargetSection } from './goto-target-section';
import { CommandTargetSection } from './command-target-section';
import { OptionButtonInfo } from './option-button-info';
import { CompleteButtonInfo } from './complete-button-info';
import { NormalButtonInfo } from './normal-button-info';
import { BroadcastNodeProperties } from './broadcast-properties';
import { BroadcastToggle } from './broadcast-toggle';
import { SaveToUserIdsSwitch } from './save-to-user-ids-switch';
import { SaveToCsvSwitch } from './save-to-csv-switch';
import { Image, Video, Music, FileText, X } from 'lucide-react';

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
  onClose
}: PropertiesPanelProps) {
  const { toast } = useToast();
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
    return (
      <aside className="w-full h-full bg-background border-l border-border flex flex-col">
        {/* Empty State Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-muted/50 rounded-lg flex items-center justify-center">
                <i className="fas fa-sliders-h text-muted-foreground text-sm"></i>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Свойства</h2>
                <p className="text-xs text-muted-foreground">Выберите элемент для настройки</p>
              </div>
            </div>
            {onClose && (
              <UIButton
                size="icon"
                variant="ghost"
                className="h-8 w-8 flex-shrink-0"
                onClick={onClose}
                title="Закрыть панель свойств"
                data-testid="button-close-properties-empty"
              >
                <X className="w-4 h-4" />
              </UIButton>
            )}
          </div>
        </div>

        {/* Empty State Content */}
        <div className="flex flex-col items-center px-8 pt-12 empty-state-container">
          <div className="text-center max-w-xs">
            {/* Animated Icon */}
            <div className="relative mx-auto mb-6 empty-state-icon">
              <div className="w-16 h-16 empty-state-icon-bg rounded-2xl flex items-center justify-center mx-auto">
                <i className="fas fa-mouse-pointer text-muted-foreground text-xl transition-all duration-300 hover:text-primary hover:scale-110"></i>
              </div>
              {/* Enhanced pulse effect */}
              <div className="absolute inset-0 w-16 h-16 bg-primary/10 rounded-2xl pulse-primary"></div>
            </div>

            {/* Content */}
            <div className="space-y-3 mb-6">
              <h3 className="text-sm font-medium text-foreground gradient-text">Выберите элемент</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Нажмите на любой элемент в редакторе, чтобы увидеть его настройки здесь
              </p>
            </div>

            {/* Enhanced Help Tips */}
            <div className="space-y-3">
              <div className="flex items-center text-xs text-muted-foreground empty-state-tip floating-tip">
                <div className="w-5 h-5 bg-gradient-to-br from-primary/20 to-primary/30 rounded-md flex items-center justify-center mr-3 flex-shrink-0 shadow-sm">
                  <i className="fas fa-lightbulb text-primary text-xs"></i>
                </div>
                <span>Перетащите компоненты из левой панели</span>
              </div>
              <div className="flex items-center text-xs text-muted-foreground empty-state-tip floating-tip">
                <div className="w-5 h-5 bg-gradient-to-br from-primary/20 to-primary/30 rounded-md flex items-center justify-center mr-3 flex-shrink-0 shadow-sm">
                  <i className="fas fa-hand-pointer text-primary text-xs"></i>
                </div>
                <span>Кликните по элементу для настройки</span>
              </div>
              <div className="flex items-center text-xs text-muted-foreground empty-state-tip floating-tip">
                <div className="w-5 h-5 bg-gradient-to-br from-primary/20 to-primary/30 rounded-md flex items-center justify-center mr-3 flex-shrink-0 shadow-sm">
                  <i className="fas fa-sliders-h text-primary text-xs"></i>
                </div>
                <span>Свойства элемента появятся здесь</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    );
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

  if (!selectedNode) {
    return (
      <div className="h-full w-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-sm">Выберите элемент для редактирования</p>
        </div>
      </div>
    );
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
                  <div className="space-y-3 sm:space-y-4 bg-gradient-to-br from-blue-50/40 to-cyan-50/20 dark:from-blue-950/30 dark:to-cyan-900/20 rounded-xl p-3 sm:p-4 border border-blue-200/40 dark:border-blue-800/40 backdrop-blur-sm">
                    <div className="space-y-3 sm:space-y-4">
                      <div className="relative">
                        <Label className="text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-100">Команда</Label>
                        <div className="relative mt-2">
                          <Input
                            value={selectedNode.data.command || getNodeDefaults(selectedNode.type).command || ''}
                            onChange={(e) => {
                              const newCommand = e.target.value;
                              onNodeUpdate(selectedNode.id, { command: newCommand });
                              setCommandInput(newCommand);
                              setShowCommandSuggestions(newCommand.length > 0);

                              // Обновляем ID узла на основе команды
                              const newId = newCommand.replace(/^\//, '').toLowerCase() || selectedNode.id;
                              if (onNodeIdChange && newId !== selectedNode.id) {
                                setDisplayNodeId(newId);
                                onNodeIdChange(selectedNode.id, newId);
                              }
                            }}
                            onFocus={() => setShowCommandSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowCommandSuggestions(false), 200)}
                            className={`text-sm ${!commandValidation.isValid ? 'border-red-500 dark:border-red-500' : 'border-blue-200 dark:border-blue-700'}`}
                            placeholder="/start"
                            data-testid="input-command"
                          />

                          {/* Автодополнение команд */}
                          {showCommandSuggestions && commandSuggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-blue-200 dark:border-blue-800 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                              {commandSuggestions.map((suggestion, index) => (
                                <button
                                  key={index}
                                  className="w-full text-left px-3 sm:px-4 py-2 sm:py-2.5 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs sm:text-sm border-b border-blue-100 dark:border-blue-900 last:border-b-0 transition-colors"
                                  onClick={() => {
                                    onNodeUpdate(selectedNode.id, {
                                      command: suggestion.command,
                                      description: suggestion.description
                                    });

                                    // Обновляем ID узла на основе команды
                                    const newId = suggestion.command.replace(/^\//, '').toLowerCase() || selectedNode.id;
                                    if (onNodeIdChange && newId !== selectedNode.id) {
                                      setDisplayNodeId(newId);
                                      onNodeIdChange(selectedNode.id, newId);
                                    }

                                    setShowCommandSuggestions(false);
                                  }}
                                  data-testid={`button-suggestion-${suggestion.command}`}
                                >
                                  <div className="font-semibold text-foreground">{suggestion.command}</div>
                                  <div className="text-xs text-muted-foreground">{suggestion.description}</div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Ошибки валидации */}
                        {!commandValidation.isValid && commandValidation.errors.length > 0 && (
                          <div className="mt-2 space-y-1 bg-red-50/60 dark:bg-red-950/20 rounded-lg p-2.5 sm:p-3 border border-red-200/50 dark:border-red-800/50">
                            {commandValidation.errors.map((error, index) => (
                              <div key={index} className="flex items-center text-xs sm:text-sm text-red-700 dark:text-red-400 gap-2">
                                <i className="fas fa-exclamation-circle flex-shrink-0"></i>
                                <span>{error}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 sm:space-y-2.5">
                        <Label className="text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                          <i className="fas fa-align-left text-blue-600 dark:text-blue-400 text-xs sm:text-sm"></i>
                          Описание
                        </Label>
                        <Input
                          value={selectedNode.data.description || getNodeDefaults(selectedNode.type).description || ''}
                          onChange={(e) => onNodeUpdate(selectedNode.id, { description: e.target.value })}
                          placeholder="Например: Начать работу с ботом"
                          className="mt-1.5 sm:mt-2 text-xs sm:text-sm border-blue-200 dark:border-blue-700 focus:border-blue-500 focus:ring-blue-200/50"
                          data-testid="input-description"
                        />
                        <div className="flex items-start gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-800/40">
                          <i className="fas fa-lightbulb text-blue-600 dark:text-blue-400 text-xs sm:text-sm mt-0.5 flex-shrink-0"></i>
                          <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                            Используется для меню команд в @BotFather
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
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
                    <div className="space-y-3 sm:space-y-4 bg-gradient-to-br from-red-50/40 to-orange-50/20 dark:from-red-950/30 dark:to-orange-900/20 rounded-xl p-3 sm:p-4 border border-red-200/40 dark:border-red-800/40 backdrop-blur-sm">
                      <div className="space-y-2 sm:space-y-2.5">
                        <Label className="text-xs sm:text-sm font-semibold text-red-900 dark:text-red-100 flex items-center gap-2">
                          <i className="fas fa-terminal text-red-600 dark:text-red-400 text-xs sm:text-sm"></i>
                          Команда действия
                        </Label>
                        <Input
                          value={selectedNode.data.command || getNodeDefaults(selectedNode.type).command || ''}
                          onChange={(e) => onNodeUpdate(selectedNode.id, { command: e.target.value })}
                          className="text-xs sm:text-sm border-red-200 dark:border-red-700 focus:border-red-500 focus:ring-red-200/50"
                          placeholder={
                            selectedNode.type === 'pin_message' ? '/pin_message' :
                              selectedNode.type === 'unpin_message' ? '/unpin_message' :
                                selectedNode.type === 'delete_message' ? '/delete_message' :
                                  selectedNode.type === 'ban_user' ? '/ban_user' :
                                    selectedNode.type === 'unban_user' ? '/unban_user' :
                                      selectedNode.type === 'mute_user' ? '/mute_user' :
                                        selectedNode.type === 'unmute_user' ? '/unmute_user' :
                                          selectedNode.type === 'kick_user' ? '/kick_user' :
                                            selectedNode.type === 'promote_user' ? '/promote_user' :
                                              selectedNode.type === 'demote_user' ? '/demote_user' :
                                                selectedNode.type === 'admin_rights' ? '/admin_rights' : '/command'
                          }
                          data-testid="input-action-command"
                        />
                        <div className="flex items-start gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-lg bg-red-50/50 dark:bg-red-950/30 border border-red-200/50 dark:border-red-800/40">
                          <i className="fas fa-cog text-red-600 dark:text-red-400 text-xs sm:text-sm mt-0.5 flex-shrink-0"></i>
                          <p className="text-xs sm:text-sm text-red-700 dark:text-red-300 leading-relaxed">
                            Основная команда для вызова этого действия
                          </p>
                        </div>
                      </div>
                    </div>
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
                {attachedMediaVariables.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Прикрепленные медиа</Label>
                    <div className="flex flex-wrap gap-2">
                      {attachedMediaVariables.map((variable) => {
                        const getMediaIcon = () => {
                          switch (variable.mediaType) {
                            case 'photo': return <Image className="h-3 w-3" />;
                            case 'video': return <Video className="h-3 w-3" />;
                            case 'audio': return <Music className="h-3 w-3" />;
                            case 'document': return <FileText className="h-3 w-3" />;
                            default: return null;
                          }
                        };

                        const getMediaColor = () => {
                          switch (variable.mediaType) {
                            case 'photo': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700';
                            case 'video': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700';
                            case 'audio': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700';
                            case 'document': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700';
                            default: return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700';
                          }
                        };

                        return (
                          <div
                            key={`${variable.nodeId}-${variable.name}`}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-medium ${getMediaColor()}`}
                          >
                            {getMediaIcon()}
                            <code className="font-mono">{`{${variable.name}}`}</code>
                            <span className="text-[10px] opacity-70">{variable.description}</span>
                            <button
                              onClick={() => handleMediaVariableRemove(variable.name)}
                              className="ml-1 text-xs opacity-50 hover:opacity-100 transition-opacity"
                              title="Удалить медиафайл"
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Эти переменные содержат file_id медиафайлов, полученных от пользователей
                    </div>
                  </div>
                )}

                {/* Message Text Section */}
                <div className="space-y-3 sm:space-y-4">
                  <SectionHeader
                    title="Текст сообщения"
                    description="Основное содержание для отправки пользователю"
                    isOpen={isMessageTextOpen}
                    onToggle={() => setIsMessageTextOpen(!isMessageTextOpen)}
                    icon="message"
                    iconGradient="from-blue-100 to-cyan-100 dark:from-blue-900/50 dark:to-cyan-900/50"
                    iconColor="text-blue-600 dark:text-blue-400"
                    titleGradient="bg-gradient-to-r from-blue-900 to-cyan-800 dark:from-blue-100 dark:to-cyan-200 bg-clip-text text-transparent"
                  />

                  {isMessageTextOpen && (
                    <div className="space-y-3 sm:space-y-4 bg-gradient-to-br from-blue-50/40 to-cyan-50/20 dark:from-blue-950/30 dark:to-cyan-900/20 rounded-xl p-3 sm:p-4 md:p-5 border border-blue-200/40 dark:border-blue-800/40 backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-300">
                      {/* Text Editor */}
                      <div className="space-y-2 sm:space-y-2.5">
                        <InlineRichEditor
                          value={selectedNode.data.messageText || ''}
                          onChange={(value) => onNodeUpdate(selectedNode.id, { messageText: value })}
                          placeholder="Введите текст сообщения..."
                          enableMarkdown={selectedNode.data.markdown}
                          onFormatModeChange={(formatMode) => onNodeUpdate(selectedNode.id, { formatMode })}
                          availableVariables={[...textVariables, ...mediaVariables]}
                          onMediaVariableSelect={handleMediaVariableSelect}
                        />
                        <MessageInfoBlock variant="blue" />
                      </div>
                    </div>
                  )}

                  {/* Переключатель рассылки для message узлов */}
                  {selectedNode.type === 'message' && (
                    <div className="space-y-3 sm:space-y-4">
                      <BroadcastToggle
                        selectedNode={selectedNode}
                        onNodeUpdate={onNodeUpdate}
                        allNodes={allNodes}
                      />
                    </div>
                  )}

                  {/* File Attachment Section - скрыто для узлов управления */}
                  {(() => {
                    const managementNodeTypes = [
                      'pin_message', 'unpin_message', 'delete_message',
                      'ban_user', 'unban_user', 'mute_user', 'unmute_user', 'kick_user',
                      'promote_user', 'demote_user', 'admin_rights'
                    ] as const;
                    return !managementNodeTypes.includes(selectedNode.type as any);
                  })() && (
                      <div className="space-y-3 sm:space-y-4">
                        <SectionHeader
                          title="Прикрепленный медиафайл"
                          description="Картинка, видео, аудио или документ"
                          isOpen={isMediaSectionOpen}
                          onToggle={() => setIsMediaSectionOpen(!isMediaSectionOpen)}
                          icon="paperclip"
                          iconGradient="from-rose-100 to-pink-100 dark:from-rose-900/50 dark:to-pink-900/50"
                          iconColor="text-rose-600 dark:text-rose-400"
                          titleGradient="bg-gradient-to-r from-rose-900 to-pink-800 dark:from-rose-100 dark:to-pink-200 bg-clip-text text-transparent"
                        />

                        {isMediaSectionOpen && (
                          <div className="space-y-3 sm:space-y-4 bg-gradient-to-br from-rose-50/40 to-pink-50/20 dark:from-rose-950/30 dark:to-pink-900/20 rounded-xl p-3 sm:p-4 md:p-5 border border-rose-200/40 dark:border-rose-800/40 backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-300">
                            {/* Информационное сообщение */}
                            <DevelopmentNoticeBlock />

                            {/* Media Selector */}
                            <MediaSelector
                              projectId={projectId}
                              value={selectedNode.data.imageUrl || selectedNode.data.videoUrl || selectedNode.data.audioUrl || selectedNode.data.documentUrl || ''}
                              onChange={(url: string, fileName?: string) => {
                                if (!url) {
                                  onNodeUpdate(selectedNode.id, {
                                    imageUrl: undefined,
                                    videoUrl: undefined,
                                    audioUrl: undefined,
                                    documentUrl: undefined,
                                    documentName: undefined
                                  });
                                  return;
                                }

                                const updates = getMediaUrlUpdates(
                                  url,
                                  selectedNode.id,
                                  fileName,
                                  selectedNode.data.attachedMedia as string[] | undefined
                                );
                                onNodeUpdate(selectedNode.id, updates);
                              }}
                              label=""
                              placeholder="Выберите медиафайл или введите URL"
                            />
                          </div>
                        )}
                      </div>
                    )}
                </div>
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
                            <div className="bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/30 dark:border-blue-800/30 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <Input
                                  value={selectedNode.data.continueButtonText || 'Готово'}
                                  onChange={(e) => onNodeUpdate(selectedNode.id, { continueButtonText: e.target.value })}
                                  className="flex-1 text-sm font-medium bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary"
                                  placeholder="Готово"
                                />
                                <div className="flex items-center gap-2">
                                  {/* Button Type Indicator */}
                                  <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded text-xs font-medium">
                                    Завершение
                                  </div>
                                  <button
                                    onClick={() => {
                                      // No delete action for auto-generated button, just show info
                                      toast({
                                        title: "Автоматическая кнопка",
                                        description: "Эта кнопка генерируется автоматически для завершения выбора",
                                      });
                                    }}
                                    className="text-xs text-muted-foreground hover:text-destructive p-1"
                                  >
                                    <i className="fas fa-info-circle"></i>
                                  </button>
                                </div>
                              </div>

                              {/* Button Type Section - Disabled for continue button */}
                              <div className="space-y-2.5 sm:space-y-3 p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-50/40 to-pink-50/30 dark:from-purple-950/20 dark:to-pink-950/10 border border-purple-200/40 dark:border-purple-800/30 hover:border-purple-300/60 dark:hover:border-purple-700/60 hover:bg-purple-50/60 dark:hover:bg-purple-950/30 transition-all duration-200 group">
                                <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
                                  <div className="w-6 sm:w-7 h-6 sm:h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-purple-200/50 dark:bg-purple-900/40 group-hover:bg-purple-300/50 dark:group-hover:bg-purple-800/50 transition-all">
                                    <i className="fas fa-flag-checkered text-xs sm:text-sm text-purple-600 dark:text-purple-400"></i>
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <Label className="text-xs sm:text-sm font-semibold text-purple-900 dark:text-purple-100 cursor-pointer block">
                                      Тип кнопки
                                    </Label>
                                    <div className="text-xs text-purple-700/70 dark:text-purple-300/70 mt-0.5 leading-snug hidden sm:block">
                                      Автоматическая кнопка завершения
                                    </div>
                                  </div>
                                </div>
                                <div className="px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg bg-gradient-to-br from-purple-100/50 to-pink-100/40 dark:from-purple-900/30 dark:to-pink-900/20 border border-purple-300/40 dark:border-purple-700/40">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-purple-500" style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }}></div>
                                    <span className="text-xs sm:text-sm font-medium text-purple-900 dark:text-purple-100">Кнопка завершения</span>
                                  </div>
                                </div>
                                <div className="text-xs text-purple-700/80 dark:text-purple-300/80 leading-relaxed">
                                  Сохраняет выбранные опции и переходит к следующему экрану
                                </div>
                              </div>

                              {/* Continue Button Target */}
                              <div className="space-y-2.5 sm:space-y-3 p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-indigo-50/40 to-blue-50/30 dark:from-indigo-950/20 dark:to-blue-950/10 border border-indigo-200/40 dark:border-indigo-800/30 hover:border-indigo-300/60 dark:hover:border-indigo-700/60 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/30 transition-all duration-200 group">
                                <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
                                  <div className="w-6 sm:w-7 h-6 sm:h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-indigo-200/50 dark:bg-indigo-900/40 group-hover:bg-indigo-300/50 dark:group-hover:bg-indigo-800/50 transition-all">
                                    <i className="fas fa-right-long text-xs sm:text-sm text-indigo-600 dark:text-indigo-400"></i>
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <Label className="text-xs sm:text-sm font-semibold text-indigo-900 dark:text-indigo-100 cursor-pointer block">
                                      Целевой экран
                                    </Label>
                                    <div className="text-xs text-indigo-700/70 dark:text-indigo-300/70 mt-0.5 leading-snug hidden sm:block">
                                      Куда перейти после завершения выбора
                                    </div>
                                  </div>
                                </div>
                                <Select
                                  value={selectedNode.data.continueButtonTarget || 'none'}
                                  onValueChange={(value) => onNodeUpdate(selectedNode.id, { continueButtonTarget: value === 'none' ? '' : value })}
                                >
                                  <SelectTrigger className="w-full text-xs sm:text-sm bg-white/60 dark:bg-slate-950/60 border border-indigo-300/40 dark:border-indigo-700/40 hover:border-indigo-400/60 dark:hover:border-indigo-600/60 hover:bg-white/80 dark:hover:bg-slate-900/60 focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400/30 dark:focus:ring-indigo-600/30 transition-all duration-200 rounded-lg text-indigo-900 dark:text-indigo-50">
                                    <SelectValue placeholder="⊘ Не выбрано" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-gradient-to-br from-sky-50/95 to-blue-50/90 dark:from-slate-900/95 dark:to-slate-800/95 border border-indigo-200/50 dark:border-indigo-800/50 shadow-xl max-h-48 overflow-y-auto">
                                    <SelectItem value="none">
                                      <div className="flex items-center gap-2">
                                        <span>⊘ Не выбрано</span>
                                      </div>
                                    </SelectItem>
                                    {getAllNodesFromAllSheets
                                      .filter(n => n.node.id !== selectedNode.id)
                                      .map(({ node, sheetName }) => (
                                        <SelectItem key={node.id} value={node.id}>
                                          <span className="text-xs font-mono text-sky-700 dark:text-sky-300 truncate">
                                            {formatNodeDisplay(node, sheetName)}
                                          </span>
                                        </SelectItem>
                                      ))
                                    }
                                  </SelectContent>
                                </Select>
                                <Input
                                  value={selectedNode.data.continueButtonTarget || ''}
                                  onChange={(e) => onNodeUpdate(selectedNode.id, { continueButtonTarget: e.target.value })}
                                  className="text-xs sm:text-sm bg-white/60 dark:bg-slate-950/60 border border-indigo-300/40 dark:border-indigo-700/40 text-indigo-900 dark:text-indigo-50 placeholder:text-indigo-500/50 dark:placeholder:text-indigo-400/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400/30"
                                  placeholder="Или введите ID экрана вручную"
                                />
                              </div>
                            </div>
                          )}

                          {(selectedNode.data.buttons || []).map((button) => (
                            <div key={button.id} className="space-y-2.5 sm:space-y-3 p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-50/40 to-cyan-50/30 dark:from-blue-950/20 dark:to-cyan-950/10 border border-blue-200/40 dark:border-blue-800/30 hover:border-blue-300/60 dark:hover:border-blue-700/60 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 transition-all duration-200 group">
                              {/* Header with icon, title and delete button */}
                              <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 justify-between">
                                <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                                  <div className="w-6 sm:w-7 md:w-8 h-6 sm:h-7 md:h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-200/50 dark:bg-blue-900/40 group-hover:bg-blue-300/50 dark:group-hover:bg-blue-800/50 transition-all">
                                    <i className="fas fa-rectangle-ad text-xs sm:text-sm text-blue-600 dark:text-blue-400"></i>
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-100">
                                      Кнопка
                                    </div>
                                    {selectedNode.data.allowMultipleSelection && button.buttonType && (
                                      <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-xs sm:text-xs font-medium transition-all duration-200
                                {button.buttonType === 'option' && 'bg-gradient-to-r from-green-100/60 to-emerald-100/50 dark:from-green-900/30 dark:to-emerald-900/20 text-green-700 dark:text-green-300 border border-green-300/50 dark:border-green-700/40'}
                                {button.buttonType === 'complete' && 'bg-gradient-to-r from-purple-100/60 to-pink-100/50 dark:from-purple-900/30 dark:to-pink-900/20 text-purple-700 dark:text-purple-300 border border-purple-300/50 dark:border-purple-700/40'}
                                {button.buttonType === 'normal' && 'bg-gradient-to-r from-blue-100/60 to-cyan-100/50 dark:from-blue-900/30 dark:to-cyan-900/20 text-blue-700 dark:text-blue-300 border border-blue-300/50 dark:border-blue-700/40'}
                              ">
                                        {button.buttonType === 'option' && (
                                          <>
                                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                            <span>Опция</span>
                                          </>
                                        )}
                                        {button.buttonType === 'complete' && (
                                          <>
                                            <div className="w-1.5 h-1.5 bg-purple-500" style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }}></div>
                                            <span>Завершение</span>
                                          </>
                                        )}
                                        {button.buttonType === 'normal' && (
                                          <>
                                            <div className="w-1.5 h-1.5 bg-blue-500" style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }}></div>
                                            <span>Обычная</span>
                                          </>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <UIButton
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => onButtonDelete(selectedNode.id, button.id)}
                                  className="text-blue-600 hover:text-red-600 dark:text-blue-400 dark:hover:text-red-400 h-auto p-1.5 transition-colors duration-200 flex-shrink-0"
                                  title="Удалить кнопку"
                                >
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                </UIButton>
                              </div>

                              {/* Text input and variables button */}
                              <div className="space-y-2.5 sm:space-y-3 p-2.5 sm:p-3 rounded-lg bg-gradient-to-br from-purple-50/40 to-pink-50/30 dark:from-purple-950/20 dark:to-pink-950/10 border border-purple-200/40 dark:border-purple-800/30 hover:border-purple-300/60 dark:hover:border-purple-700/60 hover:bg-purple-50/60 dark:hover:bg-purple-950/30 transition-all duration-200 group">
                                <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
                                  <div className="w-6 sm:w-7 h-6 sm:h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-purple-200/50 dark:bg-purple-900/40 group-hover:bg-purple-300/50 dark:group-hover:bg-purple-800/50 transition-all">
                                    <i className="fas fa-keyboard text-xs sm:text-sm text-purple-600 dark:text-purple-400"></i>
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <Label className="text-xs sm:text-sm font-semibold text-purple-900 dark:text-purple-100 cursor-pointer block">
                                      Текст кнопки
                                    </Label>
                                    <div className="text-xs text-purple-700/70 dark:text-purple-300/70 mt-0.5 leading-snug hidden sm:block">
                                      Введите текст или вставьте переменную
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 mt-2.5 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg bg-white/60 dark:bg-slate-950/60 border border-purple-300/40 dark:border-purple-700/40 hover:border-purple-400/60 dark:hover:border-purple-600/60 hover:bg-white/80 dark:hover:bg-slate-900/60 focus-within:border-purple-500 dark:focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-400/30 dark:focus-within:ring-purple-600/30 transition-all duration-200">
                                  <Input
                                    value={button.text}
                                    onChange={(e) => onButtonUpdate(selectedNode.id, button.id, { text: e.target.value })}
                                    className="flex-1 text-xs sm:text-sm bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-purple-900 dark:text-purple-50 placeholder:text-purple-500/50 dark:placeholder:text-purple-400/50 p-0"
                                    placeholder="Введите текст кнопки"
                                  />
                                  <VariableDropdown
                                    nodeId={selectedNode.id}
                                    button={button}
                                    onButtonUpdate={onButtonUpdate}
                                    textVariables={textVariables}
                                  />
                                </div>
                              </div>

                              {/* Divider */}
                              <div className="border-t border-border/20 my-3"></div>

                              {/* Button Type Selection - Show for Multiple Selection Mode */}
                              {selectedNode.data.allowMultipleSelection && (
                                <div className="mb-3">
                                  <Label className="text-xs font-medium text-muted-foreground mb-2 block">Тип кнопки</Label>
                                  <Select
                                    value={button.buttonType || 'normal'}
                                    onValueChange={(value: 'normal' | 'option' | 'complete') => {
                                      if (value === 'option') {
                                        onButtonUpdate(selectedNode.id, button.id, {
                                          buttonType: 'option',
                                          action: 'selection',
                                          target: ''
                                        });
                                      } else if (value === 'complete') {
                                        onButtonUpdate(selectedNode.id, button.id, {
                                          buttonType: 'complete',
                                          action: 'goto',
                                          target: selectedNode.data.continueButtonTarget || ''
                                        });
                                      } else {
                                        onButtonUpdate(selectedNode.id, button.id, {
                                          buttonType: 'normal',
                                          action: 'goto',
                                          target: ''
                                        });
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="w-full text-xs bg-white/60 dark:bg-slate-950/60 border border-blue-300/40 dark:border-blue-700/40 hover:border-blue-400/60 dark:hover:border-blue-600/60 hover:bg-white/80 dark:hover:bg-slate-900/60 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-400/30 dark:focus:ring-blue-600/30 transition-all duration-200 rounded-lg text-blue-900 dark:text-blue-50">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gradient-to-br from-sky-50/95 to-blue-50/90 dark:from-slate-900/95 dark:to-slate-800/95 max-h-48 overflow-y-auto">
                                      <SelectItem value="normal">
                                        <div className="flex items-center gap-2">
                                          <div className="w-2 h-2 bg-blue-500" style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }}></div>
                                          <span>Обычная кнопка</span>
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="option">
                                        <div className="flex items-center gap-2">
                                          <div className="w-2 h-2 bg-green-500" style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }}></div>
                                          <span>Опция для выбора</span>
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="complete">
                                        <div className="flex items-center gap-2">
                                          <div className="w-2 h-2 bg-purple-500" style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }}></div>
                                          <span>Кнопка завершения</span>
                                        </div>
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}
                              {/* Action Selection - Show for normal buttons or non-multiple-selection modes */}
                              {(!selectedNode.data.allowMultipleSelection || (button.buttonType !== 'option' && button.buttonType !== 'complete')) && (
                                <div className="space-y-2.5 sm:space-y-3 p-2.5 sm:p-3 rounded-lg bg-gradient-to-br from-teal-50/40 to-cyan-50/30 dark:from-teal-950/20 dark:to-cyan-950/10 border border-teal-200/40 dark:border-teal-800/30 hover:border-teal-300/60 dark:hover:border-teal-700/60 hover:bg-teal-50/60 dark:hover:bg-teal-950/30 transition-all duration-200 group">
                                  <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
                                    <div className="w-6 sm:w-7 h-6 sm:h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-teal-200/50 dark:bg-teal-900/40 group-hover:bg-teal-300/50 dark:group-hover:bg-teal-800/50 transition-all">
                                      <i className="fas fa-arrow-right text-xs sm:text-sm text-teal-600 dark:text-teal-400"></i>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <Label className="text-xs sm:text-sm font-semibold text-teal-900 dark:text-teal-100 cursor-pointer block">
                                        Действие
                                      </Label>
                                      <div className="text-xs text-teal-700/70 dark:text-teal-300/70 mt-0.5 leading-snug hidden sm:block">
                                        Что должна сделать кнопка при нажатии
                                      </div>
                                    </div>
                                  </div>
                                  <Select
                                    value={button.action}
                                    onValueChange={(value: 'goto' | 'command' | 'url' | 'selection') =>
                                      onButtonUpdate(selectedNode.id, button.id, { action: value })
                                    }
                                  >
                                    <SelectTrigger className="w-full text-xs sm:text-sm bg-white/60 dark:bg-slate-950/60 border border-teal-300/40 dark:border-teal-700/40 hover:border-teal-400/60 dark:hover:border-teal-600/60 hover:bg-white/80 dark:hover:bg-slate-900/60 focus:border-teal-500 dark:focus:border-teal-500 focus:ring-2 focus:ring-teal-400/30 dark:focus:ring-teal-600/30 transition-all duration-200 rounded-lg text-teal-900 dark:text-teal-50">
                                      <SelectValue placeholder="Выберите действие" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gradient-to-br from-teal-50/95 to-cyan-50/90 dark:from-slate-900/95 dark:to-slate-800/95 border border-teal-200/50 dark:border-teal-800/50 shadow-xl">
                                      <SelectItem value="goto">
                                        <div className="flex items-center gap-2">
                                          <i className="fas fa-right-long text-teal-600 dark:text-teal-400 text-xs"></i>
                                          <span>Перейти к экрану</span>
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="command">
                                        <div className="flex items-center gap-2">
                                          <i className="fas fa-terminal text-orange-600 dark:text-orange-400 text-xs"></i>
                                          <span>Выполнить команду</span>
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="url">
                                        <div className="flex items-center gap-2">
                                          <i className="fas fa-link text-blue-600 dark:text-blue-400 text-xs"></i>
                                          <span>Открыть ссылку</span>
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="selection">
                                        <div className="flex items-center gap-2">
                                          <i className="fas fa-check-square text-green-600 dark:text-green-400 text-xs"></i>
                                          <span>Выбор опции</span>
                                        </div>
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}

                              {/* Skip Data Collection Toggle - Only show when collectUserInput is enabled */}
                              {selectedNode.data.collectUserInput && (
                                <div className="space-y-2.5 sm:space-y-3 p-2.5 sm:p-3 rounded-lg bg-gradient-to-br from-cyan-50/40 to-blue-50/30 dark:from-cyan-950/20 dark:to-blue-950/10 border border-cyan-200/40 dark:border-cyan-800/30 hover:border-cyan-300/60 dark:hover:border-cyan-700/60 hover:bg-cyan-50/60 dark:hover:bg-cyan-950/30 transition-all duration-200 group">
                                  <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 justify-between">
                                    <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                                      <div className="w-6 sm:w-7 h-6 sm:h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-cyan-200/50 dark:bg-cyan-900/40 group-hover:bg-cyan-300/50 dark:group-hover:bg-cyan-800/50 transition-all">
                                        <i className="fas fa-ban text-xs sm:text-sm text-cyan-600 dark:text-cyan-400"></i>
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <Label className="text-xs sm:text-sm font-semibold text-cyan-900 dark:text-cyan-100 cursor-pointer block">
                                          Не сохранять ответы
                                        </Label>
                                        <div className="text-xs text-cyan-700/70 dark:text-cyan-300/70 mt-0.5 leading-snug hidden sm:block">
                                          Кнопка работает только для навигации, без сбора данных
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex-shrink-0">
                                      <Switch
                                        checked={button.skipDataCollection ?? false}
                                        onCheckedChange={(checked) =>
                                          onButtonUpdate(selectedNode.id, button.id, { skipDataCollection: checked })
                                        }
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Hide After Click Toggle - For reply buttons */}
                              {selectedNode.data.keyboardType === 'reply' && (
                                <div className="space-y-2.5 sm:space-y-3 p-2.5 sm:p-3 rounded-lg bg-gradient-to-br from-red-50/40 to-rose-50/30 dark:from-red-950/20 dark:to-rose-950/10 border border-red-200/40 dark:border-red-800/30 hover:border-red-300/60 dark:hover:border-red-700/60 hover:bg-red-50/60 dark:hover:bg-red-950/30 transition-all duration-200 group">
                                  <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 justify-between">
                                    <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                                      <div className="w-6 sm:w-7 h-6 sm:h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-red-200/50 dark:bg-red-900/40 group-hover:bg-red-300/50 dark:group-hover:bg-red-800/50 transition-all">
                                        <i className="fas fa-eye-slash text-xs sm:text-sm text-red-600 dark:text-red-400"></i>
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <Label className="text-xs sm:text-sm font-semibold text-red-900 dark:text-red-100 cursor-pointer block">
                                          Скрыть после использования
                                        </Label>
                                        <div className="text-xs text-red-700/70 dark:text-red-300/70 mt-0.5 leading-snug hidden sm:block">
                                          Сообщение будет удалено после нажатия кнопки
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex-shrink-0">
                                      <Switch
                                        checked={button.hideAfterClick ?? false}
                                        onCheckedChange={(checked) =>
                                          onButtonUpdate(selectedNode.id, button.id, { hideAfterClick: checked })
                                        }
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Button Type Info Blocks */}
                              {selectedNode.data.allowMultipleSelection && (
                                <>
                                  {button.buttonType === 'option' && (
                                    <OptionButtonInfo
                                      selectedNode={selectedNode}
                                      onNodeUpdate={onNodeUpdate}
                                    />
                                  )}

                                  {button.buttonType === 'complete' && (
                                    <CompleteButtonInfo />
                                  )}

                                  {button.buttonType === 'normal' && (
                                    <NormalButtonInfo />
                                  )}
                                </>
                              )}

                              {(!selectedNode.data.allowMultipleSelection || button.action !== 'selection') && button.action === 'url' && (
                                <Input
                                  value={button.url || ''}
                                  onChange={(e) => onButtonUpdate(selectedNode.id, button.id, { url: e.target.value })}
                                  className="mt-2 text-xs"
                                  placeholder="https://example.com"
                                />
                              )}

                              {(!selectedNode.data.allowMultipleSelection || button.action !== 'selection') && button.action === 'command' && (
                                <CommandTargetSection
                                  selectedNode={selectedNode}
                                  button={button}
                                  allNodes={allNodes}
                                  onButtonUpdate={onButtonUpdate}
                                />
                              )}

                              {(!selectedNode.data.allowMultipleSelection || button.action !== 'selection') && button.action === 'goto' && (
                                <GotoTargetSection
                                  selectedNode={selectedNode}
                                  button={button}
                                  getAllNodesFromAllSheets={getAllNodesFromAllSheets}
                                  onButtonUpdate={onButtonUpdate}
                                />
                              )}
                            </div>
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
                                <div key={condition.id} className={`border rounded-lg sm:rounded-xl transition-all duration-300 overflow-hidden ${hasErrors
                                  ? 'border-red-400/60 dark:border-red-600/60 bg-red-50/30 dark:bg-red-950/20 shadow-sm shadow-red-200/40 dark:shadow-red-900/20'
                                  : hasWarnings
                                    ? 'border-yellow-400/50 dark:border-yellow-600/50 bg-yellow-50/30 dark:bg-yellow-950/20 shadow-sm shadow-yellow-200/40 dark:shadow-yellow-900/20'
                                    : 'border-purple-300/40 dark:border-purple-700/40 bg-purple-50/20 dark:bg-purple-950/10 hover:border-purple-400/60 dark:hover:border-purple-700/60 shadow-sm hover:shadow-md shadow-transparent dark:shadow-transparent hover:shadow-purple-200/30 dark:hover:shadow-purple-900/20 transition-all hover:scale-[1.01]'
                                  }`}>
                                  {/* Compact Header - Responsive */}
                                  <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-white/50 dark:border-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-purple-300/60 to-purple-400/60 dark:from-purple-800/50 dark:to-purple-700/50 text-xs font-bold text-purple-900 dark:text-purple-100 flex-shrink-0 shadow-sm">
                                        {index + 1}
                                      </span>
                                      <span className="text-xs sm:text-sm font-medium text-foreground truncate">
                                        {condition.variableNames?.join(', ')?.slice(0, 30) || 'Условие'}
                                      </span>
                                      {hasErrors && (
                                        <div className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex-shrink-0 animate-pulse shadow-lg shadow-red-500/30" title="Ошибка"></div>
                                      )}
                                      {hasWarnings && !hasErrors && (
                                        <div className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 flex-shrink-0 shadow-lg shadow-yellow-500/20" title="Предупреждение"></div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1 justify-end">
                                      <div className="inline-flex items-center gap-1 bg-gradient-to-r from-purple-100/60 to-blue-100/60 dark:from-purple-900/40 dark:to-blue-900/40 px-2 py-1 rounded-md border border-purple-300/40 dark:border-purple-700/40 text-xs font-medium text-purple-700 dark:text-purple-300 flex-shrink-0 shadow-sm">
                                        <i className="fas fa-fire text-xs"></i>
                                        <span className="hidden sm:inline">{condition.priority || 0}</span>
                                        <span className="inline sm:hidden text-xs font-bold">{Math.floor((condition.priority || 0) / 10)}</span>
                                      </div>
                                      <div className="h-5 w-px bg-border/40"></div>
                                      <UIButton size="sm" variant="ghost" onClick={() => { const currentConditions = selectedNode.data.conditionalMessages || []; const updatedConditions = currentConditions.map(c => c.id === condition.id ? { ...c, priority: (c.priority || 0) + 10 } : c); onNodeUpdate(selectedNode.id, { conditionalMessages: updatedConditions }); }} className="h-6 w-6 p-0 text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-100/40 dark:hover:bg-blue-900/30 rounded transition-all hover:scale-110" title="Повысить приоритет"><i className="fas fa-chevron-up text-xs"></i></UIButton>
                                      <UIButton size="sm" variant="ghost" onClick={() => { const currentConditions = selectedNode.data.conditionalMessages || []; const updatedConditions = currentConditions.map(c => c.id === condition.id ? { ...c, priority: Math.max(0, (c.priority || 0) - 10) } : c); onNodeUpdate(selectedNode.id, { conditionalMessages: updatedConditions }); }} className="h-6 w-6 p-0 text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-100/40 dark:hover:bg-blue-900/30 rounded transition-all hover:scale-110" title="Понизить приоритет"><i className="fas fa-chevron-down text-xs"></i></UIButton>
                                      <UIButton size="sm" variant="ghost" onClick={() => { const currentConditions = selectedNode.data.conditionalMessages || []; const newConditions = currentConditions.filter(c => c.id !== condition.id); onNodeUpdate(selectedNode.id, { conditionalMessages: newConditions }); }} className="h-6 w-6 p-0 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100/40 dark:hover:bg-red-900/30 rounded transition-all hover:scale-110" title="Удалить"><i className="fas fa-xmark text-xs"></i></UIButton>
                                    </div>
                                  </div>

                                  {/* Show conflicts for this rule */}
                                  {ruleConflicts.length > 0 && (
                                    <div className="bg-gradient-to-br from-red-50/70 to-rose-50/40 dark:from-red-950/40 dark:to-rose-950/20 border-b border-red-200/50 dark:border-red-800/50 px-3 sm:px-4 py-3 sm:py-4">
                                      <div className="space-y-2 sm:space-y-2.5">
                                        {/* Conflicts Header */}
                                        <div className="flex items-center gap-2 mb-2.5">
                                          <i className="fas fa-shield-exclamation text-red-600 dark:text-red-400 text-sm"></i>
                                          <span className="text-xs sm:text-sm font-semibold text-red-700 dark:text-red-300">
                                            {ruleConflicts.length} {ruleConflicts.length === 1 ? 'оши????????ка' : 'ошибок'} в условиях
                                          </span>
                                        </div>

                                        {/* Conflicts List */}
                                        {ruleConflicts.map((conflict, idx) => (
                                          <div key={idx} className="bg-white/40 dark:bg-slate-900/40 border border-red-200/50 dark:border-red-800/40 rounded-lg p-2.5 sm:p-3 flex items-start gap-2 sm:gap-3 hover:bg-white/60 dark:hover:bg-slate-900/60 transition-all">
                                            <div className="flex-shrink-0 mt-0.5">
                                              {conflict.severity === 'error' ? (
                                                <i className="fas fa-circle-xmark text-red-600 dark:text-red-400 text-sm"></i>
                                              ) : (
                                                <i className="fas fa-triangle-exclamation text-amber-500 dark:text-amber-400 text-sm"></i>
                                              )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <span className={`text-xs sm:text-sm leading-relaxed block ${conflict.severity === 'error'
                                                ? 'text-red-700 dark:text-red-300'
                                                : 'text-amber-700 dark:text-amber-300'
                                                }`}>
                                                {conflict.description}
                                              </span>
                                              {conflict.severity === 'error' && (
                                                <span className="text-xs text-red-600 dark:text-red-400 mt-1 block">Требует исправления</span>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Main Content */}
                                  <ConditionContent
                                    condition={condition}
                                    selectedNode={selectedNode}
                                    availableQuestions={availableQuestions}
                                    textVariables={textVariables}
                                    SYSTEM_VARIABLES={SYSTEM_VARIABLES}
                                    getAllNodesFromAllSheets={getAllNodesFromAllSheets}
                                    formatNodeDisplay={formatNodeDisplay}
                                    onNodeUpdate={onNodeUpdate}
                                  />
                                </div>
                              );
                            }
                            )}

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
      <PropertiesFooter selectedNode={selectedNode} onNodeUpdate={onNodeUpdate} />
    </aside>
  );
}


