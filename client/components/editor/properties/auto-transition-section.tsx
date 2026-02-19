/**
 * @fileoverview Компонент секции автоперехода
 * 
 * Блок управления настройками автоперехода к следующему узлу
 * без ожидания ответа пользователя.
 * 
 * @module AutoTransitionSection
 */

import { Node } from '@shared/schema';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { SectionHeader } from './section-header';
import { formatNodeDisplay } from './node-formatters';

/**
 * Пропсы компонента секции автоперехода
 */
interface AutoTransitionSectionProps {
  /** Выбранный узел для редактирования */
  selectedNode: Node;
  /** Все узлы из всех листов для выбора цели перехода */
  getAllNodesFromAllSheets: Array<{ node: Node; sheetId: string; sheetName?: string }>;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
  /** Открыта ли секция автоперехода */
  isOpen: boolean;
  /** Функция переключения состояния секции */
  onToggle: () => void;
}

/**
 * Компонент секции автоперехода
 * 
 * Позволяет настроить автоматический переход к другому узлу
 * после отправки сообщения без ожидания ввода пользователя.
 * 
 * @param {AutoTransitionSectionProps} props - Пропсы компонента
 * @returns {JSX.Element} Секция автоперехода
 */
export function AutoTransitionSection({
  selectedNode,
  getAllNodesFromAllSheets,
  onNodeUpdate,
  isOpen,
  onToggle
}: AutoTransitionSectionProps) {
  return (
    <div className="space-y-3 sm:space-y-4">
      <SectionHeader
        title="Автопереход"
        description="Переход к следующему узлу без ожидания ответа"
        isOpen={isOpen}
        onToggle={onToggle}
        icon="bolt"
        iconGradient="from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50"
        iconColor="text-emerald-600 dark:text-emerald-400"
      />

      {isOpen && (
        <div className="space-y-3 sm:space-y-4 bg-gradient-to-br from-emerald-50/40 to-teal-50/20 dark:from-emerald-950/30 dark:to-teal-950/20 rounded-xl p-3 sm:p-4 border border-emerald-200/40 dark:border-emerald-800/40 backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Enable Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-gradient-to-br from-emerald-50/60 to-teal-50/40 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200/40 dark:border-emerald-700/40 hover:border-emerald-300/60 dark:hover:border-emerald-600/60 hover:shadow-sm transition-all duration-200">
            <div className="flex-1 min-w-0">
              <Label className="text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                <i className="fas fa-power-off text-xs sm:text-sm"></i>
                Включить автопереход
              </Label>
              <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">Активировать функцию автоперехода</div>
            </div>
            <div className="flex-shrink-0">
              <Switch
                checked={selectedNode.data.enableAutoTransition ?? false}
                onCheckedChange={(checked) => onNodeUpdate(selectedNode.id, { enableAutoTransition: checked })}
              />
            </div>
          </div>

          {/* Target Node Selection */}
          {selectedNode.data.enableAutoTransition && (
            <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 rounded-lg bg-gradient-to-br from-teal-50/60 to-cyan-50/40 dark:from-teal-950/30 dark:to-cyan-950/20 border border-teal-200/40 dark:border-teal-800/40 hover:shadow-sm transition-all duration-200">
              {/* Header */}
              <div className="flex items-start gap-2 sm:gap-2.5">
                <div className="w-6 sm:w-7 h-6 sm:h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-teal-200/50 dark:bg-teal-900/40">
                  <i className="fas fa-arrow-right-long text-xs sm:text-sm text-teal-600 dark:text-teal-400"></i>
                </div>
                <div className="min-w-0 flex-1">
                  <Label className="text-xs sm:text-sm font-semibold text-teal-900 dark:text-teal-100 block">
                    Целевой узел
                  </Label>
                  <div className="text-xs text-teal-700/70 dark:text-teal-300/70 mt-0.5">Куда перейти после отправки сообщения</div>
                </div>
              </div>

              {/* Dropdown Select */}
              <Select
                value={selectedNode.data.autoTransitionTo || ''}
                onValueChange={(value) => onNodeUpdate(selectedNode.id, { autoTransitionTo: value })}
              >
                <SelectTrigger className="text-xs sm:text-sm h-9 sm:h-10 bg-white/70 dark:bg-slate-950/50 border border-teal-300/50 dark:border-teal-700/50 hover:border-teal-400/70 dark:hover:border-teal-600/70 focus:border-teal-500 focus:ring-teal-400/30 transition-colors duration-200 rounded-lg text-teal-900 dark:text-teal-50">
                  <SelectValue placeholder="Выберите узел из списка" />
                </SelectTrigger>
                <SelectContent className="bg-gradient-to-br from-sky-50/95 to-blue-50/90 dark:from-slate-900/95 dark:to-slate-800/95 border border-teal-200/50 dark:border-teal-800/50 shadow-xl max-h-48 overflow-y-auto">
                  {getAllNodesFromAllSheets
                    .filter(({ node }) => node.id !== selectedNode.id)
                    .map(({ node, sheetId, sheetName }) => (
                      <SelectItem key={`${sheetId}-${node.id}`} value={node.id}>
                        <span className="text-xs sm:text-sm font-mono text-sky-700 dark:text-sky-300 truncate">
                          {formatNodeDisplay(node, sheetName)}
                        </span>
                      </SelectItem>
                    ))}

                  {(!getAllNodesFromAllSheets || getAllNodesFromAllSheets.filter(({ node }) => node.id !== selectedNode.id).length === 0) && (
                    <SelectItem value="no-nodes" disabled>
                      Создайте другие узлы
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>

              {/* Manual Input */}
              <div className="flex items-center gap-2 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg bg-white/60 dark:bg-slate-950/60 border border-teal-300/40 dark:border-teal-700/40 hover:border-teal-400/60 dark:hover:border-teal-600/60 hover:bg-white/80 dark:hover:bg-slate-900/60 focus-within:border-teal-500 dark:focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-400/30 dark:focus-within:ring-teal-600/30 transition-all duration-200">
                <i className="fas fa-code text-xs sm:text-sm text-teal-600 dark:text-teal-400 flex-shrink-0"></i>
                <Input
                  value={selectedNode.data.autoTransitionTo || ''}
                  onChange={(e) => onNodeUpdate(selectedNode.id, { autoTransitionTo: e.target.value })}
                  className="flex-1 text-xs sm:text-sm bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-teal-900 dark:text-teal-50 placeholder:text-teal-500/50 dark:placeholder:text-teal-400/50 p-0"
                  placeholder="Или введите ID узла вручную"
                />
              </div>

              {/* Confirmation Message */}
              {selectedNode.data.autoTransitionTo && (
                <div className="flex items-start gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-lg bg-emerald-100/50 dark:bg-emerald-900/20 border border-emerald-200/50 dark:border-emerald-800/50">
                  <i className="fas fa-check-circle text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm flex-shrink-0 mt-0.5"></i>
                  <p className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-300 leading-relaxed">
                    После отправки сообщения бот перейдёт к узлу <strong className="font-semibold">{selectedNode.data.autoTransitionTo}</strong>
                  </p>
                </div>
              )}

              {/* Warning Message */}
              <div className="flex items-start gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/50">
                <i className="fas fa-exclamation-triangle text-amber-600 dark:text-amber-400 text-xs sm:text-sm mt-0.5 flex-shrink-0"></i>
                <div className="space-y-1">
                  <p className="text-xs text-amber-600/80 dark:text-amber-400/70">
                    Возможны проблемы с автопереходами. Функция в разработке.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
