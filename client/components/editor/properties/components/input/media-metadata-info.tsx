/**
 * @fileoverview Блок выбора метаданных медиа для сохранения.
 * Позволяет включать/выключать каждую переменную отдельно.
 */

import { Checkbox } from '@/components/ui/checkbox';
import { MEDIA_METADATA_SUFFIXES } from './media-metadata-suffixes';

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
}

/**
 * Блок выбора метаданных медиа с чекбоксами для каждого поля.
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function MediaMetadataInfo({ inputType, variableName, enabledSuffixes, onSuffixesChange }: MediaMetadataInfoProps) {
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
  const allSelected = suffixes.every(s => enabledSuffixes.includes(s.suffix));
  const toggleAll = () => {
    if (allSelected) {
      onSuffixesChange([]);
    } else {
      onSuffixesChange(suffixes.map(s => s.suffix));
    }
  };

  return (
    <div className="rounded-lg border border-cyan-200/60 dark:border-cyan-700/40 bg-gradient-to-br from-cyan-50/30 to-sky-50/20 dark:from-cyan-950/20 dark:to-sky-900/10 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-cyan-600 dark:text-cyan-400 font-medium">
          Выберите метаданные:
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
            <label key={suffix} className="flex items-center gap-2 text-xs cursor-pointer group">
              <Checkbox
                checked={isEnabled}
                onCheckedChange={() => toggleSuffix(suffix)}
                className="h-3.5 w-3.5"
              />
              <span className="shrink-0">{icon}</span>
              <code className={`font-mono text-[11px] ${isEnabled ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}`}>
                {baseName}_{suffix}
              </code>
              <span className="text-slate-400 dark:text-slate-500 hidden sm:inline">—</span>
              <span className={`truncate hidden sm:inline ${isEnabled ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}`}>
                {description}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
