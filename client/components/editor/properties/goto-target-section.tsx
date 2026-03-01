/**
 * @fileoverview Секция выбора целевого экрана для кнопки перехода (goto)
 * 
 * Компонент отвечает за отображение и редактирование настроек перехода
 * к другому экрану бота. Включает выпадающий список всех доступных узлов
 * и поле ручного ввода ID экрана.
 */

import { Node, Button } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { formatNodeDisplay } from './utils/node-formatters';

/**
 * Пропсы компонента GotoTargetSection
 */
interface GotoTargetSectionProps {
  /** Текущий узел для редактирования */
  selectedNode: Node;
  /** Кнопка с действием goto */
  button: Button;
  /** Все узлы из всех листов для выбора цели */
  getAllNodesFromAllSheets: Array<{ node: Node; sheetName: string }>;
  /** Функция обновления кнопки */
  onButtonUpdate: (nodeId: string, buttonId: string, updates: Partial<Button>) => void;
}

/**
 * Секция настройки перехода к целевому экрану
 * 
 * @param props - Пропсы компонента
 * @returns JSX компонент настройки целевого экрана
 */
export function GotoTargetSection({
  selectedNode,
  button,
  getAllNodesFromAllSheets,
  onButtonUpdate,
}: GotoTargetSectionProps) {
  const availableTargets = getAllNodesFromAllSheets.filter(n => n.node.id !== selectedNode.id);

  return (
    <div className="space-y-2.5 sm:space-y-3 p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-sky-50/40 to-blue-50/30 dark:from-sky-950/20 dark:to-blue-950/10 border border-sky-200/40 dark:border-sky-800/30 hover:border-sky-300/60 dark:hover:border-sky-700/60 hover:bg-sky-50/60 dark:hover:bg-sky-950/30 transition-all duration-200 group">
      <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
        <div className="w-6 sm:w-7 h-6 sm:h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-sky-200/50 dark:bg-sky-900/40 group-hover:bg-sky-300/50 dark:group-hover:bg-sky-800/50 transition-all">
          <i className="fas fa-location-arrow text-xs sm:text-sm text-sky-600 dark:text-sky-400"></i>
        </div>
        <div className="min-w-0 flex-1">
          <Label className="text-xs sm:text-sm font-semibold text-sky-900 dark:text-sky-100 cursor-pointer block">
            🎯 Целевой экран
          </Label>
          <div className="text-xs text-sky-700/70 dark:text-sky-300/70 mt-0.5 leading-snug hidden sm:block">
            Выберите или введите ID экрана
          </div>
        </div>
      </div>

      <Select
        value={button.target || ''}
        onValueChange={(value) => onButtonUpdate(selectedNode.id, button.id, { target: value })}
      >
        <SelectTrigger className="w-full text-xs sm:text-sm bg-white/60 dark:bg-slate-950/60 border border-sky-300/40 dark:border-sky-700/40 hover:border-sky-400/60 dark:hover:border-sky-600/60 hover:bg-white/80 dark:hover:bg-slate-900/60 focus:border-sky-500 dark:focus:border-sky-500 focus:ring-2 focus:ring-sky-400/30 dark:focus:ring-sky-600/30 transition-all duration-200 rounded-lg text-sky-900 dark:text-sky-50">
          <SelectValue placeholder="⊘ Не выбрано" />
        </SelectTrigger>
        <SelectContent className="bg-gradient-to-br from-sky-50/95 to-blue-50/90 dark:from-slate-900/95 dark:to-slate-800/95 border border-sky-200/50 dark:border-sky-800/50 shadow-xl max-h-48 overflow-y-auto">
          {availableTargets.map(({ node, sheetName }) => (
            <SelectItem key={node.id} value={node.id}>
              <span className="text-xs font-mono text-sky-700 dark:text-sky-300 truncate">
                {formatNodeDisplay(node, sheetName)}
              </span>
            </SelectItem>
          ))}
          {availableTargets.length === 0 && (
            <SelectItem value="no-nodes" disabled>
              <div className="flex items-center gap-2 text-muted-foreground">
                <i className="fas fa-exclamation-circle text-xs"></i>
                <span>Создайте другие экраны</span>
              </div>
            </SelectItem>
          )}
        </SelectContent>
      </Select>

      <Input
        value={button.target || ''}
        onChange={(e) => onButtonUpdate(selectedNode.id, button.id, { target: e.target.value })}
        className="text-xs sm:text-sm bg-white/60 dark:bg-slate-950/60 border border-sky-300/40 dark:border-sky-700/40 text-sky-900 dark:text-sky-50 placeholder:text-sky-500/50 dark:placeholder:text-sky-400/50 focus:border-sky-500 focus:ring-2 focus:ring-sky-400/30"
        placeholder="Или введите ID экрана вручную"
      />
    </div>
  );
}
