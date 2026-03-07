/**
 * @fileoverview Секция основных настроек
 * 
 * Компонент отображает базовые настройки узла: команды, синонимы, управление.
 */

import { SectionHeader } from '../layout/section-header';
import { SynonymEditor } from '../synonyms/synonym-editor';
import { CommandSectionComplete } from '../commands/command-section-complete';
import { ManagementCommandSection } from '../commands/management-command-section';
import { NodeTypeConfigurations } from './node-type-configurations';
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
  /** Компоненты конфигурации узлов */
  StickerConfiguration: any;
  VoiceConfiguration: any;
  AnimationConfiguration: any;
  LocationCoordinatesSection: any;
  LocationDetailsSection: any;
  FoursquareIntegrationSection: any;
  MapServicesSection: any;
  ContactConfiguration: any;
  BroadcastNodeProperties: any;
  ContentManagementConfiguration: any;
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
  StickerConfiguration,
  VoiceConfiguration,
  AnimationConfiguration,
  LocationCoordinatesSection,
  LocationDetailsSection,
  FoursquareIntegrationSection,
  MapServicesSection,
  ContactConfiguration,
  BroadcastNodeProperties,
  ContentManagementConfiguration,
  UserManagementConfiguration,
  AdminRightsInfo
}: BasicSettingsSectionProps) {
  return (
    <div className="space-y-3 sm:space-y-4">
      <SectionHeader
        title="Основные настройки"
        isOpen={isOpen}
        onToggle={onToggle}
        icon="sliders-h"
        iconGradient="from-slate-100 to-slate-200 dark:from-slate-900/50 dark:to-slate-800/50"
        iconColor="text-slate-600 dark:text-slate-400"
      />
      {isOpen && (
        <div className="space-y-3 sm:space-y-4 bg-gradient-to-br from-slate-50/30 to-slate-100/20 dark:from-slate-950/30 dark:to-slate-900/20 rounded-xl p-3 sm:p-4 border border-slate-200/30 dark:border-slate-800/30 backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-300">

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
                synonyms={selectedNode.data.synonyms || []}
                onUpdate={(synonyms) => onNodeUpdate(selectedNode.id, { synonyms })}
                title="Синонимы"
                description="Дополнительные текстовые варианты для вызова этого экрана. Например: старт, привет, начать"
                placeholder="Например: старт, привет, начать"
              />
            </div>
          )}

          {(selectedNode.type === 'pin_message' || selectedNode.type === 'unpin_message' || selectedNode.type === 'delete_message' ||
            selectedNode.type === 'ban_user' || selectedNode.type === 'unban_user' || selectedNode.type === 'mute_user' ||
            selectedNode.type === 'unmute_user' || selectedNode.type === 'kick_user' || selectedNode.type === 'promote_user' ||
            selectedNode.type === 'demote_user' || selectedNode.type === 'admin_rights') && (
            <ManagementCommandSection
              selectedNode={selectedNode}
              onNodeUpdate={onNodeUpdate}
            />
          )}

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
            BroadcastNodeProperties={BroadcastNodeProperties}
            ContentManagementConfiguration={ContentManagementConfiguration}
            UserManagementConfiguration={UserManagementConfiguration}
            AdminRightsInfo={AdminRightsInfo}
          />

        </div>
      )}
    </div>
  );
}
