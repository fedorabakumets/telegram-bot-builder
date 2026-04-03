/**
 * @fileoverview Панель свойств узлов редактора с нижней секцией linked-input для message.
 */

import { Node, Button } from '@shared/schema';
import { getCommandSuggestions, STANDARD_COMMANDS } from '@lib/commands';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useConditionalMessagesSync } from '../synonyms/use-conditional-messages-sync';
import { hasLegacyMessageInput } from '../../utils/linked-input-node';

import { EmptyState } from '../layout/empty-state';
import { getNodeDefaults } from '../../utils/node-defaults';
import { collectAllNodesFromSheets } from '../../utils/node-utils';
import { extractVariables } from '../../utils/variables-utils';
import { useMediaVariables } from '../../hooks/use-media-variables';
import { useNodeCommandValidation } from '../../hooks/use-node-command-validation';
import { formatNodeDisplay } from '../../utils/node-formatters';
import { isManagementNode, isTriggerNode, isConditionNode } from '../../utils/node-constants';
import { AdminRightsInfo } from '../configuration/admin-rights-info';
import { InfoBlock } from '@/components/ui/info-block';
import { CommandAdvancedSettingsWrapper } from './command-advanced-settings-wrapper';
import { CommandTriggerConfiguration } from '../trigger/CommandTriggerConfiguration';
import { TextTriggerConfiguration } from '../trigger/TextTriggerConfiguration';
import { AnyMessageTriggerConfiguration } from '../trigger/AnyMessageTriggerConfiguration';
import { GroupMessageTriggerConfiguration } from '../trigger/GroupMessageTriggerConfiguration';
import { ConditionNodeConfiguration } from '../condition/ConditionNodeConfiguration';
import { PropertiesFooterWrapper } from './properties-footer-wrapper';
import { PropertiesHeader } from '../layout/properties-header';
import { SectionHeader } from '../layout/section-header';
import { BasicSettingsSection } from './basic-settings-section';
import { MessageContentSection } from './message-content-section';
import { MediaFileSection } from '../media-file/media-file-section';
import { KeyboardSectionHeader } from '../keyboard/keyboard-section-header';
import { KeyboardButtonsSection } from '../keyboard/keyboard-buttons-section';
import { UserInputSettingsSection } from './user-input-settings-section';
import { KeyboardTypeSelector } from '../keyboard/keyboard-type-selector';
import { KeyboardLayoutEditor } from '../keyboard/keyboard-layout-editor';
import { KeyboardNodeProperties } from '../keyboard/keyboard-node-properties';
import { SaveAnswerProperties } from '../input/save-answer-properties';
import { MultipleSelectionSettings } from '../questions/multiple-selection-settings';
import { ButtonCard } from '../button-card/button-card';
import { StickerConfiguration } from '../configuration/sticker-configuration';
import { VoiceConfiguration } from '../configuration/voice-configuration';
import { AnimationConfiguration } from '../configuration/animation-configuration';
import { ContactConfiguration } from '../configuration/contact-configuration';
import { ContentManagementConfiguration } from '../configuration/content-management-configuration';
import { ForwardMessageConfiguration } from '../configuration/forward-message-configuration';
import { CreateForumTopicConfiguration } from '../configuration/create-forum-topic-configuration';
import { UserManagementConfiguration } from '../configuration/user-management-configuration';
import { LocationCoordinatesSection } from '../configuration/location-coordinates-section';
import { LocationDetailsSection } from '../configuration/location-details-section';
import { FoursquareIntegrationSection } from '../configuration/foursquare-integration-section';
import { MapServicesSection } from '../configuration/map-services-section';
import { BroadcastNodeProperties } from '../broadcast/broadcast-properties';
import { ClientAuthProperties } from '../client-auth/client-auth-properties';
import { MediaNodeProperties } from './media-node-properties';
import type { Variable } from '../../../inline-rich/types';

/**
 * РРЅС‚РµСЂС„РµР№СЃ РїСЂРѕРїСЃРѕРІ РґР»СЏ РїР°РЅРµР»Рё СЃРІРѕР№СЃС‚РІ СѓР·Р»РѕРІ
 * @interface PropertiesPanelProps
 */
