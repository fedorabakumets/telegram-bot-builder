/**
 * @fileoverview Панель свойств узла "Редактировать сообщение"
 * @module properties/components/action/EditMessageConfiguration
 */
import { useRef, useMemo } from 'react';
import type { Node } from '@shared/schema';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { InfoBlock } from '@/components/ui/info-block';
import { VariableSelector } from '../variables/variable-selector';
import { extractVariables } from '../../utils/variables-utils';

/** Пропсы компонента EditMessageConfiguration */
interface EditMessageConfigurationProps {
  /** Выбранный узел */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
  /** Все узлы из всех листов */
  getAllNodesFromAllSheets?: Array<{ node: Node; sheetId?: string; sheetName?: string }>;
}

/** Варианты режима редактирования */
const EDIT_MODES = [
  { value: 'text', label: 'Текст' },
  { value: 'markup', label: 'Кнопки' },
  { value: 'both', label: 'Текст и кнопки' },
] as const;

/** Варианты форматирования */
const FORMAT_MODES = [
  { value: 'none', label: 'Без форматирования' },
  { value: 'html', label: 'HTML' },
  { value: 'markdown', label: 'Markdown' },
] as const;

/**
 * Панель свойств узла редактирования сообщения.
 * Позволяет настроить режим редактирования, новый текст,
 * источник ID сообщения и чата.
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const allNodes = useMemo(
    () => getAllNodesFromAllSheets.map(({ node }) => node),
    [getAllNodesFromAllSheets]
  );
  const { textVariables } = useMemo(() => extractVariables(allNodes), [allNodes]);

  /**
   * Обновляет поле данных узла
   * @param field - Имя поля
   * @param value - Новое значение
   */
  const update = (field: string, value: any) =>
    onNodeUpdate(selectedNode.id, { [field]: value });

  /**
   * Вставляет переменную в позицию курсора в textarea
   * @param variableName - Имя переменной для вставки
   */
  const insertVariable = (variableName: string) => {
    const el = textareaRef.current;
    const current: string = data.editMessageText ?? '';
    if (!el) {
      update('editMessageText', current + `{${variableName}}`);
      return;
    }
    const start = el.selectionStart ?? current.length;
    const end = el.selectionEnd ?? current.length;
    const inserted = `{${variableName}}`;
    const next = current.slice(0, start) + inserted + current.slice(end);
    update('editMessageText', next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + inserted.length, start + inserted.length);
    });
  };

  const editMode: string = data.editMode ?? 'text';
  const showText = editMode !== 'markup';
  const showKeyboard = editMode === 'markup' || editMode === 'both';

  return (
    <div className="space-y-4 p-4">
      <InfoBlock
        variant="info"
        title="editMessageText / editMessageReplyMarkup"
        description="Редактирует уже отправленное сообщение — изменяет текст, кнопки или оба сразу."
      />

      {/* Режим редактирования */}
      <div className="rounded-xl bg-blue-50/40 dark:bg-blue-900/10 border border-blue-200/40 dark:border-blue-700/30 p-4 space-y-3">
        <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
          Режим редактирования
        </p>
        <div className="flex gap-2 flex-wrap">
          {EDIT_MODES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => update('editMode', value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                editMode === value
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-blue-100 dark:hover:bg-blue-900/30'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Новый текст */}
      {showText && (
        <div className="rounded-xl bg-slate-50/40 dark:bg-slate-900/10 border border-slate-200/40 dark:border-slate-700/30 p-4 space-y-3">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            Новый текст
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-slate-600 dark:text-slate-400">Текст сообщения</Label>
              <VariableSelector availableVariables={textVariables as any} onSelect={insertVariable} />
            </div>
            <Textarea
              ref={textareaRef}
              value={data.editMessageText ?? ''}
              onChange={(e) => update('editMessageText', e.target.value)}
              placeholder="Введите новый текст..."
              rows={3}
              className="resize-none text-sm"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {FORMAT_MODES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => update('editFormatMode', value)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  (data.editFormatMode ?? 'none') === value
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
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
                name="editMessageIdSource"
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
