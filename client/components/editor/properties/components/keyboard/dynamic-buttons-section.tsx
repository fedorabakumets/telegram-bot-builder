/**
 * @fileoverview Секция настройки динамических кнопок
 *
 * Отображает поля для конфигурации генерации кнопок из HTTP-ответа:
 * выбор переменной, поля массива, текста, callback и стиля.
 *
 * @module components/editor/properties/components/keyboard/dynamic-buttons-section
 */

import { Input } from '@/components/ui/input';
import { VariableSelector } from '../variables/variable-selector';
import type { DynamicButtonsConfig } from '../../types/keyboard-layout';
import type { ProjectVariable } from '../../utils/variables-utils';

/** Пропсы компонента DynamicButtonsSection */
interface DynamicButtonsSectionProps {
  /** Текущая конфигурация динамических кнопок */
  config: DynamicButtonsConfig | undefined;
  /** Доступные текстовые переменные проекта */
  textVariables: ProjectVariable[];
  /** Колбэк обновления конфигурации */
  onChange: (config: DynamicButtonsConfig) => void;
}

/**
 * Секция настройки динамических кнопок.
 *
 * Позволяет выбрать переменную с HTTP-ответом и указать поля,
 * из которых будут генерироваться кнопки клавиатуры.
 *
 * @param {DynamicButtonsSectionProps} props - Пропсы компонента
 * @returns {JSX.Element} Секция настройки динамических кнопок
 */
export function DynamicButtonsSection({ config, textVariables, onChange }: DynamicButtonsSectionProps) {
  const current = config ?? {
    variable: '',
    arrayField: '',
    textField: '',
    callbackField: '',
    styleField: '',
    columns: 2,
  };

  /**
   * Обновляет одно поле конфигурации.
   * @param {keyof DynamicButtonsConfig} field - Имя поля
   * @param {string | number} value - Новое значение
   */
  const updateField = (field: keyof DynamicButtonsConfig, value: string | number) => {
    onChange({ ...current, [field]: value });
  };

  return (
    <div className="space-y-3 rounded-lg border border-blue-200/50 dark:border-blue-800/40 bg-blue-50/40 dark:bg-blue-950/20 p-3">
      <div className="flex items-center gap-2">
        <i className="fas fa-bolt text-blue-500 text-xs" />
        <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Динамические кнопки</span>
      </div>

      {/* Выбор переменной */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Переменная с ответом</label>
        <div className="flex items-center gap-1">
          <Input
            value={current.variable}
            onChange={(e) => updateField('variable', e.target.value)}
            placeholder="projects"
            className="h-8 text-xs"
          />
          <VariableSelector
            availableVariables={textVariables as any}
            onSelect={(value) => updateField('variable', value)}
          />
        </div>
      </div>

      {/* Поле массива */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Поле массива</label>
        <Input
          value={current.arrayField}
          onChange={(e) => updateField('arrayField', e.target.value)}
          placeholder="actions"
          className="h-8 text-xs"
        />
      </div>

      {/* Поле текста */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Поле текста кнопки</label>
        <Input
          value={current.textField}
          onChange={(e) => updateField('textField', e.target.value)}
          placeholder="text"
          className="h-8 text-xs"
        />
      </div>

      {/* Поле callback */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Поле callback_data</label>
        <Input
          value={current.callbackField}
          onChange={(e) => updateField('callbackField', e.target.value)}
          placeholder="callback"
          className="h-8 text-xs"
        />
      </div>

      {/* Поле стиля (опционально) */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Поле стиля (опционально)</label>
        <Input
          value={current.styleField || ''}
          onChange={(e) => updateField('styleField', e.target.value)}
          placeholder="style"
          className="h-8 text-xs"
        />
      </div>

      {/* Количество колонок */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Колонки</label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={1}
            max={6}
            value={current.columns ?? 2}
            onChange={(e) => {
              const val = Math.min(6, Math.max(1, parseInt(e.target.value, 10) || 1));
              updateField('columns', val);
            }}
            className="h-8 w-16 text-xs"
          />
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                onClick={() => updateField('columns', n)}
                className={`h-6 w-6 rounded text-xs font-medium transition-colors ${
                  (current.columns ?? 2) === n
                    ? 'bg-blue-500 text-white'
                    : 'bg-muted hover:bg-blue-100 dark:hover:bg-blue-900'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
