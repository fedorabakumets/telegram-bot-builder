/**
 * @fileoverview Секция настроек сбора ответов и управления связью `message` с `input`-узлом.
 */

import { useEffect, useMemo } from 'react';
import type { Node } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { SectionHeader } from '../layout/section-header';
import { MediaInputToggles } from '../media/media-input-toggles';
import { VariableInputGrid } from '../variables/variable-input-grid';
import { ButtonTypeSelector } from '../keyboard/button-type-selector';
import { ResponseOptionsList } from '../common/response-options-list';
import { InputNavigationGrid } from '../navigation/input-navigation-grid';
import { extractVariables } from '../../utils/variables-utils';
import {
  createInputNodeFromMessage,
  getMessageInputCollectionState,
} from '../../utils/linked-input-node';
import type { NodeWithSheet } from '../../utils/node-utils';
import type { Variable } from '../../../inline-rich/types';

/**
 * Свойства секции настроек сбора ответов.
 */
interface UserInputSettingsSectionProps {
  /** Выбранный узел. */
  selectedNode: Node;
  /** Все узлы всех листов для навигации и поиска связей. */
  getAllNodesFromAllSheets: NodeWithSheet[];
  /** Флаг открытости секции. */
  isOpen: boolean;
  /** Переключение открытости секции. */
  onToggle: () => void;
  /** Обновление данных узла. */
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
  /** Форматирование подписи узла для выпадающих списков. */
  formatNodeDisplay: (node: Node, sheetName: string) => string;
  /** Добавление нового узла на холст. */
  onNodeAdd?: (node: Node) => void;
}

/**
 * Секция настроек сбора ответов или связи `message` с отдельным `input`-узлом.
 *
 * @param {UserInputSettingsSectionProps} props - Свойства компонента.
 * @returns {JSX.Element} Секция настроек сбора ответов.
 */
