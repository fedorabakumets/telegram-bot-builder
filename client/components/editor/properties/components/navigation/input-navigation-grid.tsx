/**
 * @fileoverview Компонент сетки переменной и навигации для ввода ответов
 * 
 * Содержит два поля:
 * - Имя переменной для сохранения ответа
 * - Выбор следующего узла для перехода
 */

import { Node } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/** Пропсы компонента InputNavigationGrid */
interface InputNavigationGridProps {
  /** Выбранный узел */
  selectedNode: Node;
  /** Все узлы для выбора */
  getAllNodesFromAllSheets: Array<{ node: Node; sheetName: string }>;
  /** Функция обновления узла */
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
  /** Функция форматирования узла */
  formatNodeDisplay: (node: Node, sheetName: string) => string;
}

/**
 * Компонент сетки переменной и навигации
 * 
 * @param {InputNavigationGridProps} props - Пропсы компонента
 * @returns {JSX.Element} Сетка с полями переменной и навигации
 */
export function InputNavigationGrid({
  selectedNode,
  getAllNodesFromAllSheets,
  onNodeUpdate,
  formatNodeDisplay
}: InputNavigationGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      {/* Variable Name */}
      <div className="flex flex-col p-3 sm:p-3.5 rounded-lg bg-gradient-to-br from-cyan-50/60 to-blue-50/40 dark:from-cyan-950/30 dark:to-blue-950/20 border border-cyan-200/40 dark:border-cyan-700/40 hover:shadow-sm transition-all duration-200">
        <Label className="text-xs sm:text-sm font-semibold text-cyan-700 dark:text-cyan-300 mb-2 flex items-center gap-1.5">
          <i className="fas fa-bookmark text-xs sm:text-sm"></i>
          Переменная
        </Label>
        <Input
          value={selectedNode.data.inputVariable || ''}
          onChange={(e) => onNodeUpdate(selectedNode.id, { inputVariable: e.target.value })}
          className="text-xs sm:text-sm border-cyan-200/50 dark:border-cyan-700/50 focus:border-cyan-500 focus:ring-cyan-200 flex-1"
          placeholder="имя, email, телефон"
        />
        <div className="text-xs text-cyan-600 dark:text-cyan-400 mt-1.5 leading-snug">
          Ключ для сохранения ответа
        </div>
      </div>

      {/* Target Node After Text Input */}
      <div className="flex flex-col p-3 sm:p-3.5 rounded-lg bg-gradient-to-br from-violet-50/60 to-purple-50/40 dark:from-violet-950/30 dark:to-purple-950/20 border border-violet-200/40 dark:border-violet-700/40 hover:shadow-sm transition-all duration-200">
        <Label className="text-xs sm:text-sm font-semibold text-violet-700 dark:text-violet-300 mb-2 flex items-center gap-1.5">
          <i className="fas fa-share-right text-xs sm:text-sm"></i>
          Следующий узел
        </Label>
        <div className="space-y-1.5 flex-1">
          <Select
            value={selectedNode.data.inputTargetNodeId || 'no-transition'}
            onValueChange={(value) => {
              onNodeUpdate(selectedNode.id, { inputTargetNodeId: value === 'no-transition' ? undefined : value });
            }}
          >
            <SelectTrigger className="text-xs sm:text-sm h-7 sm:h-8 bg-white/60 dark:bg-slate-950/60 border border-violet-300/40 dark:border-violet-700/40 hover:border-violet-400/60 dark:hover:border-violet-600/60 focus:border-violet-500 focus:ring-violet-400/30">
              <SelectValue placeholder="⊘ Выберите" />
            </SelectTrigger>
            <SelectContent className="bg-gradient-to-br from-sky-50/95 to-blue-50/90 dark:from-slate-900/95 dark:to-slate-800/95 max-h-48 overflow-y-auto">
              <SelectItem value="no-transition">Без переходов</SelectItem>
              {getAllNodesFromAllSheets.filter(n => n.node.id !== selectedNode.id).map(({ node, sheetName }) => (
                <SelectItem key={node.id} value={node.id}>
                  <span className="text-xs font-mono text-sky-700 dark:text-sky-300 truncate">
                    {formatNodeDisplay(node, sheetName)}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={selectedNode.data.inputTargetNodeId && selectedNode.data.inputTargetNodeId !== 'no-transition' ? selectedNode.data.inputTargetNodeId : ''}
            onChange={(e) => {
              onNodeUpdate(selectedNode.id, { inputTargetNodeId: e.target.value || undefined });
            }}
            className="text-xs sm:text-sm h-7 sm:h-8 bg-white/60 dark:bg-slate-950/60 border border-violet-300/40 dark:border-violet-700/40 text-violet-900 dark:text-violet-50 placeholder:text-violet-500/50 focus:border-violet-500"
            placeholder="или ID вручную"
          />
        </div>
        <div className="text-xs text-violet-600 dark:text-violet-400 mt-1.5 leading-snug">
          Куда перейти после ответа
        </div>
      </div>
    </div>
  );
}
