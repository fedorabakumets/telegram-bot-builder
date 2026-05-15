/**
 * @fileoverview Панель настройки триггера нажатия inline-кнопки (callback_trigger)
 *
 * Позволяет выбрать callback_data из существующих кнопок проекта
 * или ввести вручную, задать тип совпадения и следующий узел.
 *
 * @module components/editor/properties/components/trigger/CallbackTriggerConfiguration
 */

import { useMemo, useCallback } from 'react';
import type { Node } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TriggerTargetSelector } from './TriggerTargetSelector';
import { formatNodeDisplay as defaultFormatNodeDisplay } from '../../utils/node-formatters';
import {
  CallbackVariableExtraction,
  parseTemplatePlaceholders,
  type CallbackVariableMapping,
} from './CallbackVariableExtraction';

/**
 * Пропсы компонента CallbackTriggerConfiguration
 */
interface CallbackTriggerConfigurationProps {
  /** Выбранный узел типа callback_trigger */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
  /** Все узлы из всех листов для выбора перехода и сбора callback'ов */
  getAllNodesFromAllSheets?: Array<{ node: Node; sheetId?: string; sheetName?: string }>;
  /** Форматирование названия узла в селекторе */
  formatNodeDisplay?: (node: Node, sheetName?: string) => string;
}

/**
 * Элемент списка существующих callback'ов
 */
interface CallbackOption {
  /** Значение callback_data */
  value: string;
  /** Отображаемая метка с текстом кнопки */
  label: string;
  /** ID узла-источника */
  nodeId: string;
}

/**
 * Компонент настройки узла триггера нажатия inline-кнопки.
 *
 * Отображает: селектор существующих callback'ов из проекта,
 * поле ручного ввода, тип совпадения и селектор следующего узла.
 *
 * @param props - Пропсы компонента
 * @returns JSX-элемент панели настроек триггера
 */