export function UserInputSettingsSection({
  selectedNode,
  getAllNodesFromAllSheets,
  isOpen,
  onToggle,
  onNodeUpdate,
  formatNodeDisplay,
  onNodeAdd,
}: UserInputSettingsSectionProps) {
  const isMessageNode = selectedNode.type === 'message';

  const availableVariables = useMemo(() => {
    const nodes = getAllNodesFromAllSheets.map((entry) => entry.node);
    const { textVariables } = extractVariables(nodes);

    return textVariables.map((variable) => ({
      name: variable.name,
      nodeId: variable.nodeId,
      nodeType: variable.nodeType as Variable['nodeType'],
      description: variable.description,
      sourceTable: variable.sourceTable,
    }));
  }, [getAllNodesFromAllSheets]);

  const messageInputState = useMemo(
    () => (isMessageNode ? getMessageInputCollectionState(selectedNode, getAllNodesFromAllSheets) : null),
    [getAllNodesFromAllSheets, isMessageNode, selectedNode]
  );

  useEffect(() => {
    if (isMessageNode && (messageInputState?.isEnabled || messageInputState?.isLegacy) && !isOpen) {
      onToggle();
      return;
    }

    if (!isMessageNode && selectedNode.data.collectUserInput && !isOpen) {
      onToggle();
    }
  }, [
    isMessageNode,
    isOpen,
    messageInputState?.isEnabled,
    messageInputState?.isLegacy,
    onToggle,
    selectedNode.data.collectUserInput,
  ]);

  const linkedSummary = messageInputState?.summary ?? null;

  const inputNodes = useMemo(
    () => getAllNodesFromAllSheets.filter(({ node }) => node.type === 'input' && node.id !== selectedNode.id),
    [getAllNodesFromAllSheets, selectedNode.id]
  );

  const handleCreateInputNode = () => {
    if (!onNodeAdd) {
      onNodeUpdate(selectedNode.id, {
        collectUserInput: true,
        enableAutoTransition: false,
        autoTransitionTo: '',
      });
      return;
    }

    const newInputNode = createInputNodeFromMessage(selectedNode, inputNodes.length);

    onNodeAdd(newInputNode);

    onNodeUpdate(selectedNode.id, {
      collectUserInput: true,
      enableAutoTransition: true,
      autoTransitionTo: newInputNode.id,
    });
  };

  const handleCollectionToggle = (checked: boolean) => {
    if (!isMessageNode) {
      if (checked && selectedNode.data.enableAutoTransition) {
        onNodeUpdate(selectedNode.id, { enableAutoTransition: false });
      }
      onNodeUpdate(selectedNode.id, { collectUserInput: checked });
      return;
    }

    if (!checked) {
      onNodeUpdate(selectedNode.id, {
        collectUserInput: false,
        enableAutoTransition: false,
        autoTransitionTo: '',
      });
      return;
    }

    if (messageInputState?.isLinked && linkedSummary?.nodeId) {
      onNodeUpdate(selectedNode.id, {
        collectUserInput: true,
        enableAutoTransition: true,
        autoTransitionTo: linkedSummary.nodeId,
      });
      return;
    }

    handleCreateInputNode();
  };

  const handleLinkedInputSelect = (value: string) => {
    if (!isMessageNode) return;

    if (value === 'no-input') {
      onNodeUpdate(selectedNode.id, {
        collectUserInput: false,
        enableAutoTransition: false,
        autoTransitionTo: '',
      });
      return;
    }

    onNodeUpdate(selectedNode.id, {
      collectUserInput: true,
      enableAutoTransition: true,
      autoTransitionTo: value,
    });
  };

  return (
    <div className="w-full bg-gradient-to-br from-blue-50/40 to-cyan-50/20 dark:from-blue-950/30 dark:to-cyan-900/20 rounded-xl p-3 sm:p-4 md:p-5 border border-blue-200/40 dark:border-blue-800/40 backdrop-blur-sm">
      <SectionHeader
        title={isMessageNode ? 'Ответ пользователя' : 'Сбор ответов'}
        description={isMessageNode ? 'Управление связанным узлом сохранения ответа' : 'Собирать ввод пользователя в переменные'}
        isOpen={isOpen}
        onToggle={onToggle}
        icon={isMessageNode ? 'link' : 'inbox'}
        iconGradient={isMessageNode ? 'from-cyan-100 to-sky-100 dark:from-cyan-900/50 dark:to-sky-900/50' : 'from-blue-100 to-cyan-100 dark:from-blue-900/50 dark:to-cyan-900/50'}
        iconColor={isMessageNode ? 'text-cyan-600 dark:text-cyan-400' : 'text-blue-600 dark:text-blue-400'}
        descriptionColor={isMessageNode ? 'text-cyan-700/70 dark:text-cyan-300/70' : 'text-blue-700/70 dark:text-blue-300/70'}
      />

      {isOpen && (
        <div className={`space-y-3 sm:space-y-4 rounded-xl p-3 sm:p-4 md:p-5 border ${isMessageNode ? 'bg-gradient-to-br from-cyan-50/40 to-sky-50/20 dark:from-cyan-950/15 dark:to-sky-950/5 border-cyan-200/25 dark:border-cyan-800/25' : 'bg-gradient-to-br from-blue-50/40 to-indigo-50/20 dark:from-blue-950/15 dark:to-indigo-950/5 border-blue-200/25 dark:border-blue-800/25'}`}>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/40 dark:border-slate-800/50 bg-white/70 dark:bg-slate-950/30 px-3 py-3">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">{isMessageNode ? 'Сбор ответа' : 'Сбор ответа'}</Label>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isMessageNode
                  ? 'Связать сообщение с отдельным узлом сохранения ответа'
                  : 'Собирать ввод пользователя в переменные'}
              </p>
            </div>
            <Switch
              checked={isMessageNode ? (messageInputState?.isEnabled ?? false) : (selectedNode.data.collectUserInput ?? false)}
              onCheckedChange={handleCollectionToggle}
            />
          </div>

          {isMessageNode && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Связанный узел сохранения ответа</Label>
              <Select
                value={messageInputState?.isLinked && linkedSummary ? linkedSummary.nodeId : 'no-input'}
                onValueChange={handleLinkedInputSelect}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Выберите input-узел" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-input">Без связи</SelectItem>
                  {inputNodes.map(({ node, sheetName }) => (
                    <SelectItem key={`${sheetName}-${node.id}`} value={node.id}>
                      {formatNodeDisplay(node, sheetName)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {isMessageNode && messageInputState?.isLinked && linkedSummary ? (
            <div className="space-y-2 rounded-xl border border-cyan-200/60 dark:border-cyan-800/50 bg-white/70 dark:bg-slate-950/30 px-3 py-3">
              <div className="text-xs font-medium text-cyan-700 dark:text-cyan-300">
                Связь активна
              </div>
              <div className="grid gap-1 text-xs text-slate-600 dark:text-slate-300">
                <div>ID: {linkedSummary.nodeId}</div>
                <div>Лист: {linkedSummary.sheetName}</div>
                <div>Переменная: {linkedSummary.inputVariable || 'не задана'}</div>
                <div>Источник: {linkedSummary.inputType}</div>
                <div>Режим: {linkedSummary.appendVariable ? 'добавление' : 'замена'}</div>
                <div>Следующий узел: {linkedSummary.inputTargetNodeId || 'не задан'}</div>
              </div>
            </div>
          ) : isMessageNode && messageInputState?.isLegacy ? (
            <div className="space-y-2 rounded-xl border border-dashed border-cyan-200/60 dark:border-cyan-800/50 bg-white/50 dark:bg-slate-950/20 px-3 py-3">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Старые настройки ввода будут перенесены в новый `input` при создании.
              </div>
              <div className="grid gap-1 text-xs text-slate-600 dark:text-slate-300">
                <div>Переменная: {linkedSummary?.inputVariable || 'не задана'}</div>
                <div>Источник: {linkedSummary?.inputType || 'any'}</div>
                <div>Следующий узел: {linkedSummary?.inputTargetNodeId || 'не задан'}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {onNodeAdd && (
                  <Button type="button" variant="secondary" size="sm" onClick={handleCreateInputNode}>
                    Мигрировать в новый `input`
                  </Button>
                )}
              </div>
            </div>
          ) : isMessageNode ? (
            <div className="space-y-2 rounded-xl border border-dashed border-cyan-200/60 dark:border-cyan-800/50 bg-white/50 dark:bg-slate-950/20 px-3 py-3">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Связанный `input`-узел не найден. Можно создать новый или выбрать существующий.
              </div>
              <div className="flex flex-wrap gap-2">
                {onNodeAdd && (
                  <Button type="button" variant="secondary" size="sm" onClick={handleCreateInputNode}>
                    Создать узел сохранения ответа
                  </Button>
                )}
              </div>
            </div>
          ) : null}

          {!isMessageNode && selectedNode.data.collectUserInput && (
            <>
              {/* Временный переключатель "Не перезаписывать" */}
              {/* <AppendVariableToggle
                selectedNode={selectedNode}
                onNodeUpdate={onNodeUpdate}
              /> */}

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
                availableVariables={availableVariables}
              />
            </>
          )}
        </div>
      )}

      {isOpen && !isMessageNode && !selectedNode.data.collectUserInput && (
        <div className="space-y-3 sm:space-y-4 bg-gradient-to-br from-blue-50/40 to-indigo-50/20 dark:from-blue-950/15 dark:to-indigo-950/5 border border-blue-200/25 dark:border-blue-800/25 rounded-xl p-3 sm:p-4 md:p-5">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Включите сбор ответа, чтобы настроить переменные, медиа и переходы после ввода.
          </div>
        </div>
      )}
    </div>
  );
}
