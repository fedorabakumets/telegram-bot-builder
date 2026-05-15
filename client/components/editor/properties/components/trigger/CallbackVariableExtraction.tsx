/**
 * @fileoverview Секция извлечения переменных из callback_data по шаблону
 *
 * Позволяет задать шаблон разбора (например "rate_{from_id}_{to_id}"),
 * автоматически парсит плейсхолдеры и отображает таблицу маппинга
 * с возможностью переименования переменных для сохранения.
 *
 * @module components/editor/properties/components/trigger/CallbackVariableExtraction
 */

import { useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/** Маппинг одной переменной из шаблона */
export interface CallbackVariableMapping {
  /** Имя переменной из шаблона (например "from_id") */
  templateVar: string;
  /** Имя переменной для сохранения (по умолчанию = templateVar) */
  saveAs: string;
}

/** Пропсы компонента CallbackVariableExtraction */
interface CallbackVariableExtractionProps {
  /** Включено ли извлечение переменных */
  enabled: boolean;
  /** Шаблон разбора callback_data */
  parseTemplate: string;
  /** Массив маппингов переменных */
  saveVariables: CallbackVariableMapping[];
  /** Обработчик переключения чекбокса */
  onToggle: (enabled: boolean) => void;
  /** Обработчик изменения шаблона */
  onTemplateChange: (template: string) => void;
  /** Обработчик изменения имени переменной для сохранения */
  onVariableRename: (index: number, newSaveAs: string) => void;
}

/**
 * Извлекает имена плейсхолдеров из шаблона вида "prefix_{var1}_{var2}"
 * @param template - Шаблон с плейсхолдерами в фигурных скобках
 * @returns Массив имён переменных
 */
export function parseTemplatePlaceholders(template: string): string[] {
  const matches = template.match(/\{([^}]+)\}/g);
  if (!matches) return [];
  return matches.map(m => m.slice(1, -1));
}

/**
 * Секция UI для настройки извлечения переменных из callback_data
 * @param props - Пропсы компонента
 * @returns JSX-элемент секции
 */
export function CallbackVariableExtraction({
  enabled,
  parseTemplate,
  saveVariables,
  onToggle,
  onTemplateChange,
  onVariableRename,
}: CallbackVariableExtractionProps) {
  /** Плейсхолдеры, извлечённые из текущего шаблона */
  const placeholders = useMemo(() => parseTemplatePlaceholders(parseTemplate), [parseTemplate]);

  return (
    <div className="space-y-3 p-3 rounded-lg bg-gradient-to-br from-teal-50/60 to-cyan-50/40 dark:from-teal-950/30 dark:to-cyan-950/20 border border-teal-200/40 dark:border-teal-700/40">
      {/* Чекбокс включения */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="cb-extract-vars"
          checked={enabled}
          onCheckedChange={(val) => onToggle(val as boolean)}
        />
        <Label
          htmlFor="cb-extract-vars"
          className="text-xs font-semibold text-teal-700 dark:text-teal-300 cursor-pointer select-none"
        >
          Извлекать переменные из callback
        </Label>
      </div>

      {enabled && (
        <div className="space-y-3">
          {/* Поле шаблона */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Шаблон разбора</Label>
            <Input
              value={parseTemplate}
              onChange={(e) => onTemplateChange(e.target.value)}
              placeholder="rate_{from_id}_{to_id}"
              className="font-mono text-xs h-8 bg-white/60 dark:bg-slate-950/60 border border-teal-300/40 dark:border-teal-700/40"
            />
            <p className="text-[11px] text-teal-600 dark:text-teal-400">
              Части в {'{скобках}'} станут переменными
            </p>
          </div>

          {/* Таблица маппинга переменных */}
          {placeholders.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                Маппинг переменных
              </Label>
              <div className="rounded-md border border-teal-200/50 dark:border-teal-700/50 overflow-hidden">
                {/* Заголовок таблицы */}
                <div className="grid grid-cols-2 gap-2 px-2 py-1.5 bg-teal-100/50 dark:bg-teal-900/30 text-[10px] uppercase tracking-wider text-teal-600 dark:text-teal-400 font-medium">
                  <span>Из шаблона</span>
                  <span>Сохранить как</span>
                </div>
                {/* Строки маппинга */}
                {placeholders.map((placeholder, idx) => {
                  const mapping = saveVariables.find(v => v.templateVar === placeholder);
                  const currentSaveAs = mapping?.saveAs ?? placeholder;

                  return (
                    <div
                      key={placeholder}
                      className="grid grid-cols-2 gap-2 px-2 py-1.5 border-t border-teal-100/50 dark:border-teal-800/50"
                    >
                      <span className="text-xs font-mono text-teal-800 dark:text-teal-200 flex items-center">
                        {placeholder}
                      </span>
                      <Input
                        value={currentSaveAs}
                        onChange={(e) => onVariableRename(idx, e.target.value)}
                        className="h-6 text-xs font-mono bg-white/70 dark:bg-slate-950/50 border-teal-200/40 dark:border-teal-700/40"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
