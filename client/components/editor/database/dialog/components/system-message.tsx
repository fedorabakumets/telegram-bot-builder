/**
 * @fileoverview Системное событие в ленте диалога
 * @module dialog/components/system-message
 */

import { ShieldAlert, ShieldCheck } from 'lucide-react';

/** Свойства системного события */
interface Props {
  /** Текст события */ text: string | null | undefined;
  /** Технические данные события */ data: unknown;
  /** Время события */ createdAt: Date | string | null;
}

/**
 * Показывает блокировку или разблокировку как разделитель ленты.
 * @param props - Свойства события
 * @returns JSX элемент
 */
export function SystemMessage({ text, data, createdAt }: Props) {
  const event = (data as { event?: string } | null)?.event;
  const blocked = event === 'bot_blocked';
  const Icon = blocked ? ShieldAlert : ShieldCheck;
  const time = createdAt ? new Date(createdAt).toLocaleString('ru-RU') : '';
  return <div className="flex justify-center py-2" data-testid={`dialog-message-system-${event ?? 'event'}`}>
    <div className="flex items-center gap-2 rounded-full border bg-muted/70 px-3 py-1.5 text-xs text-muted-foreground">
      <Icon className={`h-3.5 w-3.5 ${blocked ? 'text-amber-500' : 'text-emerald-500'}`} />
      <span>{text || 'Системное событие'}</span>
      {time && <time className="opacity-70">{time}</time>}
    </div>
  </div>;
}