interface PropertiesPanelProps {
  /** ID РїСЂРѕРµРєС‚Р° */
  projectId: number;
  /** Р’С‹Р±СЂР°РЅРЅС‹Р№ СѓР·РµР» РґР»СЏ СЂРµРґР°РєС‚РёСЂРѕРІР°РЅРёСЏ */
  selectedNode: Node | null;
  /** Р’СЃРµ СѓР·Р»С‹ С‚РµРєСѓС‰РµРіРѕ Р»РёСЃС‚Р° */
  allNodes?: Node[] | undefined;
  /** Р¤СѓРЅРєС†РёСЏ РѕР±РЅРѕРІР»РµРЅРёСЏ РґР°РЅРЅС‹С… СѓР·Р»Р° */
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
  /** Р¤СѓРЅРєС†РёСЏ РёР·РјРµРЅРµРЅРёСЏ С‚РёРїР° СѓР·Р»Р° */
  onNodeTypeChange?: (nodeId: string, newType: Node['type'], newData: Partial<Node['data']>) => void;
  /** Р¤СѓРЅРєС†РёСЏ РёР·РјРµРЅРµРЅРёСЏ ID СѓР·Р»Р° */
  onNodeIdChange?: (oldId: string, newId: string) => void;
  /** Р¤СѓРЅРєС†РёСЏ РґРѕР±Р°РІР»РµРЅРёСЏ РєРЅРѕРїРєРё Рє СѓР·Р»Сѓ */
  onButtonAdd: (nodeId: string, button: Button) => void;
  /** Р¤СѓРЅРєС†РёСЏ РѕР±РЅРѕРІР»РµРЅРёСЏ РєРЅРѕРїРєРё СѓР·Р»Р° */
  onButtonUpdate: (nodeId: string, buttonId: string, updates: Partial<Button>) => void;
  /** Р¤СѓРЅРєС†РёСЏ СѓРґР°Р»РµРЅРёСЏ РєРЅРѕРїРєРё СѓР·Р»Р° */
  onButtonDelete: (nodeId: string, buttonId: string) => void;
  /** Р”РѕР±Р°РІРёС‚СЊ СѓР·РµР» РЅР° С…РѕР»СЃС‚ (РґР»СЏ СЃРёРЅС…СЂРѕРЅРёР·Р°С†РёРё СЃРёРЅРѕРЅРёРјРѕРІ) */
  onNodeAdd?: (node: Node) => void;
  /** РЈРґР°Р»РёС‚СЊ СѓР·РµР» СЃ С…РѕР»СЃС‚Р° (РґР»СЏ СЃРёРЅС…СЂРѕРЅРёР·Р°С†РёРё СЃРёРЅРѕРЅРёРјРѕРІ) */
  onNodeDelete?: (nodeId: string) => void;
  /** Р’СЃРµ Р»РёСЃС‚С‹ РїСЂРѕРµРєС‚Р° РґР»СЏ РїРѕРґРґРµСЂР¶РєРё РјРµР¶Р»РёСЃС‚РѕРІС‹С… СЃРѕРµРґРёРЅРµРЅРёР№ */
  allSheets?: any[] | undefined;
  /** ID С‚РµРєСѓС‰РµРіРѕ Р»РёСЃС‚Р° */
  currentSheetId?: string | undefined;
  /** Р¤СѓРЅРєС†РёСЏ Р·Р°РєСЂС‹С‚РёСЏ РїР°РЅРµР»Рё */
  onClose?: (() => void) | undefined;
  /** Р¤СѓРЅРєС†РёСЏ Р»РѕРіРёСЂРѕРІР°РЅРёСЏ РґРµР№СЃС‚РІРёР№ */
  onActionLog?: (type: string, description: string) => void;
  /** Р¤СѓРЅРєС†РёСЏ СЃРѕС…СЂР°РЅРµРЅРёСЏ РїСЂРѕРµРєС‚Р° */
  onSaveProject?: () => void;
  /** ID кнопки для скролла к ней в панели свойств */
  focusButtonId?: string | null;
}

