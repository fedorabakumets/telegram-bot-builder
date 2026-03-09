/**
 * @fileoverview Компонент переключателя участия узла в рассылке
 *
 * Позволяет включить/выключить участие узла типа message
 * в автоматической рассылке при нажатии кнопки "Начать рассылку".
 * Поддерживает привязку к конкретному broadcast узлу.
 *
 * @module BroadcastToggle
 */

import { Node } from '@shared/schema';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/**
 * Пропсы компонента переключателя рассылки
 */
interface BroadcastToggleProps {
  /** Выбранный узел для редактирования */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
  /** Все узлы проекта для выбора broadcast узла */
  allNodes?: Node[];
}

/**
 * Компонент переключателя участия узла в рассылке
 *
 * @param {BroadcastToggleProps} props - Пропсы компонента
 * @returns {JSX.Element} Переключатель рассылки
 */
export function BroadcastToggle({ selectedNode, onNodeUpdate, allNodes = [] }: BroadcastToggleProps) {
  // Находим все broadcast узлы
  const broadcastNodes = allNodes.filter(n => n.type === 'broadcast');
  
  const targetBroadcast = selectedNode.data.broadcastTargetNode || 'all';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 p-3 sm:p-4 md:p-5 rounded-lg bg-gradient-to-br from-blue-50/60 to-indigo-50/40 dark:from-blue-950/30 dark:to-indigo-950/20 border border-blue-200/40 dark:border-blue-700/40 hover:border-blue-300/60 dark:hover:border-blue-600/60 hover:shadow-sm transition-all duration-200">
      <div className="flex-1 min-w-0 space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs sm:text-sm font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
            <i className="fas fa-broadcast-tower text-xs sm:text-sm"></i>
            Участвует в рассылке
          </Label>
          <Switch
            checked={selectedNode.data.enableBroadcast ?? false}
            onCheckedChange={(checked) =>
              onNodeUpdate(selectedNode.id, { enableBroadcast: checked })
            }
          />
        </div>
        <div className="text-xs text-blue-600 dark:text-blue-400">
          Отправлять это сообщение при рассылке
        </div>
        
        {/* Выбор целевого broadcast узла */}
        {broadcastNodes.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-blue-200/40 dark:border-blue-700/40">
            <Label htmlFor="broadcastTargetNode" className="text-xs font-medium text-blue-600 dark:text-blue-400">
              Узел рассылки
            </Label>
            <Select
              value={targetBroadcast}
              onValueChange={(value) =>
                onNodeUpdate(selectedNode.id, { broadcastTargetNode: value })
              }
            >
              <SelectTrigger id="broadcastTargetNode" className="w-full h-8 text-xs">
                <SelectValue placeholder="Все рассылки" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <span>🔄</span>
                    <span>Все рассылки</span>
                  </div>
                </SelectItem>
                {broadcastNodes.map(node => (
                  <SelectItem key={node.id} value={node.id}>
                    <div className="flex items-center gap-2">
                      <span>📢</span>
                      <span className="truncate">Рассылка</span>
                      <span className="text-xs text-muted-foreground font-mono">({node.id})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-blue-500 dark:text-blue-400">
              {targetBroadcast && targetBroadcast !== 'all'
                ? 'Сообщение будет отправлено только при запуске выбранной рассылки'
                : 'Сообщение будет отправлено при любой рассылке'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
