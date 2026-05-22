/**
 * @fileoverview Блок выбора метаданных медиа для сохранения.
 * Позволяет включать/выключать каждую переменную и редактировать имя.
 */

import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Pencil, Check } from 'lucide-react';
import { cn } from '@/utils/utils';
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
  /** Кастомные имена переменных: ключ — суффикс, значение — имя */
  customNames?: Record<string, string>;
  /** Callback при изменении кастомных имён */
  onCustomNamesChange?: (names: Record<string, string>) => void;
}

/**
 * Блок выбора метаданных медиа с чекбоксами и редактированием имён.
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function MediaMetadataInfo({
  inputType, variableName, enabledSuffixes,
  onSuffixesChange, customNames = {}, onCustomNamesChange,
}: MediaMetadataInfoProps) {
  const suffixes = MEDIA_METADATA_SUFFIXES[inputType] || [];
  const baseName = variableName || 'variable';
  /** Суффикс, для которого сейчас редактируется имя */
  const [editingSuffix, setEditingSuffix] = useState<string | null>(null);
  /** Текущее значение в поле ввода */
  const [editValue, setEditValue] = useState('');

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

  /** Начать редактирование имени */
  const startEdit = (suffix: string) => {
    setEditingSuffix(suffix);
    setEditValue(customNames[suffix] || `${baseName}_${suffix}`);
  };

  /** Сохранить отредактированное имя */
  const saveEdit = () => {
    if (!editingSuffix || !onCustomNamesChange) return;
    const trimmed = editValue.trim();
    const defaultName = `${baseName}_${editingSuffix}`;
    const updated = { ...customNames };
    if (!trimmed || trimmed === defaultName) {
      delete updated[editingSuffix];
    } else {
      updated[editingSuffix] = trimmed;
    }
    onCustomNamesChange(updated);
    setEditingSuffix(null);
  };

  /** Получить отображаемое имя переменной */
  const getDisplayName = (suffix: string) => customNames[suffix] || `${baseName}_${suffix}`;

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
      <div className="space-y-0.5">
        {suffixes.map(({ suffix, description, icon }) => {
          const isEnabled = enabledSuffixes.includes(suffix);
          const isEditing = editingSuffix === suffix;
          return (
            <div key={suffix} className="flex items-center gap-2 py-1">
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
              {isEditing ? (
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                    className="h-6 text-[11px] font-mono px-1.5 flex-1"
                    autoFocus
                  />
                  <button type="button" onClick={saveEdit} className="shrink-0 text-green-500 hover:text-green-700">
                    <Check className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <code className={cn(
                    'font-mono text-[11px] truncate',
                    isEnabled ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'
                  )}>
                    {getDisplayName(suffix)}
                  </code>
                  {isEnabled && onCustomNamesChange && (
                    <button
                      type="button"
                      onClick={() => startEdit(suffix)}
                      className="shrink-0 text-slate-400 hover:text-cyan-500 transition-colors"
                      title="Изменить имя переменной"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}
              <span className={cn(
                'text-[10px] shrink-0 hidden sm:inline',
                isEnabled ? 'text-slate-500 dark:text-slate-400' : 'text-slate-400/60 dark:text-slate-600'
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
