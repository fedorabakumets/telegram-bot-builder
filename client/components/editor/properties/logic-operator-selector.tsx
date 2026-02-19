/**
 * @fileoverview Компонент выбора логического оператора для условий
 * @description Позволяет выбрать логику (И/ИЛИ) для нескольких вопросов.
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { LOGIC_OPERATORS, LogicOperator } from './logic-operator-config';

interface LogicOperatorSelectorProps {
  value: LogicOperator;
  onChange: (value: LogicOperator) => void;
}

/**
 * Компонент выбора логического оператора
 */
export function LogicOperatorSelector({ value, onChange }: LogicOperatorSelectorProps) {
  return (
    <div className="space-y-2 sm:space-y-2.5">
      <Label className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-2">
        <i className="fas fa-shuffle text-amber-600 dark:text-amber-400"></i>
        <span>Логика для нескольких вопросов</span>
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="text-xs sm:text-sm h-10 sm:h-11 bg-gradient-to-br from-amber-50/60 to-white/60 dark:from-amber-950/30 dark:to-slate-950/70 border border-amber-300/60 dark:border-amber-700/60 hover:border-amber-400/80 dark:hover:border-amber-600/80 focus:border-amber-500 focus:ring-2 focus:ring-amber-400/50 transition-all rounded-xl text-amber-900 dark:text-amber-100 font-medium shadow-sm">
          <SelectValue placeholder="Выберите логику..." />
        </SelectTrigger>
        <SelectContent className="bg-gradient-to-b from-slate-50 to-slate-50 dark:from-slate-900 dark:to-slate-900 rounded-xl">
          {LOGIC_OPERATORS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              <div className="flex items-center gap-2">
                <span className={opt.symbolColor}>{opt.symbol}</span>
                <span>{opt.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/40 dark:border-amber-800/40 rounded-lg px-3 py-2 text-xs sm:text-sm text-amber-700 dark:text-amber-300">
        {value === 'AND'
          ? '✓ Пользователь должен ответить на ВСЕ выбранные вопросы'
          : '→ Пользователь может ответить на ЛЮБОЙ из выбранных вопросов'
        }
      </div>
    </div>
  );
}
