/** @fileoverview Действия рассылки найденным людям и доступные галочки выбора. */
import { CheckSquare, Loader2, Megaphone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useFoundBroadcast } from './found-broadcast-context';

/**
 * Показывает быстрый переход к сообщению для полной выборки либо отмеченных людей.
 * @returns Компактная панель без отправки сообщений
 */
export function FoundBroadcastActions() {
  const controls = useFoundBroadcast();
  if (!controls || (!controls.hasFilters && !controls.selecting && !controls.busy && !controls.error)) return null;
  return <div className="flex min-w-0 flex-wrap items-center gap-2" aria-label="Рассылка по результатам поиска">
    {(controls.hasFilters || controls.selecting || controls.busy) && <Button variant="outline" size="sm" className="h-8 gap-2 text-xs"
      disabled={!controls.enabled || controls.busy || (controls.selecting && controls.selected.size === 0)}
      onClick={() => void controls.open(controls.selecting)}>
      {controls.busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
      {controls.busy ? 'Собираем получателей…' : controls.selecting
        ? `Рассылка выбранным · ${controls.selected.size}` : 'Рассылка по найденным'}
    </Button>}
    {controls.selecting && <Button variant="ghost" size="sm" className="h-8 px-2 text-xs"
      disabled={controls.busy} onClick={() => void controls.selectAll()}>Выбрать всех</Button>}
    {(controls.selecting || controls.busy) && <Button variant="ghost" size="sm" className="h-8 gap-2 px-2 text-xs text-muted-foreground"
      onClick={controls.cancel}><X className="h-4 w-4" />
      {controls.selecting ? 'Отменить выбор' : controls.busy ? 'Отменить' : 'Выбрать'}
    </Button>}
    {!controls.enabled && <p className="w-full text-xs text-muted-foreground">Выберите бота для рассылки.</p>}
    {controls.error && <p role="alert" className="w-full text-xs text-destructive">{controls.error}</p>}
  </div>;
}

/** Компактно включает выбор рядом с поиском, не занимая отдельную строку списка. @returns Кнопка-иконка выбора. */
export function FoundBroadcastToggle() {
  const controls = useFoundBroadcast();
  if (!controls) return null;
  const active = controls.selecting || controls.busy;
  return <Button variant="outline" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground"
    disabled={!controls.enabled} aria-pressed={active}
    aria-label={active ? 'Закрыть режим выбора' : 'Выбрать пользователей для рассылки'}
    title={active ? 'Отменить выбор' : 'Выбрать пользователей для рассылки'}
    onClick={active ? controls.cancel : controls.toggleSelection}>
    {active ? <X className="h-4 w-4" /> : <CheckSquare className="h-4 w-4" />}
  </Button>;
}

/**
 * Добавляет независимую галочку, сохраняя переход по имени и аватарке.
 * @param props - Человек, которого отмечает пользователь
 * @returns Галочка только в режиме выбора
 */
export function FoundBroadcastCheckbox({ userId, name, username }: {
  /** Telegram ID человека. */ userId: string | number;
  /** Имя для доступной подписи. */ name?: string | null;
  /** Username для проверки получателя в редакторе. */ username?: string | null;
}) {
  const controls = useFoundBroadcast();
  if (!controls?.selecting || !/^[1-9]\d*$/.test(String(userId))) return null;
  return <Checkbox className="shrink-0" checked={controls.selected.has(String(userId))} disabled={controls.busy}
    aria-label={`Выбрать для рассылки: ${name || userId}`} onClick={event => event.stopPropagation()}
    onCheckedChange={() => controls.toggle(String(userId), name, username)} />;
}
