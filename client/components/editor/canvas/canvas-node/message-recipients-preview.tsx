/**
 * @fileoverview Компонент превью получателей сообщения
 *
 * Лаконично отображает список получателей узла message на канвасе.
 */

import { Node } from '@/types/bot';

/** Метки типов получателей */
const TYPE_LABELS: Record<string, string> = {
  user: 'Пользователь',
  chat_id: 'Чат',
  admin_ids: 'Администраторы',
};

/**
 * Форматирует одного получателя в короткую строку
 * @param r - Объект получателя
 * @returns Строка для отображения
 */
function formatRecipient(r: { type: string; chatId?: string }): string {
  if (r.type === 'chat_id' && r.chatId) return r.chatId;
  return TYPE_LABELS[r.type] ?? r.type;
}

/**
 * Компонент превью получателей сообщения
 *
 * @param props - Свойства компонента
 * @param props.node - Узел сообщения
 * @returns JSX элемент или null если получателей нет / только дефолтный user
 */
export function MessageRecipientsPreview({ node }: { node: Node }) {
  const recipients: any[] = node.data.messageSendRecipients ?? [];

  // Не показываем если только один получатель типа user (дефолт)
  if (recipients.length === 0 || (recipients.length === 1 && recipients[0].type === 'user')) {
    return null;
  }

  const labels = recipients.map(formatRecipient);

  return (
    <div className="flex items-center gap-1.5 mt-1 mb-2 flex-wrap">
      <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">→</span>
      {labels.map((label, i) => (
        <span
          key={i}
          className="text-xs px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-mono truncate max-w-[120px]"
          title={label}
        >
          {label}
        </span>
      ))}
    </div>
  );
}
