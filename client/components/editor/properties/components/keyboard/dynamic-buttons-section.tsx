import { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VariableSelector } from '../variables/variable-selector';
import type { DynamicButtonsConfig } from '../../types/keyboard-layout';
import type { ProjectVariable } from '../../utils/variables-utils';
import { getDynamicButtonsSummary, normalizeDynamicButtonsConfig } from '../../utils/dynamic-buttons';

interface DynamicButtonsSectionProps {
  config: DynamicButtonsConfig | undefined;
  textVariables: ProjectVariable[];
  onChange: (config: DynamicButtonsConfig) => void;
}

export function DynamicButtonsSection({ config, textVariables, onChange }: DynamicButtonsSectionProps) {
  const current = useMemo(() => normalizeDynamicButtonsConfig(config ?? undefined), [config]);

  const updateField = (field: keyof DynamicButtonsConfig, value: string | number) => {
    onChange(normalizeDynamicButtonsConfig({ ...current, [field]: value } as DynamicButtonsConfig));
  };

  const styleMode = current.styleMode || 'none';

  return (
    <div className="space-y-3 rounded-xl border border-blue-200/60 dark:border-blue-800/40 bg-gradient-to-br from-blue-50/50 via-white/60 to-cyan-50/30 dark:from-blue-950/20 dark:via-slate-950/50 dark:to-cyan-950/20 p-3 sm:p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <i className="fas fa-bolt text-blue-500 text-xs" />
        <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">Dynamic inline keyboard</span>
      </div>

      <div className="rounded-lg border border-blue-100/80 dark:border-blue-900/50 bg-white/70 dark:bg-slate-950/40 px-3 py-2 text-xs text-blue-800 dark:text-blue-200">
        Кнопки собираются из массива HTTP-ответа. Используй шаблоны вроде <span className="font-mono">{'{name}'}</span> и <span className="font-mono">{'project_{id}'}</span>.
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Переменная с ответом</label>
        <div className="flex items-center gap-1">
          <Input
            value={current.sourceVariable}
            onChange={(e) => updateField('sourceVariable', e.target.value)}
            placeholder="projects"
            className="h-8 text-xs"
          />
          <VariableSelector
            availableVariables={textVariables as any}
            onSelect={(value) => updateField('sourceVariable', value)}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Путь к массиву</label>
        <Input
          value={current.arrayPath}
          onChange={(e) => updateField('arrayPath', e.target.value)}
          placeholder="items"
          className="h-8 text-xs"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Шаблон текста</label>
        <Input
          value={current.textTemplate}
          onChange={(e) => updateField('textTemplate', e.target.value)}
          placeholder="{name}"
          className="h-8 text-xs font-mono"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Шаблон callback_data</label>
        <Input
          value={current.callbackTemplate}
          onChange={(e) => updateField('callbackTemplate', e.target.value)}
          placeholder="project_{id}"
          className="h-8 text-xs font-mono"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Источник стиля</label>
        <Select value={styleMode} onValueChange={(value) => updateField('styleMode', value)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Без стиля" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Без стиля</SelectItem>
            <SelectItem value="field">Из поля ответа</SelectItem>
            <SelectItem value="template">Из шаблона</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {styleMode === 'field' && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Поле стиля</label>
          <Input
            value={current.styleField}
            onChange={(e) => updateField('styleField', e.target.value)}
            placeholder="style"
            className="h-8 text-xs"
          />
        </div>
      )}

      {styleMode === 'template' && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Шаблон стиля</label>
          <Input
            value={current.styleTemplate}
            onChange={(e) => updateField('styleTemplate', e.target.value)}
            placeholder="{status}"
            className="h-8 text-xs font-mono"
          />
        </div>
      )}

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Колонки</label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={1}
            max={6}
            value={current.columns}
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
                type="button"
                onClick={() => updateField('columns', n)}
                className={`h-6 w-6 rounded text-xs font-medium transition-colors ${
                  current.columns === n
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

      <div className="rounded-lg border border-dashed border-blue-200/70 dark:border-blue-800/50 bg-blue-50/60 dark:bg-blue-950/20 px-3 py-2 text-[11px] leading-5 text-blue-900/80 dark:text-blue-100/80">
        {getDynamicButtonsSummary(current)}
      </div>
    </div>
  );
}
