/**
 * @fileoverview Панель свойств узла "Уведомление при нажатии на inline кнопку"
 * @module properties/components/action/AnswerCallbackQueryConfiguration
 */
import { useRef } from 'react';
import type { Node } from '@shared/schema';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { InfoBlock } from '@/components/ui/info-block';
import { VariableSelector } from '../variables/variable-selector';
import { extractVariables } from '../../utils/variables-utils';
import { useMemo } from 'react';

/** Пропсы компонента AnswerCallbackQueryConfiguration */
interface AnswerCallbackQueryConfigurationProps {
  /** Выбранный узел */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
  /** Все узлы из всех листов */
  getAllNodesFromAllSheets?: Array<{ node: Node; sheetId?: string; sheetName?: string }>;
}

/**
 * Панель свойств узла ответа на callback_query.
 * Содержит plain-text поле для текста уведомления с кнопкой вставки переменной,
 * переключатель типа отображения (тост/алерт).
 *
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function AnswerCallbackQueryConfiguration({
  selectedNode,
  onNodeUpdate,
  getAllNodesFromAllSheets = [],
}: AnswerCallbackQueryConfigurationProps) {
  const data = selectedNode.data as any;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /** Список всех узлов для извлечения переменных */
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
    const current: string = data.callbackNotificationText ?? '';
    if (!el) {
      update('callbackNotificationText', current + `{{${variableName}}}`);
      return;
    }
    const start = el.selectionStart ?? current.length;
    const end = el.selectionEnd ?? current.length;
    const inserted = `{{${variableName}}}`;
    const next = current.slice(0, start) + inserted + current.slice(end);
    update('callbackNotificationText', next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + inserted.length, start + inserted.length);
    });
  };

  return (
    <div className="space-y-4 p-4">
      {/* Инфо-блок */}
      <InfoBlock
        variant="info"
        title="answerCallbackQuery"
        description="Показывает уведомление пользователю после нажатия inline-кнопки. Форматирование не поддерживается — только plain text и переменные {{var}}."
      />

      {/* Секция: Текст уведомления */}
      <div className="rounded-xl bg-purple-50/40 dark:bg-purple-900/10 border border-purple-200/40 dark:border-purple-700/30 p-4 space-y-3">
        <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide">
          Текст уведомления
        </p>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-slate-600 dark:text-slate-400">
              Текст (0–200 символов)
            </Label>
            <VariableSelector
              availableVariables={textVariables as any}
              onSelect={insertVariable}
            />
          </div>
          <Textarea
            ref={textareaRef}
            value={data.callbackNotificationText ?? ''}
            onChange={(e) => update('callbackNotificationText', e.target.value)}
            placeholder="Введите текст уведомления..."
            maxLength={200}
            rows={3}
            className="resize-none text-sm"
          />
          <p className="text-[10px] text-slate-400 text-right">
            {(data.callbackNotificationText ?? '').length}/200
          </p>
        </div>
      </div>

      {/* Секция: Тип отображения */}
      <div className="rounded-xl bg-slate-50/40 dark:bg-slate-900/10 border border-slate-200/40 dark:border-slate-700/30 p-4 space-y-3">
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
          Тип отображения
        </p>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-xs text-slate-600 dark:text-slate-400">
              Показать как алерт
            </Label>
            <p className="text-[10px] text-slate-400">
              {data.callbackShowAlert ? 'Модальное окно с кнопкой OK' : 'Тост-уведомление (исчезает само)'}
            </p>
          </div>
          <Switch
            checked={!!data.callbackShowAlert}
            onCheckedChange={(v) => update('callbackShowAlert', v)}
          />
        </div>
      </div>
    </div>
  );
}
