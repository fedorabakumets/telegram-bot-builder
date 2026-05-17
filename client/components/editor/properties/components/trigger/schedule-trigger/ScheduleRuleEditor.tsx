/**
 * @fileoverview Редактор одного правила расписания
 * @module properties/components/trigger/schedule-trigger/ScheduleRuleEditor
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/** Пропсы компонента ScheduleRuleEditor */
interface ScheduleRuleEditorProps {
  /** Правило расписания */
  rule: any;
  /** Индекс правила */
  index: number;
  /** Можно ли удалить правило */
  canRemove: boolean;
  /** Колбэк изменения правила */
  onChange: (rule: any) => void;
  /** Колбэк удаления правила */
  onRemove: () => void;
}

/** Дни недели */
const WEEKDAYS = [
  { key: 'mon', label: 'Пн' },
  { key: 'tue', label: 'Вт' },
  { key: 'wed', label: 'Ср' },
  { key: 'thu', label: 'Чт' },
  { key: 'fri', label: 'Пт' },
  { key: 'sat', label: 'Сб' },
  { key: 'sun', label: 'Вс' },
];

/** Режимы расписания */
const MODES = [
  { value: 'interval', label: 'Интервал' },
  { value: 'weekday', label: 'День недели' },
  { value: 'monthday', label: 'День месяца' },
  { value: 'cron', label: 'Cron' },
];

/** Единицы измерения интервала */
const INTERVAL_UNITS = [
  { value: 'seconds', label: 'секунд', multiplier: 1 / 60 },
  { value: 'minutes', label: 'минут', multiplier: 1 },
  { value: 'hours', label: 'часов', multiplier: 60 },
  { value: 'days', label: 'дней', multiplier: 1440 },
];

/**
 * Редактор одного правила расписания
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function ScheduleRuleEditor({ rule, index, canRemove, onChange, onRemove }: ScheduleRuleEditorProps) {
  const mode = rule.mode || 'interval';

  /** Переключает день недели */
  const toggleDay = (day: string) => {
    const days: string[] = rule.days || [];
    const updated = days.includes(day) ? days.filter((d: string) => d !== day) : [...days, day];
    onChange({ ...rule, days: updated });
  };

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 space-y-2 bg-white/50 dark:bg-slate-800/50">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-400 uppercase tracking-wide">
          Правило {index + 1}
        </span>
        {canRemove && (
          <button
            onClick={onRemove}
            className="text-red-400 hover:text-red-600 text-xs"
            title="Удалить правило"
          >
            <i className="fas fa-trash-alt" />
          </button>
        )}
      </div>

      {/* Выбор режима */}
      <select
        value={mode}
        onChange={(e) => onChange({ ...rule, mode: e.target.value })}
        className="w-full text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5"
      >
        {MODES.map((m) => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>

      {/* Интервал */}
      {mode === 'interval' && (
        <div className="flex items-center gap-2">
          <Label className="text-xs text-slate-500 whitespace-nowrap">Каждые</Label>
          <Input
            type="number"
            min={1}
            value={rule.intervalValue || Math.round((rule.intervalMinutes || 5) / (INTERVAL_UNITS.find(u => u.value === (rule.intervalUnit || 'minutes'))?.multiplier || 1))}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 1;
              const unit = INTERVAL_UNITS.find(u => u.value === (rule.intervalUnit || 'minutes'));
              const minutes = Math.max(1, Math.round(val * (unit?.multiplier || 1)));
              onChange({ ...rule, intervalValue: val, intervalMinutes: minutes });
            }}
            className="w-16 text-xs"
          />
          <select
            value={rule.intervalUnit || 'minutes'}
            onChange={(e) => {
              const newUnit = INTERVAL_UNITS.find(u => u.value === e.target.value);
              const val = rule.intervalValue || Math.round((rule.intervalMinutes || 5) / (INTERVAL_UNITS.find(u => u.value === (rule.intervalUnit || 'minutes'))?.multiplier || 1));
              const minutes = Math.max(1, Math.round(val * (newUnit?.multiplier || 1)));
              onChange({ ...rule, intervalUnit: e.target.value, intervalValue: val, intervalMinutes: minutes });
            }}
            className="text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5"
          >
            {INTERVAL_UNITS.map((u) => (
              <option key={u.value} value={u.value}>{u.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* День недели */}
      {mode === 'weekday' && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1">
            {WEEKDAYS.map((d) => (
              <button
                key={d.key}
                onClick={() => toggleDay(d.key)}
                className={`px-2 py-0.5 text-[10px] rounded-md border ${
                  (rule.days || []).includes(d.key)
                    ? 'bg-teal-100 border-teal-300 text-teal-700 dark:bg-teal-900/40 dark:border-teal-600 dark:text-teal-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-slate-500">Время:</Label>
            <Input
              type="number" min={0} max={23}
              value={rule.hour ?? 0}
              onChange={(e) => onChange({ ...rule, hour: parseInt(e.target.value) || 0 })}
              className="w-14 text-xs"
            />
            <span className="text-xs text-slate-400">:</span>
            <Input
              type="number" min={0} max={59}
              value={rule.minute ?? 0}
              onChange={(e) => onChange({ ...rule, minute: parseInt(e.target.value) || 0 })}
              className="w-14 text-xs"
            />
          </div>
        </div>
      )}

      {/* День месяца */}
      {mode === 'monthday' && (
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-xs text-slate-500">Дни месяца (через запятую)</Label>
            <Input
              value={(rule.monthDays || []).join(', ')}
              onChange={(e) => {
                const days = e.target.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n >= 1 && n <= 31);
                onChange({ ...rule, monthDays: days });
              }}
              placeholder="1, 15"
              className="text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-slate-500">Время:</Label>
            <Input
              type="number" min={0} max={23}
              value={rule.hour ?? 0}
              onChange={(e) => onChange({ ...rule, hour: parseInt(e.target.value) || 0 })}
              className="w-14 text-xs"
            />
            <span className="text-xs text-slate-400">:</span>
            <Input
              type="number" min={0} max={59}
              value={rule.minute ?? 0}
              onChange={(e) => onChange({ ...rule, minute: parseInt(e.target.value) || 0 })}
              className="w-14 text-xs"
            />
          </div>
        </div>
      )}

      {/* Cron */}
      {mode === 'cron' && (
        <div className="space-y-1">
          <Label className="text-xs text-slate-500">Cron-выражение</Label>
          <Input
            value={rule.cronExpression || ''}
            onChange={(e) => onChange({ ...rule, cronExpression: e.target.value })}
            placeholder="*/5 * * * *"
            className="text-xs font-mono"
          />
          <p className="text-[10px] text-slate-400">мин час день месяц день_недели</p>
        </div>
      )}
    </div>
  );
}
