/**
 * @fileoverview Селектор целевого экрана для кнопки завершения
 * 
 * Компонент выбора экрана, на который перейдёт бот после нажатия кнопки.
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/** Пропсы селектора целевого экрана */
interface ContinueButtonTargetSelectorProps {
  /** ID узла */
  nodeId: string;
  /** Текущее значение целевого экрана */
  continueButtonTarget?: string;
  /** Все узлы для выбора */
  getAllNodesFromAllSheets: any[];
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
  /** Функция форматирования отображения узла */
  formatNodeDisplay: (node: any, sheetName?: string) => string;
}

/**
 * Компонент селектора целевого экрана для кнопки завершения
 * 
 * @param {ContinueButtonTargetSelectorProps} props - Пропсы компонента
 * @returns {JSX.Element} Селектор целевого экрана
 */
export function ContinueButtonTargetSelector({
  nodeId,
  continueButtonTarget,
  getAllNodesFromAllSheets,
  onNodeUpdate,
  formatNodeDisplay
}: ContinueButtonTargetSelectorProps) {
  return (
    <div className="space-y-2.5 sm:space-y-3 p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-indigo-50/40 to-blue-50/30 dark:from-indigo-950/20 dark:to-blue-950/10 border border-indigo-200/40 dark:border-indigo-800/30 hover:border-indigo-300/60 dark:hover:border-indigo-700/60 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/30 transition-all duration-200 group">
      <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
        <div className="w-6 sm:w-7 h-6 sm:h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-indigo-200/50 dark:bg-indigo-900/40 group-hover:bg-indigo-300/50 dark:group-hover:bg-indigo-800/50 transition-all">
          <i className="fas fa-right-long text-xs sm:text-sm text-indigo-600 dark:text-indigo-400"></i>
        </div>
        <div className="min-w-0 flex-1">
          <Label className="text-xs sm:text-sm font-semibold text-indigo-900 dark:text-indigo-100 cursor-pointer block">
            Целевой экран
          </Label>
          <div className="text-xs text-indigo-700/70 dark:text-indigo-300/70 mt-0.5 leading-snug hidden sm:block">
            Куда перейти после завершения выбора
          </div>
        </div>
      </div>
      <Select
        value={continueButtonTarget || 'none'}
        onValueChange={(value) => onNodeUpdate(nodeId, { continueButtonTarget: value === 'none' ? '' : value })}
      >
        <SelectTrigger className="w-full text-xs sm:text-sm bg-white/60 dark:bg-slate-950/60 border border-indigo-300/40 dark:border-indigo-700/40 hover:border-indigo-400/60 dark:hover:border-indigo-600/60 hover:bg-white/80 dark:hover:bg-slate-900/60 focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400/30 dark:focus:ring-indigo-600/30 transition-all duration-200 rounded-lg text-indigo-900 dark:text-indigo-50">
          <SelectValue placeholder="⊘ Не выбрано" />
        </SelectTrigger>
        <SelectContent className="bg-gradient-to-br from-sky-50/95 to-blue-50/90 dark:from-slate-900/95 dark:to-slate-800/95 border border-indigo-200/50 dark:border-indigo-800/50 shadow-xl max-h-48 overflow-y-auto">
          <SelectItem value="none">
            <div className="flex items-center gap-2">
              <span>⊘ Не выбрано</span>
            </div>
          </SelectItem>
          {getAllNodesFromAllSheets
            .filter(n => n.node.id !== nodeId)
            .map(({ node, sheetName }) => (
              <SelectItem key={node.id} value={node.id}>
                <span className="text-xs font-mono text-sky-700 dark:text-sky-300 truncate">
                  {formatNodeDisplay(node, sheetName)}
                </span>
              </SelectItem>
            ))
          }
        </SelectContent>
      </Select>
      <Input
        value={continueButtonTarget || ''}
        onChange={(e) => onNodeUpdate(nodeId, { continueButtonTarget: e.target.value })}
        className="text-xs sm:text-sm bg-white/60 dark:bg-slate-950/60 border border-indigo-300/40 dark:border-indigo-700/40 text-indigo-900 dark:text-indigo-50 placeholder:text-indigo-500/50 dark:placeholder:text-indigo-400/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400/30"
        placeholder="Или введите ID экрана вручную"
      />
    </div>
  );
}
