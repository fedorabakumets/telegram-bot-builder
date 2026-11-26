/**
 * @fileoverview Секция списка получателей узла отправки сообщения.
 * Поддерживает несколько получателей с типами: пользователь, по ID, администраторам.
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { VariableSelector } from '../variables/variable-selector';
import type { Variable } from '../../../inline-rich/types';
import type { Node } from '@shared/schema';
import {
  type MessageSendRecipient,
  type MessageSendRecipientType,
  createRecipient,
  getRecipients,
  normalizeRecipient,
} from './message-recipient-types';

/** Пропсы секции получателей сообщения */
interface MessageRecipientSectionProps {
  /** Выбранный узел */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
  /** Текстовые переменные для вставки */
  textVariables?: Variable[];
}

/** Типы узлов, для которых показывается секция */
const SUPPORTED_NODE_TYPES = ['message', 'start', 'command', 'media'] as const;

/**
 * Выбор чата для отправки сообщения
 * @param props - Свойства карточки
 * @returns JSX элемент карточки
 */
function RecipientCard({
  recipient,
  index,
  textVariables,
  onUpdate,
  onRemove,
}: {
  /** Данные получателя */
  recipient: MessageSendRecipient;
  /** Порядковый номер */
  index: number;
  /** Доступные переменные */
  textVariables: Variable[];
  /** Обновление полей получателя */
  onUpdate: (updates: Partial<MessageSendRecipient>) => void;
  /** Удаление получателя */
  onRemove?: () => void;
}) {
  return (
    <div className="border border-border bg-card rounded-lg p-3 space-y-2">
      {/* Выбор типа получателя */}
      <Select
        value={recipient.type}
        onValueChange={(v) => onUpdate({ type: v as MessageSendRecipientType })}
      >
        <SelectTrigger aria-label={`Куда отправить сообщение, строка ${index + 1}`} className="bg-background border-border h-auto min-h-9 text-left">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {recipient.type === 'admin_ids' && <SelectItem value="admin_ids">Администраторам бота</SelectItem>}
          <SelectItem value="user">В текущий чат</SelectItem>
          <SelectItem value="chat_id">В чат по ID или @имени</SelectItem>
        </SelectContent>
      </Select>

      {/* Поля Chat ID и Топик — только для типа chat_id */}
      {recipient.type === 'chat_id' && (
        <div className="space-y-1.5">
          {/* Переключатель группа/канал */}
          <div className="flex items-center gap-2 px-1">
            <Switch
              checked={recipient.isGroup ?? false}
              onCheckedChange={(v) => onUpdate({ isGroup: v })}
              id={`isGroup-${recipient.id}`}
            />
            <label htmlFor={`isGroup-${recipient.id}`} className="text-xs text-muted-foreground cursor-pointer select-none">
              Группа или канал (добавить -100)
            </label>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground w-16 flex-shrink-0">ID или @имя</span>
            <Input
              value={recipient.chatId ?? ''}
              onChange={(e) => onUpdate({ chatId: e.target.value })}
              placeholder="123456789, @channel или {переменная}"
              className="flex-1 h-8 text-sm"
            />
            <VariableSelector
              availableVariables={textVariables}
              onSelect={(v) => onUpdate({ chatId: `{${v}}` })}
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground w-16 flex-shrink-0">ID темы (необяз.)</span>
            <Input
              value={recipient.threadId ?? ''}
              onChange={(e) => onUpdate({ threadId: e.target.value })}
              placeholder="{thread_id} или число"
              className="flex-1 h-8 text-sm"
            />
            <VariableSelector
              availableVariables={textVariables}
              onSelect={(v) => onUpdate({ threadId: `{${v}}` })}
            />
          </div>

          {/* Разделитель */}
          <div className="border-t border-border my-1" />

          {/* Токен бота */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground w-16 flex-shrink-0">
              <i className="fas fa-key mr-1 text-[10px]" />
              Токен:
            </span>
            <Input
              value={recipient.botToken ?? ''}
              onChange={(e) => onUpdate({ botToken: e.target.value })}
              placeholder="{bot_token} или токен бота"
              className="flex-1 h-8 text-sm"
            />
            <VariableSelector
              availableVariables={textVariables}
              onSelect={(v) => onUpdate({ botToken: `{${v}}` })}
            />
          </div>
          <p className="text-[10px] text-slate-400 px-1">
            По умолчанию — токен текущего бота. Используй переменную{' '}
            <span className="font-mono">{'{token_status.instance.token}'}</span> для отправки через другой бот.
          </p>
        </div>
      )}

      {onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
          aria-label={`Убрать чат из рассылки сообщения, строка ${index + 1}`}
          onClick={onRemove}
        >
          <i className="fas fa-trash text-xs mr-1" />
          Убрать чат
        </Button>
      )}
    </div>
  );
}

/**
 * Выбор чатов для отправки сообщения. Дополнительный чат задаётся по ID или имени.
 * @param props - Свойства компонента
 * @returns JSX элемент или null, если тип узла не поддерживается
 */
export function MessageRecipientSection({ selectedNode, onNodeUpdate, textVariables = [] }: MessageRecipientSectionProps) {
  if (!SUPPORTED_NODE_TYPES.includes(selectedNode.type as typeof SUPPORTED_NODE_TYPES[number])) {
    return null;
  }

  const recipients = getRecipients(selectedNode.data);

  /**
   * Сохраняет обновлённый список получателей в узел
   * @param next - Новый список получателей
   */
  function save(next: MessageSendRecipient[]) {
    const normalized = (next.length > 0 ? next : [createRecipient()]).map((r, i) => normalizeRecipient(r, i));
    const primary = normalized[0];
    onNodeUpdate(selectedNode.id, {
      messageSendRecipients: normalized,
      // legacy-поля для обратной совместимости
      messageSendTarget: primary.type === 'chat_id' ? 'chat_id' : 'user',
      messageSendChatId: primary.type === 'chat_id' ? (primary.chatId ?? '') : '',
      messageSendThreadId: primary.type === 'chat_id' ? (primary.threadId ?? '') : '',
    });
  }

  /** Обновляет поля конкретного получателя */
  function update(index: number, updates: Partial<MessageSendRecipient>) {
    save(recipients.map((r, i) => (i === index ? { ...r, ...updates } : r)));
  }

  /** Удаляет получателя (минимум 1 остаётся) */
  function remove(index: number) {
    if (recipients.length <= 1) return;
    save(recipients.filter((_, i) => i !== index));
  }

  return (
    <div className="border-t border-border pt-3 space-y-2">
      <Label className="text-xs font-medium text-foreground">Куда отправить сообщение?</Label>

      {recipients.map((r, i) => (
        <RecipientCard
          key={r.id}
          recipient={r}
          index={i}
          textVariables={textVariables}
          onUpdate={(updates) => update(i, updates)}
          onRemove={recipients.length > 1 ? () => remove(i) : undefined}
        />
      ))}

      <Button
        type="button"
        variant="outline"
        className="w-full border-dashed border-border text-foreground hover:bg-muted"
        onClick={() => save([...recipients, createRecipient('chat_id')])}
      >
        <i className="fas fa-plus mr-2" />
        Добавить ещё один чат
      </Button>
    </div>
  );
}
