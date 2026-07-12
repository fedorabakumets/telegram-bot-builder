/**
 * @fileoverview Блок выбора метаданных медиа для сохранения.
 * @module components/editor/properties/components/input/media-metadata-info
 */

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/utils';
import { MEDIA_METADATA_SUFFIXES } from './media-metadata-suffixes';
import { getMetadataSuffixIcon } from './media-metadata-suffix-icons';
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
  inputType,
  variableName,
  enabledSuffixes,
  onSuffixesChange,
  customNames = {},
  onCustomNamesChange,
  availableVariables = [],
}: MediaMetadataInfoProps) {
  const suffixes = MEDIA_METADATA_SUFFIXES[inputType] || [];
  const baseName = variableName || 'variable';

  const toggleSuffix = (suffix: string) => {
    if (enabledSuffixes.includes(suffix)) {
      onSuffixesChange(enabledSuffixes.filter((s) => s !== suffix));
      return;
    }
    onSuffixesChange([...enabledSuffixes, suffix]);
  };

  const allSelected = suffixes.length > 0 && suffixes.every((s) => enabledSuffixes.includes(s.suffix));
  const toggleAll = () => {
    onSuffixesChange(allSelected ? [] : suffixes.map((s) => s.suffix));
  };

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
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Дополнительные переменные
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
          onClick={toggleAll}
        >
          {allSelected ? 'Снять все' : 'Выбрать все'}
        </Button>
      </div>

      <div className="max-h-[280px] space-y-1 overflow-y-auto pr-0.5">
        {suffixes.map(({ suffix, description }) => {
          const isEnabled = enabledSuffixes.includes(suffix);
          const Icon = getMetadataSuffixIcon(suffix);
          const defaultVarName = `${baseName}_${suffix}`;

          return (
            <div
              key={suffix}
              role="button"
              tabIndex={0}
              onClick={(event) => {
                const target = event.target as HTMLElement;
                if (target.closest('input, button, [role="combobox"]')) return;
                toggleSuffix(suffix);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  toggleSuffix(suffix);
                }
              }}
              className={cn(
                'flex cursor-pointer items-start gap-2.5 rounded-xl px-2.5 py-2 transition-colors',
                isEnabled ? 'bg-primary/10 ring-1 ring-primary/20' : 'hover:bg-muted/25',
              )}
            >
              <Checkbox
                checked={isEnabled}
                onCheckedChange={() => toggleSuffix(suffix)}
                className="pointer-events-none mt-0.5 shrink-0 !h-5 !w-5 !rounded-md shadow-sm"
                style={{
                  border: isEnabled ? '2px solid var(--primary)' : '2px solid hsl(215, 20%, 55%)',
                  background: isEnabled ? 'var(--primary)' : 'hsl(var(--background))',
                }}
              />

              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-3.5 w-3.5 text-primary" />
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                {isEnabled ? (
                  <div className="flex items-center gap-1">
                    <Input
                      value={customNames[suffix] || defaultVarName}
                      onChange={(e) => updateName(suffix, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-7 flex-1 min-w-0 font-mono text-[11px]"
                      placeholder={defaultVarName}
                    />
                    {availableVariables.length > 0 && (
                      <VariableSelector
                        availableVariables={availableVariables}
                        onSelect={(v) => updateName(suffix, v)}
                      />
                    )}
                  </div>
                ) : (
                  <p className="truncate font-mono text-[11px] text-muted-foreground">{defaultVarName}</p>
                )}
                <p className="text-[10px] leading-snug text-muted-foreground">{description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
