/**
 * @fileoverview Блок выбора метаданных медиа для сохранения.
 * Позволяет включать/выключать каждую переменную и редактировать имя.
 */

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils/utils';
import { MEDIA_METADATA_SUFFIXES } from './media-metadata-suffixes';
import { VariableSelector } from '../variables/variable-selector';
import type { Variable } from '../../../inline-rich/types';

/** Пропсы компонента MediaMetadataInfo */
interface MediaMetadataInfoProps {
  /** Тип медиа: photo, video, audio, document */
  inputType: string;
  /** Имя базовой переменной */
  variableName: string;
  /** Массив включённых суффиксов */
  enabledSuffixes: string[];
  /** Callback при изменении списка включённых суффиксов */
  onSuffixesChange: (suffixes: string[]) => void;
  /** Кастомные имена переменных: ключ — суффикс, значение — имя */
  customNames?: Record<string, string>;
  /** Callback при изменении кастомных имён */
  onCustomNamesChange?: (names: Record<string, string>) => void;
  /** Доступные переменные для селектора */
  availableVariables?: Variable[];
}

/**
 * Блок выбора метаданных медиа с чекбоксами и полями ввода имён.
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function MediaMetadataInfo({
  inputType, variableName, enabledSuffixes,
  onSuffixesChange, customNames = {}, onCustomNamesChange,
  availableVariables = [],
}: MediaMetadataInfoProps) {
  const suffixes = MEDIA_METADATA_SUFFIXES[inputType] || [];
  const baseName = variableName || 'variable';

  /** Переключение суффикса */
  const toggleSuffix = (suffix: string) => {
    if (enabledSuffixes.includes(suffix)) {
      onSuffixesChange(enabledSuffixes.filter(s => s !== suffix));
    } else {
      onSuffixesChange([...enabledSuffixes, suffix]);
    }
  };

  /** Выбрать все / снять все */
  const allSelected = suffixes.length > 0 && suffixes.every(s => enabledSuffixes.includes(s.suffix));
  const toggleAll = () => {
    onSuffixesChange(allSelected ? [] : suffixes.map(s => s.suffix));
  };

  /** Обновить кастомное имя переменной */
  const updateName = (suffix: string, value: string) => {
    if (!onCustomNamesChange) return;
    const updated = { ...customNames };
    const trimmed = value.trim();
    const defaultName = `${baseName}_${suffix}`;
    if (!trimmed || trimmed === defaultName) {
      delete updated[suffix];
    } else {
      updated[suffix] = trimmed;
    }
    onCustomNamesChange(updated);
  };

  return (
    <div className="rounded-lg border border-cyan-200/60 dark:border-cyan-700/40 bg-cyan-50/20 dark:bg-cyan-950/20 p-2.5 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-cyan-600 dark:text-cyan-400 font-medium">
          Метаданные для сохранения:
        </p>
        <button
          type="button"
          onClick={toggleAll}
          className="text-[10px] text-cyan-500 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors"
        >
          {allSelected ? 'Снять все' : 'Выбрать все'}
        </button>
      </div>
      <div className="space-y-1">
        {suffixes.map(({ suffix, description, icon }) => {
          const isEnabled = enabledSuffixes.includes(suffix);
          return (
            <div key={suffix} className="flex items-center gap-2 py-0.5">
              <Checkbox
                checked={isEnabled}
                onCheckedChange={() => toggleSuffix(suffix)}
                className="shrink-0 !h-[16px] !w-[16px] !rounded-sm"
                style={{
                  border: isEnabled ? '2px solid var(--primary)' : '2px solid hsl(215, 20%, 50%)',
                  background: isEnabled ? 'var(--primary)' : 'transparent',
                }}
              />
              <span className="shrink-0 text-xs">{icon}</span>
              {isEnabled ? (
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  <Input
                    value={customNames[suffix] || `${baseName}_${suffix}`}
                    onChange={(e) => updateName(suffix, e.target.value)}
                    className="h-6 text-[11px] font-mono px-1.5 flex-1 min-w-0"
                    placeholder={`${baseName}_${suffix}`}
                  />
                  {availableVariables.length > 0 && (
                    <VariableSelector
                      availableVariables={availableVariables}
                      onSelect={(v) => updateName(suffix, v)}
                    />
                  )}
                </div>
              ) : (
                <code className="font-mono text-[11px] text-slate-400 dark:text-slate-500 truncate flex-1 min-w-0">
                  {baseName}_{suffix}
                </code>
              )}
              <span className={cn(
                'text-[10px] shrink-0 hidden lg:inline max-w-[90px] truncate',
                isEnabled ? 'text-slate-500 dark:text-slate-400' : 'text-slate-400/60'
              )}>
                {description}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
