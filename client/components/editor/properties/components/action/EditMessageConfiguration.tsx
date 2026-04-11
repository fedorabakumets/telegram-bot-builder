/**
 * @fileoverview Панель свойств узла "Редактировать сообщение"
 * @module properties/components/action/EditMessageConfiguration
 */
import { useMemo } from 'react';
import type { Node } from '@shared/schema';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InlineRichEditor } from '@/components/editor/inline-rich/inline-rich-editor';
import { extractVariables } from '../../utils/variables-utils';
import { VariableSelector } from '../variables/variable-selector';
import type { Variable } from '@/components/editor/inline-rich/types';

/** Пропсы компонента EditMessageConfiguration */
interface EditMessageConfigurationProps {
  /** Выбранный узел */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
  /** Все узлы из всех листов */
  getAllNodesFromAllSheets?: Array<{ node: Node; sheetId?: string; sheetName?: string }>;
  /** Все узлы текущего листа */
  allNodes?: Node[];
  /** Функция форматирования отображения узла */
  formatNodeDisplay?: (node: Node) => string;
}

/**
 * Панель свойств узла редактирования сообщения.
 * Позволяет настроить текст, источник ID сообщения и управление клавиатурой.
 *
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function EditMessageConfiguration({
  selectedNode,
  onNodeUpdate,
  getAllNodesFromAllSheets = [],
  allNodes = [],
}: EditMessageConfigurationProps) {
  const data = selectedNode.data as any;

  /** Список всех узлов для извлечения переменных */
  const allNodesFromSheets = useMemo(
    () => getAllNodesFromAllSheets.map(({ node }) => node),
    [getAllNodesFromAllSheets]
  );
  const { textVariables, mediaVariables } = useMemo(
    () => extractVariables(allNodesFromSheets),
    [allNodesFromSheets]
  );

  /** Узлы типа keyboard доступные для выбора */
  const keyboardNodes = useMemo(
    () => allNodes.filter(n => n.type === 'keyboard' && n.id !== selectedNode.id),
    [allNodes, selectedNode.id]
  );

  /**
   * Обновляет поле данных узла
   * @param field - Имя поля
   * @param value - Новое значение
   */
  const update = (field: string, value: any) =>
    onNodeUpdate(selectedNode.id, { [field]: value });

  const keyboardMode: string = data.editKeyboardMode ?? 'keep';

  return (
    <div className="space-y-4 p-4">

      {/* Новый текст */}
      <InlineRichEditor
        value={data.editMessageText ?? ''}
        onChange={(v) => update('editMessageText', v)}
        placeholder="Введите новый текст сообщения..."
        enableMarkdown={data.editFormatMode === 'markdown'}
        onFormatModeChange={(mode) => update('editFormatMode', mode)}
        availableVariables={[...textVariables, ...mediaVariables] as Variable[]}
        allNodes={allNodesFromSheets}
      />

      {/* Секция: Источник сообщения */}
      <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10 border border-amber-200/30 dark:border-amber-800/30 rounded-lg p-4 space-y-3">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
            <i className="fas fa-pen text-amber-600 dark:text-amber-400 text-xs"></i>
          </div>
          <Label className="text-sm font-semibold text-amber-900 dark:text-amber-100">Источник сообщения</Label>
        </div>
        <Select
          value={data.editMessageIdSource ?? 'last_bot_message'}
          onValueChange={(v) => update('editMessageIdSource', v)}
        >
          <SelectTrigger className="bg-card/70 border border-amber-200/50 dark:border-amber-800/50">
            <SelectValue placeholder="Выберите источник сообщения" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="last_bot_message">Последнее сообщение бота</SelectItem>
            <SelectItem value="custom">ID сообщения</SelectItem>
          </SelectContent>
        </Select>
        {data.editMessageIdSource === 'custom' && (
          <div className="space-y-2">
            <Label className="text-xs font-medium text-amber-700 dark:text-amber-300">
              ID сообщения или переменная
            </Label>
            <div className="flex gap-2">
              <Input
                value={data.editMessageIdManual ?? ''}
                onChange={(e) => update('editMessageIdManual', e.target.value)}
                placeholder="123456789 или {message_id}"
                className="bg-white/60 dark:bg-slate-950/60 border-amber-200/50 dark:border-amber-800/50 flex-1"
              />
              <VariableSelector
                availableVariables={textVariables as any}
                onSelect={(name) => update('editMessageIdManual', `{${name}}`)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Секция: Клавиатура */}
      <div className="bg-gradient-to-br from-slate-50/50 to-slate-100/30 dark:from-slate-950/20 dark:to-slate-900/10 border border-slate-200/30 dark:border-slate-800/30 rounded-lg p-4 space-y-3">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <i className="fas fa-keyboard text-slate-600 dark:text-slate-400 text-xs"></i>
          </div>
          <Label className="text-sm font-semibold text-slate-900 dark:text-slate-100">Клавиатура</Label>
        </div>
        <Select
          value={keyboardMode}
          onValueChange={(v) => update('editKeyboardMode', v)}
        >
          <SelectTrigger className="bg-card/70">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="keep">Не менять</SelectItem>
            <SelectItem value="remove">Убрать кнопки</SelectItem>
            <SelectItem value="node">Взять из узла keyboard</SelectItem>
          </SelectContent>
        </Select>
        {keyboardMode === 'node' && (
          <div className="space-y-2">
            <Label className="text-xs text-slate-600 dark:text-slate-400">Узел с кнопками</Label>
            <Select
              value={data.editKeyboardNodeId ?? ''}
              onValueChange={(v) => update('editKeyboardNodeId', v)}
            >
              <SelectTrigger className="bg-card/70">
                <SelectValue placeholder="Выберите keyboard узел" />
              </SelectTrigger>
              <SelectContent>
                {keyboardNodes.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-muted-foreground">Нет узлов keyboard на холсте</div>
                ) : (
                  keyboardNodes.map(n => (
                    <SelectItem key={n.id} value={n.id}>
                      {(n.data as any)?.name || `Клавиатура ${n.id.slice(0, 8)}`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        )}
        {keyboardMode === 'remove' && (
          <p className="text-[10px] text-slate-400">Inline-кнопки будут удалены из сообщения</p>
        )}
      </div>
    </div>
  );
}
