/**
 * @fileoverview Панель свойств узла "Редактировать сообщение"
 * @module properties/components/action/EditMessageConfiguration
 */
import { useMemo } from 'react';
import type { Node } from '@shared/schema';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { InlineRichEditor } from '@/components/editor/inline-rich/inline-rich-editor';
import { extractVariables } from '../../utils/variables-utils';
import type { Variable } from '@/components/editor/inline-rich/types';

/** Пропсы компонента EditMessageConfiguration */
interface EditMessageConfigurationProps {
  /** Выбранный узел */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
  /** Все узлы из всех листов */
  getAllNodesFromAllSheets?: Array<{ node: Node; sheetId?: string; sheetName?: string }>;
}

/**
 * Панель свойств узла редактирования сообщения.
 * Позволяет настроить режим редактирования, новый текст и источник ID сообщения.
 *
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function EditMessageConfiguration({
  selectedNode,
  onNodeUpdate,
  getAllNodesFromAllSheets = [],
}: EditMessageConfigurationProps) {
  const data = selectedNode.data as any;

  /** Список всех узлов для извлечения переменных */
  const allNodes = useMemo(
    () => getAllNodesFromAllSheets.map(({ node }) => node),
    [getAllNodesFromAllSheets]
  );
  const { textVariables, mediaVariables } = useMemo(() => extractVariables(allNodes), [allNodes]);

  /**
   * Обновляет поле данных узла
   * @param field - Имя поля
   * @param value - Новое значение
   */
  const update = (field: string, value: any) =>
    onNodeUpdate(selectedNode.id, { [field]: value });

  const editMode: string = data.editMode ?? 'text';
  const showText = editMode !== 'markup';
  const showKeyboard = editMode === 'markup' || editMode === 'both';  return (
    <div className="space-y-4 p-4">

      {/* Новый текст — InlineRichEditor как в узле сообщения */}
      {showText && (
        <div className="rounded-xl bg-slate-50/40 dark:bg-slate-900/10 border border-slate-200/40 dark:border-slate-700/30 p-4 space-y-3">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            Новый текст
          </p>
          <InlineRichEditor
            value={data.editMessageText ?? ''}
            onChange={(v) => update('editMessageText', v)}
            placeholder="Введите новый текст сообщения..."
            enableMarkdown={data.editFormatMode === 'markdown'}
            onFormatModeChange={(mode) => update('editFormatMode', mode)}
            availableVariables={[...textVariables, ...mediaVariables] as Variable[]}
            allNodes={allNodes}
          />
        </div>
      )}

      {/* Источник сообщения */}
      <div className="rounded-xl bg-slate-50/40 dark:bg-slate-900/10 border border-slate-200/40 dark:border-slate-700/30 p-4 space-y-3">
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
          Источник сообщения
        </p>
        <div className="flex flex-col gap-2">
          {[
            { value: 'current_message', label: 'Текущее сообщение' },
            { value: 'variable', label: 'Из переменной' },
            { value: 'manual', label: 'Вручную' },
          ].map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={`editMessageIdSource_${selectedNode.id}`}
                value={value}
                checked={(data.editMessageIdSource ?? 'current_message') === value}
                onChange={() => update('editMessageIdSource', value)}
                className="accent-blue-500"
              />
              <span className="text-xs text-slate-600 dark:text-slate-400">{label}</span>
            </label>
          ))}
        </div>
        {data.editMessageIdSource === 'variable' && (
          <Input
            value={data.editMessageIdVariable ?? ''}
            onChange={(e) => update('editMessageIdVariable', e.target.value)}
            placeholder="Имя переменной с ID сообщения"
            className="text-sm h-8"
          />
        )}
        {data.editMessageIdSource === 'manual' && (
          <Input
            value={data.editMessageIdManual ?? ''}
            onChange={(e) => update('editMessageIdManual', e.target.value)}
            placeholder="ID сообщения"
            className="text-sm h-8"
          />
        )}
      </div>

      {/* Убрать клавиатуру */}
      {showKeyboard && (
        <div className="rounded-xl bg-slate-50/40 dark:bg-slate-900/10 border border-slate-200/40 dark:border-slate-700/30 p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-xs text-slate-600 dark:text-slate-400">Убрать клавиатуру</Label>
              <p className="text-[10px] text-slate-400">Удалить inline-кнопки из сообщения</p>
            </div>
            <Switch
              checked={!!data.editRemoveKeyboard}
              onCheckedChange={(v) => update('editRemoveKeyboard', v)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
