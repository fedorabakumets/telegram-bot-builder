/** @fileoverview Фильтр времени самих сообщений в личных диалогах. */
import { useEffect, useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { messagePeriodSchema } from '@shared/message-period';
import { useDirectoryControls } from '../content/user-directory-controls';

/**
 * Переводит московскую минуту в однозначную границу с часовым поясом.
 * @param value - Значение поля даты и времени
 * @param end - Включать последнюю минуту целиком
 * @returns Граница либо отсутствие ограничения
 */
export function messageTimeBoundary(value: string, end = false): string | undefined {
  return value ? `${value}${end ? ':59.999' : ':00.000'}+03:00` : undefined;
}

/**
 * Редактирует период без кнопки применения, проверяя порядок дат до запроса.
 * @returns Два поля даты и времени по Москве
 */
export function DialogMessagePeriod() {
  const controls = useDirectoryControls();
  const from = controls?.advanced.messageFrom;
  const to = controls?.advanced.messageTo;
  const [draft, setDraft] = useState({ from: from?.slice(0, 16) ?? '', to: to?.slice(0, 16) ?? '' });
  const [error, setError] = useState('');
  useEffect(() => { setDraft({ from: from?.slice(0, 16) ?? '', to: to?.slice(0, 16) ?? '' }); setError(''); }, [from, to]);
  if (!controls) return null;
  /** Применяет корректный период; ошибочные границы остаются в полях для исправления. */
  const update = (next: typeof draft) => {
    setDraft(next);
    const period = { messageFrom: messageTimeBoundary(next.from), messageTo: messageTimeBoundary(next.to, true) };
    const parsed = messagePeriodSchema.safeParse(period);
    if (!parsed.success) { setError(parsed.error.issues[0].message); return; }
    setError(''); controls.setAdvanced({ ...controls.advanced, ...period });
  };
  return <fieldset className="min-w-0 space-y-2 border-t border-border pt-3">
    <legend className="flex items-center gap-2 text-xs font-medium"><CalendarClock className="h-4 w-4" />Период сообщений · Москва</legend>
    <label className="block min-w-0 space-y-1 text-xs text-muted-foreground">С
      <Input type="datetime-local" step={60} value={draft.from} aria-label="Сообщения с даты и времени"
        className="h-9 min-w-0 bg-background text-xs" aria-invalid={!!error}
        onInput={event => update({ ...draft, from: event.currentTarget.value })}
        onChange={event => update({ ...draft, from: event.target.value })} />
    </label>
    <label className="block min-w-0 space-y-1 text-xs text-muted-foreground">По
      <Input type="datetime-local" step={60} value={draft.to} aria-label="Сообщения по дату и время"
        className="h-9 min-w-0 bg-background text-xs" aria-invalid={!!error}
        onInput={event => update({ ...draft, to: event.currentTarget.value })}
        onChange={event => update({ ...draft, to: event.target.value })} />
    </label>
    {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    {(draft.from || draft.to) && <Button variant="ghost" size="sm" className="h-7 px-0 text-xs text-muted-foreground"
      onClick={() => update({ from: '', to: '' })}>Сбросить период</Button>}
  </fieldset>;
}
