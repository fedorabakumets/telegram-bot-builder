/**
 * @fileoverview Компонент одной ветки узла параллельного запуска в панели свойств.
 * Содержит подпись ветки, выбор целевой ноды и опциональный фоллбек при ошибке.
 */
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Node } from '@shared/schema';
import type { ParallelBranch } from '@shared/types/parallel-split-node';
import { formatNodeDisplay } from '../../utils/node-formatters';

interface ParallelSplitBranchItemProps {
  /** Ветка параллельного запуска */
  branch: ParallelBranch;
  /** Порядковый номер ветки для плейсхолдера */
  index: number;
  /** Обработчик изменения поля ветки */
  onChange: (id: string, field: keyof ParallelBranch, value: string) => void;
  /** Обработчик удаления ветки */
  onDelete: (id: string) => void;
  /** Все узлы из всех листов для выбора цели перехода */
  getAllNodesFromAllSheets: Array<{ node: Node; sheetName: string }>;
}

/**
 * Селектор целевой ноды с ручным вводом ID.
 * @param props - Значение, плейсхолдер, обработчик и список узлов
 * @returns JSX элемент
 */
function TargetSelector({ value, placeholder, onChange, targets }: {
  /** Текущий ID целевой ноды */
  value: string;
  /** Плейсхолдер селекта */
  placeholder: string;
  /** Обработчик изменения значения */
  onChange: (value: string) => void;
  /** Доступные узлы для выбора */
  targets: Array<{ node: Node; sheetName: string }>;
}) {
  return (
    <div className="space-y-1">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full text-xs bg-white/60 dark:bg-slate-950/60 border border-rose-300/40 dark:border-rose-700/40 hover:border-rose-400/60 focus:border-rose-500 focus:ring-2 focus:ring-rose-400/30 rounded-lg text-rose-900 dark:text-rose-50">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="bg-gradient-to-br from-rose-50/95 to-pink-50/90 dark:from-slate-900/95 dark:to-slate-800/95 border border-rose-200/50 dark:border-rose-800/50 shadow-xl max-h-48 overflow-y-auto">
          {targets.map(({ node, sheetName }) => (
            <SelectItem key={node.id} value={node.id}>
              <span className="text-xs font-mono text-rose-700 dark:text-rose-300 truncate">
                {formatNodeDisplay(node, sheetName)}
              </span>
            </SelectItem>
          ))}
          {targets.length === 0 && (
            <SelectItem value="no-nodes" disabled>
              <span className="text-muted-foreground text-xs">Нет доступных узлов</span>
            </SelectItem>
          )}
        </SelectContent>
      </Select>
      <Input
        value={value}
        onChange={e => onChange(e.target.value)}
        className="text-xs bg-white/60 dark:bg-slate-950/60 border border-rose-300/40 dark:border-rose-700/40 text-rose-900 dark:text-rose-50 placeholder:text-rose-500/50 dark:placeholder:text-rose-400/50 focus:border-rose-500 focus:ring-2 focus:ring-rose-400/30"
        placeholder="Или введите ID узла вручную"
      />
    </div>
  );
}

/**
 * Компонент отдельной ветки параллельного запуска.
 * Отображает подпись, выбор стартовой ноды ветки и фоллбек при ошибке.
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function ParallelSplitBranchItem({ branch, index, onChange, onDelete, getAllNodesFromAllSheets }: ParallelSplitBranchItemProps) {
  return (
    <div className="rounded-lg border p-3 space-y-2 border-rose-200 bg-rose-50/50 dark:bg-rose-900/10 dark:border-rose-800/40">
      {/* Подпись ветки + кнопка удаления */}
      <div className="flex items-center gap-2">
        <Input
          value={branch.label}
          onChange={e => onChange(branch.id, 'label', e.target.value)}
          placeholder={`Ветка ${index + 1}`}
          className="text-sm h-7 flex-1"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(branch.id)}
          className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0"
          title="Удалить ветку"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Стартовая нода ветки */}
      <TargetSelector
        value={branch.target || ''}
        placeholder="⊘ Стартовая нода ветки"
        onChange={(value) => onChange(branch.id, 'target', value)}
        targets={getAllNodesFromAllSheets}
      />

      {/* Фоллбек при ошибке ветки */}
      <div className="space-y-1">
        <p className="text-[11px] text-gray-400 dark:text-gray-500">При ошибке ветки (необязательно):</p>
        <TargetSelector
          value={branch.onErrorTarget || ''}
          placeholder="⊘ Нода при ошибке"
          onChange={(value) => onChange(branch.id, 'onErrorTarget', value)}
          targets={getAllNodesFromAllSheets}
        />
      </div>
    </div>
  );
}