export function CallbackTriggerConfiguration({
  selectedNode,
  onNodeUpdate,
  getAllNodesFromAllSheets,
  formatNodeDisplay = defaultFormatNodeDisplay,
}: CallbackTriggerConfigurationProps) {
  /** Текущее значение callback_data */
  const callbackData: string = (selectedNode.data as any)?.callbackData ?? '';

  /** Текущий тип совпадения */
  const matchType: string = (selectedNode.data as any)?.matchType ?? 'exact';

  /** Шаблон разбора callback_data */
  const callbackParseTemplate: string = (selectedNode.data as any)?.callbackParseTemplate ?? '';

  /** Массив маппингов переменных */
  const callbackSaveVariables: CallbackVariableMapping[] =
    (selectedNode.data as any)?.callbackSaveVariables ?? [];

  /** Включено ли извлечение переменных (определяется наличием шаблона) */
  const extractionEnabled: boolean = Boolean(callbackParseTemplate);

  /**
   * Переключает режим извлечения переменных
   * @param enabled - Новое состояние чекбокса
   */
  const handleExtractionToggle = useCallback((enabled: boolean) => {
    if (!enabled) {
      onNodeUpdate(selectedNode.id, {
        callbackParseTemplate: '',
        callbackSaveVariables: [],
      });
    } else {
      onNodeUpdate(selectedNode.id, {
        callbackParseTemplate: callbackData || '',
      });
    }
  }, [selectedNode.id, callbackData, onNodeUpdate]);

  /**
   * Обновляет шаблон и синхронизирует маппинг переменных
   * @param template - Новый шаблон разбора
   */
  const handleTemplateChange = useCallback((template: string) => {
    const placeholders = parseTemplatePlaceholders(template);
    const newMappings: CallbackVariableMapping[] = placeholders.map(ph => {
      const existing = callbackSaveVariables.find(v => v.templateVar === ph);
      return existing ?? { templateVar: ph, saveAs: ph };
    });
    onNodeUpdate(selectedNode.id, {
      callbackParseTemplate: template,
      callbackSaveVariables: newMappings,
    });
  }, [selectedNode.id, callbackSaveVariables, onNodeUpdate]);

  /**
   * Переименовывает переменную для сохранения по индексу
   * @param index - Индекс переменной в массиве плейсхолдеров
   * @param newSaveAs - Новое имя для сохранения
   */
  const handleVariableRename = useCallback((index: number, newSaveAs: string) => {
    const placeholders = parseTemplatePlaceholders(callbackParseTemplate);
    const newMappings: CallbackVariableMapping[] = placeholders.map((ph, idx) => {
      const existing = callbackSaveVariables.find(v => v.templateVar === ph);
      if (idx === index) {
        return { templateVar: ph, saveAs: newSaveAs };
      }
      return existing ?? { templateVar: ph, saveAs: ph };
    });
    onNodeUpdate(selectedNode.id, { callbackSaveVariables: newMappings });
  }, [selectedNode.id, callbackParseTemplate, callbackSaveVariables, onNodeUpdate]);

  /**
   * Собирает уникальные customCallbackData из кнопок всех узлов на холсте
   */
  const existingCallbacks = useMemo((): CallbackOption[] => {
    const result: CallbackOption[] = [];
    const seen = new Set<string>();

    getAllNodesFromAllSheets?.forEach(({ node }) => {
      const buttons: any[] = (node.data as any)?.buttons || [];
      buttons.forEach(btn => {
        if (btn.customCallbackData && !seen.has(btn.customCallbackData)) {
          seen.add(btn.customCallbackData);
          result.push({
            value: btn.customCallbackData,
            label: `${btn.customCallbackData} (${btn.text || 'кнопка'})`,
            nodeId: node.id,
          });
        }
      });
    });

    return result;
  }, [getAllNodesFromAllSheets]);

  return (
    <div className="space-y-4 p-4">
      {/* Блок выбора callback_data */}
      <div className="space-y-2">
        <Label>callback_data</Label>

        {/* Селектор существующих callback'ов из проекта */}
        <Select
          value={callbackData}
          onValueChange={value => onNodeUpdate(selectedNode.id, { callbackData: value })}
        >
          <SelectTrigger className="text-sm bg-white/70 dark:bg-slate-950/60 border border-orange-300/40 dark:border-orange-700/40 hover:border-orange-400/60 dark:hover:border-orange-600/60 focus:border-orange-500 focus:ring-2 focus:ring-orange-400/30 rounded-lg text-orange-900 dark:text-orange-50">
            <SelectValue placeholder="Выбрать из существующих" />
          </SelectTrigger>
          <SelectContent className="bg-gradient-to-br from-orange-50/95 to-amber-50/90 dark:from-slate-900/95 dark:to-slate-800/95 max-h-48 overflow-y-auto">
            {existingCallbacks.length > 0 ? (
              existingCallbacks.map(opt => (
                <SelectItem key={`${opt.nodeId}-${opt.value}`} value={opt.value}>
                  <span className="text-xs font-mono text-orange-700 dark:text-orange-300 truncate">
                    {opt.label}
                  </span>
                </SelectItem>
              ))
            ) : (
              <SelectItem value="__empty__" disabled>
                Нет кнопок с callback_data
              </SelectItem>
            )}
          </SelectContent>
        </Select>

        {/* Поле ручного ввода callback_data */}
        <Input
          value={callbackData}
          onChange={e => onNodeUpdate(selectedNode.id, { callbackData: e.target.value })}
          placeholder="my_callback"
          className="font-mono"
        />
      </div>

      {/* Тип совпадения */}
      <div className="space-y-2">
        <Label>Тип совпадения</Label>
        <Select
          value={matchType}
          onValueChange={value => onNodeUpdate(selectedNode.id, { matchType: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="exact">Точное совпадение</SelectItem>
            <SelectItem value="startswith">Начинается с</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Извлечение переменных из callback */}
      <CallbackVariableExtraction
        enabled={extractionEnabled}
        parseTemplate={callbackParseTemplate}
        saveVariables={callbackSaveVariables}
        onToggle={handleExtractionToggle}
        onTemplateChange={handleTemplateChange}
        onVariableRename={handleVariableRename}
      />

      {/* Следующий узел */}
      <TriggerTargetSelector
        selectedNode={selectedNode}
        autoTransitionTo={selectedNode.data?.autoTransitionTo || ''}
        getAllNodesFromAllSheets={getAllNodesFromAllSheets}
        onNodeUpdate={onNodeUpdate}
        formatNodeDisplay={formatNodeDisplay}
      />
    </div>
  );
}
