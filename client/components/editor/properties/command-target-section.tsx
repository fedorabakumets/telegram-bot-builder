/**
 * @fileoverview Секция выбора команды для кнопки действия
 * 
 * Компонент отвечает за отображение и редактирование настроек команды.
 * Включает выпадающий список доступных команд и поле ручного ввода,
 * а также предупреждение о некорректном формате команды.
 */

import { Node, Button } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { STANDARD_COMMANDS } from '@/lib/commands';

/**
 * Пропсы компонента CommandTargetSection
 */
interface CommandTargetSectionProps {
  /** Текущий узел для редактирования */
  selectedNode: Node;
  /** Кнопка с действием command */
  button: Button;
  /** Все узлы текущего листа */
  allNodes: Node[];
  /** Функция обновления кнопки */
  onButtonUpdate: (nodeId: string, buttonId: string, updates: Partial<Button>) => void;
}

/**
 * Секция настройки команды для кнопки
 * 
 * @param props - Пропсы компонента
 * @returns JSX компонент настройки команды
 */
export function CommandTargetSection({
  selectedNode,
  button,
  allNodes,
  onButtonUpdate,
}: CommandTargetSectionProps) {
  const isInvalidCommand = button.target && !button.target.startsWith('/');

  return (
    <div className="mt-2 space-y-2">
      <Select
        value={button.target || ''}
        onValueChange={(value) => onButtonUpdate(selectedNode.id, button.id, { target: value })}
      >
        <SelectTrigger className="text-xs bg-white/60 dark:bg-slate-950/60 border border-orange-300/40 dark:border-orange-700/40 hover:border-orange-400/60 dark:hover:border-orange-600/60 focus:border-orange-500 focus:ring-orange-400/30">
          <SelectValue placeholder="Выберите команду" />
        </SelectTrigger>
        <SelectContent className="bg-gradient-to-br from-orange-50/95 to-amber-50/90 dark:from-slate-900/95 dark:to-slate-800/95 max-h-48 overflow-y-auto">
          {allNodes
            .filter(node => (node.type === 'start' || node.type === 'command') && node.data.command)
            .map((node) => (
              <SelectItem key={node.id} value={node.data.command!}>
                <div className="flex items-center space-x-2">
                  <i className={`${node.type === 'start' ? 'fas fa-play' : 'fas fa-terminal'} text-xs`}></i>
                  <span>{node.data.command}</span>
                  {node.data.description && (
                    <span className="text-gray-500">- {node.data.description}</span>
                  )}
                </div>
              </SelectItem>
            ))}
          {STANDARD_COMMANDS.map((cmd) => (
            <SelectItem key={cmd.command} value={cmd.command}>
              <div className="flex items-center space-x-2">
                <i className="fas fa-lightbulb text-yellow-500 text-xs"></i>
                <span>{cmd.command}</span>
                <span className="text-gray-500">- {cmd.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        value={button.target || ''}
        onChange={(e) => onButtonUpdate(selectedNode.id, button.id, { target: e.target.value })}
        className="text-xs"
        placeholder="Или введите команду вручную (например: /help)"
      />

      {isInvalidCommand && (
        <div className="flex items-center text-xs text-warning-foreground bg-warning/10 dark:bg-warning/5 border border-warning/20 dark:border-warning/10 p-2 rounded-md">
          <svg className="w-3 h-3 mr-2 text-warning" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>Команда должна начинаться с символа "/"</span>
        </div>
      )}
    </div>
  );
}
