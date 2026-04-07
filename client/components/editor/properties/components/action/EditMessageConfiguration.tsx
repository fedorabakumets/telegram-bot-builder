/**
 * @fileoverview Панель свойств узла "Редактировать сообщение"
 * @module properties/components/action/EditMessageConfiguration
 */
import { useMemo } from 'react';
import type { Node } from '@shared/schema';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
        <InlineRichEditor
          value={data.editMessageText ?? ''}
          onChange={(v) => update('editMessageText', v)}
          placeholder="Введите новый текст сообщения..."
          enableMarkdown={data.editFormatMode === 'markdown'}
          onFormatModeChange={(mode) => update('editFormatMode', mode)}
          availableVariables={[...textVariables, ...mediaVariables] as Variable[]}
          allNodes={allNodes}
        />
      )}

      {/* Секция: Источник сообщения */}
      <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10 border border-amber-200/30 dark:border-amber-800/30 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
            <i className="fas fa-pen text-amber-600 dark:text-amber-400 text-xs"></i>
          </div>
          <Label className="text-sm font-semibold text-amber-900 dark:text-amber-100">Источник сообщения</Label>
        </div>

        <div className="space-y-3">
          <Select
            value={data.editMessageIdSource ?? 'last_bot_message'}
            onValueChange={(v) => update('editMessageIdSource', v)}
          >
            <SelectTrigger className="bg-card/70 border border-amber-200/50 dark:border-amber-800/50">
              <SelectValue placeholder="Выберите источник сообщения" />
            </SelectTrigger>
            <SelectContent>
              {/* Последнее исходящее сообщение бота */}
              <SelectItem value="last_bot_message">Последнее сообщение бота</SelectItem>
              {/* Взять ID сообщения из переменной */}
              <SelectItem value="variable">Из переменной</SelectItem>
              {/* Указать ID сообщения вручную */}
              <SelectItem value="manual">Вручную</SelectItem>
            </SelectContent>
          </Select>

          {data.editMessageIdSource === 'manual' && (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-amber-700 dark:text-amber-300">ID сообщения</Label>
              <Input
                value={data.editMessageIdManual ?? ''}
                onChange={(e) => update('editMessageIdManual', e.target.value)}
                placeholder="123456789"
                className="bg-white/60 dark:bg-slate-950/60 border-amber-200/50 dark:border-amber-800/50"
              />
              <div className="text-xs text-amber-600/70 dark:text-amber-400/70 leading-relaxed">
                Telegram message_id сообщения в диалоге с ботом. Найти можно в логах бота — строка вида{' '}
                <span className="font-mono bg-amber-100/60 dark:bg-amber-900/30 px-1 rounded">tg_message_id=XXXX</span>.
              </div>
            </div>
          )}

          {data.editMessageIdSource === 'variable' && (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-amber-700 dark:text-amber-300">Имя переменной</Label>
              <div className="flex gap-2">
                <Input
                  value={data.editMessageIdVariable ?? ''}
                  onChange={(e) => update('editMessageIdVariable', e.target.value)}
                  placeholder="source_message_id"
                  className="bg-white/60 dark:bg-slate-950/60 border-amber-200/50 dark:border-amber-800/50 flex-1"
                />
                <VariableSelector
                  availableVariables={textVariables as any}
                  onSelect={(name) => update('editMessageIdVariable', name)}
                />
              </div>
            </div>
          )}
        </div>
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