/**
 * РљРѕРјРїРѕРЅРµРЅС‚ РїР°РЅРµР»Рё СЃРІРѕР№СЃС‚РІ РґР»СЏ СЂРµРґР°РєС‚РёСЂРѕРІР°РЅРёСЏ СѓР·Р»РѕРІ Р±РѕС‚Р°
 * 
 * РћСЃРЅРѕРІРЅРѕР№ РєРѕРјРїРѕРЅРµРЅС‚ РґР»СЏ РЅР°СЃС‚СЂРѕР№РєРё РІСЃРµС… РїР°СЂР°РјРµС‚СЂРѕРІ СѓР·Р»РѕРІ:
 * - Р‘Р°Р·РѕРІС‹Рµ РЅР°СЃС‚СЂРѕР№РєРё (С‚РёРї, ID, РєРѕРјР°РЅРґС‹)
 * - РўРµРєСЃС‚ СЃРѕРѕР±С‰РµРЅРёР№ СЃ РїРѕРґРґРµСЂР¶РєРѕР№ РїРµСЂРµРјРµРЅРЅС‹С…
 * - РњРµРґРёР°С„Р°Р№Р»С‹ (С„РѕС‚Рѕ, РІРёРґРµРѕ, Р°СѓРґРёРѕ, РґРѕРєСѓРјРµРЅС‚С‹)
 * - РљР»Р°РІРёР°С‚СѓСЂС‹ (inline Рё reply)
 * - РЈСЃР»РѕРІРЅС‹Рµ СЃРѕРѕР±С‰РµРЅРёСЏ
 * - РђРІС‚РѕРїРµСЂРµС…РѕРґС‹ Рё С‚Р°Р№РјРµСЂС‹
 * - РЎР±РѕСЂ РїРѕР»СЊР·РѕРІР°С‚РµР»СЊСЃРєРёС… РґР°РЅРЅС‹С…
 * 
 * РџРѕРґРґРµСЂР¶РёРІР°РµС‚:
 * - РњРЅРѕРіРѕР»РёСЃС‚РѕРІС‹Рµ РїСЂРѕРµРєС‚С‹
 * - РњРµР¶Р»РёСЃС‚РѕРІС‹Рµ СЃРѕРµРґРёРЅРµРЅРёСЏ
 * - Р’Р°Р»РёРґР°С†РёСЋ РґР°РЅРЅС‹С…
 * - РџСЂРµРґРїСЂРѕСЃРјРѕС‚СЂ РїРµСЂРµРјРµРЅРЅС‹С…
 * - РђРґР°РїС‚РёРІРЅС‹Р№ РёРЅС‚РµСЂС„РµР№СЃ
 * 
 * @param {PropertiesPanelProps} props - РџСЂРѕРїСЃС‹ РєРѕРјРїРѕРЅРµРЅС‚Р°
 * @returns {JSX.Element} РџР°РЅРµР»СЊ СЃРІРѕР№СЃС‚РІ СѓР·Р»Р°
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
  onNodeAdd,
  onNodeDelete,
  allSheets = [],
  currentSheetId,
  onClose,
  onActionLog,
  onSaveProject,
  focusButtonId,
}: PropertiesPanelProps) {
  const [commandInput, setCommandInput] = useState('');
  const [showCommandSuggestions, setShowCommandSuggestions] = useState(false);
  const [isBasicSettingsOpen, setIsBasicSettingsOpen] = useState(false);
  const [isAdvancedSettingsOpen, setIsAdvancedSettingsOpen] = useState(false);
  const [isForwardMessageSectionOpen, setIsForwardMessageSectionOpen] = useState(true);
  const [isMessageTextOpen, setIsMessageTextOpen] = useState(true);
  const [isMediaSectionOpen, setIsMediaSectionOpen] = useState(false);
  const [isKeyboardSectionOpen, setIsKeyboardSectionOpen] = useState(false);
  const [isUserInputSectionOpen, setIsUserInputSectionOpen] = useState(false);
  const [displayNodeId, setDisplayNodeId] = useState(selectedNode?.id || '');
  const lastUserInputNodeIdRef = useRef<string | null>(selectedNode?.id || null);
  const wasUserInputPresentRef = useRef(false);

  // РЎРёРЅС…СЂРѕРЅРёР·РёСЂСѓРµРј displayNodeId СЃ selectedNode.id РїСЂРё РёР·РјРµРЅРµРЅРёРё СѓР·Р»Р°
  useEffect(() => {
    if (selectedNode?.id) {
      setDisplayNodeId(selectedNode.id);
    }
  }, [selectedNode?.id]);

  // Раскрываем секцию клавиатуры при наличии focusButtonId
  useEffect(() => {
    if (focusButtonId) setIsKeyboardSectionOpen(true);
  }, [focusButtonId]);

  // Скроллим к нужной кнопке при изменении focusButtonId
  useEffect(() => {
    if (!focusButtonId) return;
    // Небольшая задержка чтобы панель успела открыться
    const timer = setTimeout(() => {
      const el = document.querySelector(`[data-button-id="${focusButtonId}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 400);
    return () => clearTimeout(timer);
  }, [focusButtonId]);

  // Р Р°СЃРєСЂС‹РІР°РµРј СЃРµРєС†РёРё РїСЂРё РЅР°Р»РёС‡РёРё РєРѕРЅС‚РµРЅС‚Р°
  useEffect(() => {
    if (!selectedNode?.data) return;

    if (lastUserInputNodeIdRef.current !== selectedNode.id) {
      lastUserInputNodeIdRef.current = selectedNode.id;
      wasUserInputPresentRef.current = false;
    }

    // РЎРµРєС†РёСЏ РјРµРґРёР°С„Р°Р№Р»РѕРІ
    const hasMedia = selectedNode.data.attachedMedia?.length > 0 || 
                     selectedNode.data.imageUrl || 
                     selectedNode.data.videoUrl || 
                     selectedNode.data.audioUrl || 
                     selectedNode.data.documentUrl;
    if (hasMedia && !isMediaSectionOpen) {
      setIsMediaSectionOpen(true);
    }

    // РЎРµРєС†РёСЏ РєР»Р°РІРёР°С‚СѓСЂС‹
    const hasKeyboard = selectedNode.data.keyboardType && selectedNode.data.keyboardType !== 'none';
    const hasButtons = selectedNode.data.buttons?.length > 0;
    if ((hasKeyboard || hasButtons) && !isKeyboardSectionOpen) {
      setIsKeyboardSectionOpen(true);
    }

    // РЎРµРєС†РёСЏ РІРІРѕРґР° РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ
    const hasMessageInput = selectedNode.type === 'message' && (
      selectedNode.data.autoTransitionTo ||
      hasLegacyMessageInput(selectedNode)
    );
    const hasUserInput = hasMessageInput ||
                         selectedNode.data.collectUserInput || 
                         selectedNode.data.enableTextInput || 
                         selectedNode.data.enablePhotoInput || 
                         selectedNode.data.enableVideoInput || 
                         selectedNode.data.enableAudioInput || 
                         selectedNode.data.enableDocumentInput;

    if (hasUserInput && !wasUserInputPresentRef.current && !isUserInputSectionOpen) {
      setIsUserInputSectionOpen(true);
    }
    wasUserInputPresentRef.current = hasUserInput;
  }, [selectedNode?.data, selectedNode?.id]);

  /**
   * РњРµРјРѕРёР·РёСЂРѕРІР°РЅРЅС‹Р№ СЃРїРёСЃРѕРє РІСЃРµС… СѓР·Р»РѕРІ РёР· РІСЃРµС… Р»РёСЃС‚РѕРІ
   */
  const getAllNodesFromAllSheets = useMemo(() =>
    collectAllNodesFromSheets(allSheets, allNodes, currentSheetId),
  [allSheets, allNodes, currentSheetId]);

  /**
   * РњРµРјРѕРёР·РёСЂРѕРІР°РЅРЅС‹Р№ СЃРїРёСЃРѕРє РґРѕСЃС‚СѓРїРЅС‹С… РІРѕРїСЂРѕСЃРѕРІ
   */
  /**
   * РњРµРјРѕРёР·РёСЂРѕРІР°РЅРЅС‹Рµ С‚РµРєСЃС‚РѕРІС‹Рµ Рё РјРµРґРёР° РїРµСЂРµРјРµРЅРЅС‹Рµ
   */
  const { textVariables, mediaVariables } = useMemo(() => extractVariables(allNodes), [allNodes]);

  /**
   * РҐСѓРє РґР»СЏ СѓРїСЂР°РІР»РµРЅРёСЏ РјРµРґРёР°РїРµСЂРµРјРµРЅРЅС‹РјРё
   */
  const { attachedMediaVariables, handleMediaVariableSelect, handleMediaVariableRemove } = useMediaVariables(
    selectedNode,
    mediaVariables,
    onNodeUpdate
  );

  const commandValidation = useNodeCommandValidation({ selectedNode });

  // РЎРёРЅС…СЂРѕРЅРёР·Р°С†РёСЏ СѓСЃР»РѕРІРЅС‹С… СЃРѕРѕР±С‰РµРЅРёР№ СЃ СѓР·Р»РѕРј condition РЅР° С…РѕР»СЃС‚Рµ
  useConditionalMessagesSync({
    selectedNode,
    allNodes,
    onNodeUpdate,
    onNodeAdd,
    onNodeDelete,
  });

  // РђРІС‚РѕРґРѕРїРѕР»РЅРµРЅРёРµ РєРѕРјР°РЅРґ
  const commandSuggestions = useMemo(() => {
    if (commandInput.length > 0) {
      return getCommandSuggestions(commandInput);
    }
    return STANDARD_COMMANDS.slice(0, 5);
  }, [commandInput]);

  if (!selectedNode) {
    return <EmptyState onClose={onClose} />;
  }

  if (selectedNode.type === 'keyboard') {
    return (
      <aside className="w-full h-full bg-background border-l border-border flex flex-col shadow-lg md:shadow-none overflow-hidden">
        <PropertiesHeader
          selectedNode={selectedNode}
          onNodeTypeChange={onNodeTypeChange}
          onClose={onClose}
          displayNodeId={displayNodeId}
        />
        <div className="flex-1 overflow-y-auto">
          <KeyboardNodeProperties
            selectedNode={selectedNode}
            textVariables={textVariables as Variable[]}
            getAllNodesFromAllSheets={getAllNodesFromAllSheets}
            onNodeUpdate={onNodeUpdate}
            onButtonAdd={onButtonAdd}
            onButtonUpdate={onButtonUpdate}
            onButtonDelete={onButtonDelete}
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

  if (selectedNode.type === 'input') {
    return (
      <aside className="w-full h-full bg-background border-l border-border flex flex-col shadow-lg md:shadow-none overflow-hidden">
        <PropertiesHeader
          selectedNode={selectedNode}
          onNodeTypeChange={onNodeTypeChange}
          onClose={onClose}
          displayNodeId={displayNodeId}
        />
        <div className="flex-1 overflow-y-auto p-4">
          <SaveAnswerProperties
            selectedNode={selectedNode}
            onNodeUpdate={onNodeUpdate}
            getAllNodesFromAllSheets={getAllNodesFromAllSheets}
            formatNodeDisplay={formatNodeDisplay}
            textVariables={textVariables as Variable[]}
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

  return (
    <aside className="w-full h-full bg-background border-l border-border flex flex-col shadow-lg md:shadow-none overflow-hidden">
      {/* Mobile Close Button */}
      <div className="md:hidden flex items-center justify-between p-3 border-b border-border bg-muted/50 sticky top-0 z-10">
        <h3 className="font-semibold text-sm">РќР°СЃС‚СЂРѕР№РєРё СЌР»РµРјРµРЅС‚Р°</h3>
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

          {/* Basic Settings Section - СЃРєСЂС‹С‚Рѕ РґР»СЏ СѓР·Р»Р° СЂР°СЃСЃС‹Р»РєР°, client_auth, С‚СЂРёРіРіРµСЂРѕРІ, СѓСЃР»РѕРІРёСЏ Рё РјРµРґРёР°-РЅРѕРґС‹ */}
          {selectedNode.type !== 'broadcast' && selectedNode.type !== 'client_auth' && selectedNode.type !== 'media' && !isTriggerNode(selectedNode.type) && !isConditionNode(selectedNode.type) && (
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
              allNodes={allNodes}
              onNodeAdd={onNodeAdd}
              onNodeDelete={onNodeDelete}
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

          {/* Broadcast Section - С‚РѕР»СЊРєРѕ РґР»СЏ СѓР·Р»Р° СЂР°СЃСЃС‹Р»РєР° */}
          {selectedNode.type === 'broadcast' && (
            <BroadcastNodeProperties
              node={selectedNode}
              onUpdate={onNodeUpdate}
            />
          )}

          {/* Client Auth Section - С‚РѕР»СЊРєРѕ РґР»СЏ СѓР·Р»Р° Р°РІС‚РѕСЂРёР·Р°С†РёРё Client API */}
          {selectedNode.type === 'client_auth' && (
            <ClientAuthProperties
              node={selectedNode}
            />
          )}

          {/* Media Section - С‚РѕР»СЊРєРѕ РґР»СЏ РјРµРґРёР°-РЅРѕРґС‹ */}
          {selectedNode.type === 'media' && (
            <MediaNodeProperties
              projectId={projectId}
              selectedNode={selectedNode}
              getAllNodesFromAllSheets={getAllNodesFromAllSheets}
              onNodeUpdate={onNodeUpdate}
            />
          )}

          {selectedNode.type === 'forward_message' && (
            <div className="w-full bg-gradient-to-br from-orange-50/40 to-amber-50/20 dark:from-orange-950/30 dark:to-amber-900/20 rounded-xl p-3 sm:p-4 md:p-5 border border-orange-200/40 dark:border-orange-800/40 backdrop-blur-sm">
              <SectionHeader
                title="Переслать сообщение"
                description="Настройки источника сообщения и чата назначения"
                isOpen={isForwardMessageSectionOpen}
                onToggle={() => setIsForwardMessageSectionOpen((prev) => !prev)}
                icon="share"
                iconGradient="from-orange-100 to-amber-100 dark:from-orange-900/50 dark:to-amber-900/50"
                iconColor="text-orange-600 dark:text-orange-400"
              />
              {isForwardMessageSectionOpen && (
                <div className="mt-3 sm:mt-4">
                  <ForwardMessageConfiguration
                    selectedNode={selectedNode}
                    onNodeUpdate={onNodeUpdate}
                    allNodes={allNodes}
                    formatNodeDisplay={formatNodeDisplay}
                    getAllNodesFromAllSheets={getAllNodesFromAllSheets}
                  />
                </div>
              )}
            </div>
          )}

          {selectedNode.type === 'create_forum_topic' && (
            <div className="w-full bg-gradient-to-br from-teal-50/40 to-cyan-50/20 dark:from-teal-950/30 dark:to-cyan-900/20 rounded-xl p-3 sm:p-4 md:p-5 border border-teal-200/40 dark:border-teal-800/40 backdrop-blur-sm">
              <SectionHeader
                title="Создать топик"
                description="Создание топика в форум-группе Telegram"
                isOpen={true}
                onToggle={() => {}}
                icon="layer-group"
                iconGradient="from-teal-100 to-cyan-100 dark:from-teal-900/50 dark:to-cyan-900/50"
                iconColor="text-teal-600 dark:text-teal-400"
              />
              <div className="mt-3 sm:mt-4">
                <CreateForumTopicConfiguration
                  selectedNode={selectedNode}
                  onNodeUpdate={onNodeUpdate}
                  getAllNodesFromAllSheets={getAllNodesFromAllSheets}
                />
              </div>
            </div>
          )}

          {/* Trigger Section - С‚РѕР»СЊРєРѕ РґР»СЏ СѓР·Р»РѕРІ-С‚СЂРёРіРіРµСЂРѕРІ */}
          {isTriggerNode(selectedNode.type) && selectedNode.type === 'command_trigger' && (
            <CommandTriggerConfiguration
              selectedNode={selectedNode}
              onNodeUpdate={onNodeUpdate}
              getAllNodesFromAllSheets={getAllNodesFromAllSheets}
              formatNodeDisplay={formatNodeDisplay}
            />
          )}
          {isTriggerNode(selectedNode.type) && selectedNode.type === 'text_trigger' && (
            <TextTriggerConfiguration
              selectedNode={selectedNode}
              onNodeUpdate={onNodeUpdate}
              getAllNodesFromAllSheets={getAllNodesFromAllSheets}
              formatNodeDisplay={formatNodeDisplay}
            />
          )}
          {isTriggerNode(selectedNode.type) && selectedNode.type === 'incoming_message_trigger' && (
            <AnyMessageTriggerConfiguration />
          )}
          {isTriggerNode(selectedNode.type) && selectedNode.type === 'group_message_trigger' && (
            <GroupMessageTriggerConfiguration
              selectedNode={selectedNode}
              onNodeUpdate={onNodeUpdate}
              getAllNodesFromAllSheets={getAllNodesFromAllSheets}
            />
          )}

          {/* Condition Section вЂ” С‚РѕР»СЊРєРѕ РґР»СЏ СѓР·Р»Р° СѓСЃР»РѕРІРёСЏ */}
          {isConditionNode(selectedNode.type) && (
            <ConditionNodeConfiguration
              selectedNode={selectedNode}
              allNodes={allNodes}
              getAllNodesFromAllSheets={getAllNodesFromAllSheets}
              textVariables={textVariables as Variable[]}
              onNodeUpdate={onNodeUpdate}
            />
          )}

          {/* Message Content - СЃРєСЂС‹С‚Рѕ РґР»СЏ СѓР·Р»РѕРІ СѓРїСЂР°РІР»РµРЅРёСЏ, С‚СЂРёРіРіРµСЂРѕРІ, СѓСЃР»РѕРІРёСЏ Рё РјРµРґРёР°-РЅРѕРґС‹ */}
          {!isManagementNode(selectedNode.type) && !isTriggerNode(selectedNode.type) && !isConditionNode(selectedNode.type) && selectedNode.type !== 'media' && (
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
          {/* Media File Section - СЃРєСЂС‹С‚Рѕ РґР»СЏ СѓР·Р»РѕРІ СѓРїСЂР°РІР»РµРЅРёСЏ, С‚СЂРёРіРіРµСЂРѕРІ, СѓСЃР»РѕРІРёСЏ Рё РјРµРґРёР°-РЅРѕРґС‹ */}
          {!isManagementNode(selectedNode.type) && !isTriggerNode(selectedNode.type) && !isConditionNode(selectedNode.type) && selectedNode.type !== 'media' && (
            <MediaFileSection
              projectId={projectId}
              selectedNode={selectedNode}
              isOpen={isMediaSectionOpen}
              onToggle={() => setIsMediaSectionOpen(!isMediaSectionOpen)}
              onNodeUpdate={onNodeUpdate}
              getAllNodesFromAllSheets={getAllNodesFromAllSheets}
            />
          )}

          {/* Keyboard Section - СЃРєСЂС‹С‚Рѕ РґР»СЏ СѓР·Р»РѕРІ СѓРїСЂР°РІР»РµРЅРёСЏ, С‚СЂРёРіРіРµСЂРѕРІ, СѓСЃР»РѕРІРёСЏ Рё РјРµРґРёР°-РЅРѕРґС‹ */}
          {selectedNode.type !== 'message' && !isManagementNode(selectedNode.type) && !isTriggerNode(selectedNode.type) && !isConditionNode(selectedNode.type) && selectedNode.type !== 'media' && (
            <div className="w-full bg-gradient-to-br from-amber-50/40 to-yellow-50/20 dark:from-amber-950/30 dark:to-yellow-900/20 rounded-xl p-3 sm:p-4 md:p-5 border border-amber-200/40 dark:border-amber-800/40 backdrop-blur-sm">
              <KeyboardSectionHeader
                selectedNode={selectedNode}
                isOpen={isKeyboardSectionOpen}
                onToggle={() => setIsKeyboardSectionOpen(!isKeyboardSectionOpen)}
              />

              {/* РџРµСЂРµРєР»СЋС‡Р°С‚РµР»Рё С‚РёРїР° РєР»Р°РІРёР°С‚СѓСЂС‹ - РІСЃРµРіРґР° РІРёРґРЅС‹ */}
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
                    title="При включении клавиатуры"
                    description="Только первый файл будет отображаться и отправляться. Остальные файлы сохранятся. Нажмите «Включить все файлы», чтобы использовать все медиа, но клавиатура при этом отключится."
                  />
                </div>
              )}

              {isKeyboardSectionOpen && (
                <div className="space-y-3 sm:space-y-4">
                  {selectedNode.data.keyboardType !== 'none' && (
                    <>
                      {/* РњРЅРѕР¶РµСЃС‚РІРµРЅРЅС‹Р№ РІС‹Р±РѕСЂ */}
                      <div className="p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-50/40 to-cyan-50/30 dark:from-blue-950/20 dark:to-cyan-950/10 border border-blue-200/40 dark:border-blue-800/30">
                        <MultipleSelectionSettings
                          selectedNode={selectedNode}
                          keyboardType={selectedNode.data.keyboardType as 'inline' | 'reply'}
                          onNodeUpdate={onNodeUpdate}
                        />
                      </div>

                      {/* РљРЅРѕРїРєРё РґРѕР±Р°РІР»РµРЅРёСЏ */}
                      <KeyboardButtonsSection
                        selectedNode={selectedNode}
                        onButtonAdd={onButtonAdd}
                      />

                      {/* РЎРїРёСЃРѕРє РєРЅРѕРїРѕРє */}
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
                              keyboardType={selectedNode.data.keyboardType as string}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {selectedNode.data.keyboardType !== 'none' && selectedNode.data.buttons && selectedNode.data.buttons.length > 0 && (
                    <KeyboardLayoutEditor
                      buttons={(() => {
                        // Р”РѕР±Р°РІР»СЏРµРј РІРёСЂС‚СѓР°Р»СЊРЅСѓСЋ РєРЅРѕРїРєСѓ "Р“РѕС‚РѕРІРѕ" РґР»СЏ РѕС‚РѕР±СЂР°Р¶РµРЅРёСЏ
                        const allButtons = [...selectedNode.data.buttons];
                        if (selectedNode.data.allowMultipleSelection) {
                          const hasCompleteButton = allButtons.some((b: any) => b.action === 'complete');
                          if (!hasCompleteButton) {
                            allButtons.push({
                              id: 'done-button',
                              text: 'вњ… Р“РѕС‚РѕРІРѕ',
                              action: 'complete' as const,
                              target: '',
                              buttonType: 'complete' as const,
                              skipDataCollection: false,
                              hideAfterClick: false
                            });
                          }
                        }
                        return allButtons;
                      })()}
                      initialLayout={(() => {
                        // Р•СЃР»Рё РµСЃС‚СЊ РјРЅРѕР¶РµСЃС‚РІРµРЅРЅС‹Р№ РІС‹Р±РѕСЂ Рё РЅРµС‚ РєРЅРѕРїРєРё complete, РґРѕР±Р°РІР»СЏРµРј done-button РІ layout
                        const layout = selectedNode.data.keyboardLayout;
                        if (!layout) return undefined;

                        if (selectedNode.data.allowMultipleSelection) {
                          const hasCompleteButton = selectedNode.data.buttons.some((b: any) => b.action === 'complete');
                          if (!hasCompleteButton) {
                            // Р”РѕР±Р°РІР»СЏРµРј done-button РІ РїРѕСЃР»РµРґРЅРёР№ СЂСЏРґ РёР»Рё СЃРѕР·РґР°С‘Рј РЅРѕРІС‹Р№
                            const layoutWithDone = { ...layout };
                            const allButtonIds = layoutWithDone.rows.flatMap(r => r.buttonIds);

                            // Р•СЃР»Рё done-button СѓР¶Рµ РµСЃС‚СЊ РІ layout, РЅРµ РґРѕР±Р°РІР»СЏРµРј
                            if (!allButtonIds.includes('done-button')) {
                              if (layout.autoLayout) {
                                // Р’ Р°РІС‚Рѕ-СЂРµР¶РёРјРµ РїСЂРѕСЃС‚Рѕ РґРѕР±Р°РІР»СЏРµРј РІ РєРѕРЅРµС†
                                const lastRow = layoutWithDone.rows[layoutWithDone.rows.length - 1];
                                if (lastRow && lastRow.buttonIds.length < layout.columns) {
                                  lastRow.buttonIds.push('done-button');
                                } else {
                                  layoutWithDone.rows.push({ buttonIds: ['done-button'] });
                                }
                              } else {
                                // Р’ СЂСѓС‡РЅРѕРј СЂРµР¶РёРјРµ РґРѕР±Р°РІР»СЏРµРј РІ РѕС‚РґРµР»СЊРЅС‹Р№ СЂСЏРґ
                                layoutWithDone.rows.push({ buttonIds: ['done-button'] });
                              }
                            }

                            return layoutWithDone;
                          }
                        }

                        return layout;
                      })()}
                      onLayoutChange={(layout) => {
                        // РЎРѕС…СЂР°РЅСЏРµРј layout СЃ done-button, С‡С‚РѕР±С‹ РѕРЅ РѕС‚РѕР±СЂР°Р¶Р°Р»СЃСЏ РЅР° РєР°РЅРІР°СЃРµ
                        onNodeUpdate(selectedNode.id, { keyboardLayout: layout });
                      }}
                    />
                  )}
              </div>
            )}
          </div>
        )}

        {/* Universal User Input Collection - СЃРєСЂС‹С‚Рѕ РґР»СЏ СѓР·Р»РѕРІ СѓРїСЂР°РІР»РµРЅРёСЏ, С‚СЂРёРіРіРµСЂРѕРІ, СѓСЃР»РѕРІРёСЏ Рё РјРµРґРёР°-РЅРѕРґС‹ */}
          {!isManagementNode(selectedNode.type) && !isTriggerNode(selectedNode.type) && !isConditionNode(selectedNode.type) && selectedNode.type !== 'media' && (
            <UserInputSettingsSection
              selectedNode={selectedNode}
              getAllNodesFromAllSheets={getAllNodesFromAllSheets}
              isOpen={isUserInputSectionOpen}
              onToggle={() => setIsUserInputSectionOpen((prev) => !prev)}
              onNodeUpdate={onNodeUpdate}
              formatNodeDisplay={formatNodeDisplay}
              onNodeAdd={onNodeAdd}
            />
          )}

        {/* Р Р°СЃС€РёСЂРµРЅРЅС‹Рµ РЅР°СЃС‚СЂРѕР№РєРё */}
        <CommandAdvancedSettingsWrapper
          selectedNode={selectedNode}
          onNodeUpdate={onNodeUpdate}
          isOpen={isAdvancedSettingsOpen}
          onToggle={() => setIsAdvancedSettingsOpen(!isAdvancedSettingsOpen)}
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





