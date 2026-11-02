/** @fileoverview Обратимое архивирование и переименование рекламных объектов. */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAcquisitionMutation } from './use-acquisition';
/** Показывает обратимые действия. @param props - Объект каталога и его состояние. @returns Архивирование, восстановление и переименование. */
export function AcquisitionResourceActions({ projectId, resource, id, archived, name, label }: {
  /** Проект. */ projectId: number; /** Тип объекта. */ resource: 'sources' | 'placements' | 'links' | 'expenses';
  /** Понятное имя для доступных подписей действий. */ label?: string;
  /** Объект. */ id: number; /** Объект в архиве. */ archived: boolean; /** Редактируемое название размещения. */ name?: string;
}) {
  const mutation = useAcquisitionMutation(projectId);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name ?? '');
  /** Применяет изменение. @param body - Новые разрешённые поля. @returns Завершение записи либо ошибка объекта. */
  async function change(body: unknown) { try { await mutation.mutateAsync({ resource, id, body }); setEditing(false); } catch { /* Ошибка доступна в карточке объекта. */ } }
  return <div className="space-y-2"><div className="flex flex-wrap gap-2">
    {name != null && !editing && <Button variant="ghost" size="sm" disabled={mutation.isPending} aria-label={`Переименовать: ${name}`} onClick={() => setEditing(true)}>Переименовать</Button>}
    {!editing && <Button variant="ghost" size="sm" disabled={mutation.isPending} aria-label={`${archived ? 'Восстановить' : resource === 'expenses' ? 'Отменить расход' : 'В архив'}: ${label ?? name ?? id}`} onClick={() => void change({ archived: !archived })}>{mutation.isPending ? 'Сохраняем…' : archived ? 'Восстановить' : resource === 'expenses' ? 'Отменить расход' : 'В архив'}</Button>}
  </div>{editing && <form onSubmit={event => { event.preventDefault(); if (draft.trim()) void change({ name: draft.trim() }); }} className="flex flex-wrap gap-2"><Input aria-label="Новое название источника" value={draft} onChange={event => setDraft(event.target.value)} required autoFocus /><Button type="submit" variant="outline" size="sm" disabled={!draft.trim() || mutation.isPending}>Сохранить название</Button><Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>Отмена</Button></form>}
    {mutation.isError && <p className="text-sm text-destructive" role="alert">{mutation.error.message}</p>}
  </div>;
}
