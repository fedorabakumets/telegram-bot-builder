/**
 * @fileoverview Секция выбора получателя сообщения
 *
 * Позволяет выбрать, кому отправлять сообщение: пользователю или по конкретному chat_id.
 * Поддерживает вставку переменных в поле chat_id через VariableSelector.
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VariableSelector } from '../variables/variable-selector';
import type { Variable } from '../../../inline-rich/types';
import type { Node } from '@shared/schema';

/** Пропсы секции получателя сообщения */
interface MessageRecipientSectionProps {
  /** Выбранный узел */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
  /** Текстовые переменные для вставки в поле chat_id */
  textVariables?: Variable[];
}

/** Типы узлов, для которых показывается секция получателя */
const SUPPORTED_NODE_TYPES = ['message', 'start', 'command'] as const;

/**
 * Секция выбора получателя сообщения
 *
 * @param props - Свойства компонента
 * @returns JSX элемент или null, если тип узла не поддерживается
 */
export function MessageRecipientSection({ selectedNode, onNodeUpdate, textVariables }: MessageRecipientSectionProps) {
  const nodeType = selectedNode.type as string;

  // Показываем только для поддерживаемых типов узлов
  if (!SUPPORTED_NODE_TYPES.includes(nodeType as typeof SUPPORTED_NODE_TYPES[number])) {
    return null;
  }

  /** Текущий тип получателя */
  const target: 'user' | 'chat_id' = selectedNode.data.messageSendTarget ?? 'user';
  /** Текущий chat_id */
  const chatId: string = selectedNode.data.messageSendChatId ?? '';
  /** Текущий thread_id топика */
  const threadId: string = selectedNode.data.messageSendThreadId ?? '';

  /**
   * Обработчик смены типа получателя
   * @param value - Новый тип получателя
   */
  function handleTargetChange(value: 'user' | 'chat_id') {
    const updates: Partial<any> = { messageSendTarget: value };
    if (value === 'user') {
      updates.messageSendChatId = '';
    }
    onNodeUpdate(selectedNode.id, updates);
  }

  /**
   * Обработчик изменения chat_id
   * @param e - Событие изменения поля ввода
   */
  function handleChatIdChange(e: React.ChangeEvent<HTMLInputElement>) {
    onNodeUpdate(selectedNode.id, { messageSendChatId: e.target.value });
  }

  return (
    <div className="bg-gradient-to-br from-blue-50/40 to-cyan-50/20 dark:from-blue-950/30 dark:to-cyan-900/20 border border-blue-200/40 dark:border-blue-800/40 rounded-xl p-3 space-y-2">
      <Label className="text-xs font-medium text-blue-700 dark:text-blue-300">
        Получатель
      </Label>

      {/* Вариант: пользователю */}
      <button
        type="button"
        onClick={() => handleTargetChange('user')}
        className={`flex items-center gap-2 w-full text-left text-sm px-2 py-1 rounded-lg transition-colors ${
          target === 'user'
            ? 'text-blue-700 dark:text-blue-300 font-medium'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <span className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 ${
          target === 'user'
            ? 'border-blue-500 bg-blue-500'
            : 'border-muted-foreground'
        }`} />
        Пользователю
      </button>

      {/* Вариант: по ID */}
      <button
        type="button"
        onClick={() => handleTargetChange('chat_id')}
        className={`flex items-center gap-2 w-full text-left text-sm px-2 py-1 rounded-lg transition-colors ${
          target === 'chat_id'
            ? 'text-blue-700 dark:text-blue-300 font-medium'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <span className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 ${
          target === 'chat_id'
            ? 'border-blue-500 bg-blue-500'
            : 'border-muted-foreground'
        }`} />
        По ID:
      </button>

      {/* Поле ввода chat_id с кнопкой вставки переменной */}
      {target === 'chat_id' && (
        <>
          <div className="flex items-center gap-1 ml-5">
            <Input
              value={chatId}
              onChange={handleChatIdChange}
              placeholder="123456789 или {admin_id}"
              className="flex-1 h-8 text-sm"
            />
            <VariableSelector
              availableVariables={textVariables || []}
              onSelect={(varName) => onNodeUpdate(selectedNode.id, { messageSendChatId: `{${varName}}` })}
            />
          </div>
          {/* Поле топика — опционально */}
          <div className="flex items-center gap-1 ml-5">
            <span className="text-xs text-muted-foreground w-16 flex-shrink-0">Топик ID:</span>
            <Input
              value={threadId}
              onChange={e => onNodeUpdate(selectedNode.id, { messageSendThreadId: e.target.value })}
              placeholder="{thread_id} или число"
              className="flex-1 h-8 text-sm"
            />
            <VariableSelector
              availableVariables={textVariables || []}
              onSelect={(varName) => onNodeUpdate(selectedNode.id, { messageSendThreadId: `{${varName}}` })}
            />
          </div>
        </>
      )}
    </div>
  );
}
