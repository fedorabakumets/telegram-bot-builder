/** @fileoverview Понятная пометка контакта, найденного только в сохранённой групповой истории. */
import { UsersRound } from 'lucide-react';
import type { UserBotData } from '@shared/schema';
import { formatDate } from '../../../utils';
/**
 * Отличает групповую историю от личного обращения и показывает дату сохранённого факта.
 * @param props - Контакт текущей строки или раскрытого бота.
 * @returns Пометка и первая дата либо отсутствие пометки.
 */
export function UserContactOrigin({ user }: { /** Данные контакта. */ user: UserBotData }) {
  if (user.contactOrigin !== 'group_history') return null;
  const firstDate = user.firstSavedMessageAt ? new Date(user.firstSavedMessageAt).toLocaleDateString('ru-RU', { timeZone: 'Europe/Moscow' }) : null;
  return <div className="space-y-1 text-xs text-muted-foreground"
    title="Сохранены действия в группе. Личное обращение к этому боту не подтверждено.">
    <span className="inline-flex items-center gap-1.5"><UsersRound className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />Из групповой истории</span>
    {firstDate && <p className="tabular-nums" title={formatDate(user.firstSavedMessageAt)}>Первое сообщение: {firstDate}</p>}
  </div>;
}
