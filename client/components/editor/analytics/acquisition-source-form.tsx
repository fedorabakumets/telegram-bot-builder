/** @fileoverview Создание и переименование площадки без изменения опубликованных ссылок. */
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAcquisitionMutation } from './use-acquisition';
import type { AcquisitionSource } from './acquisition-types';
/** Форма источника. @param props - Проект, исходная площадка и обработчики. @returns Поля и отдельные ошибки ввода и запроса. */
export function AcquisitionSourceForm({ projectId, source, onSaved, onCancel }: {
  /** Проект. */ projectId: number; /** Редактируемая площадка. */ source?: AcquisitionSource;
  /** Успешное сохранение. */ onSaved: (source: AcquisitionSource) => void; /** Закрытие формы. */ onCancel: () => void;
}) {
  const [name, setName] = useState(source?.name ?? '');
  const [kind, setKind] = useState(source?.kind ?? 'telegram');
  const [url, setUrl] = useState(source?.url ?? '');
  const [error, setError] = useState('');
  const mutation = useAcquisitionMutation(projectId);
  /** Сохраняет площадку. @param event - Отправка формы. @returns Завершение сохранения либо ошибка формы. */
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) { setError('Укажите название площадки.'); return; }
    setError('');
    try { const result = await mutation.mutateAsync({ resource: 'sources', id: source?.id, body: { name: name.trim(), kind, url: url.trim() || null } }); onSaved(result.item as AcquisitionSource); } catch { /* Ошибка доступна в состоянии запроса. */ }
  }
  return <form className="analytics-report-details space-y-4" onSubmit={save}>
    <h4>{source ? 'Изменить источник' : 'Новый источник'}</h4><div className="analytics-form-grid">
      <label>Название площадки · обязательно<Input autoFocus value={name} aria-invalid={!!error} aria-describedby={error ? 'acquisition-source-error' : undefined} onChange={event => { setName(event.target.value); if (event.target.value.trim()) setError(''); }} placeholder="Например, канал о путешествиях" /></label>
      <label>Тип площадки<select className="analytics-native-field" value={kind} onChange={event => setKind(event.target.value as AcquisitionSource['kind'])}><option value="telegram">Telegram</option><option value="website">Сайт</option><option value="social">Социальная сеть</option><option value="other">Другая площадка</option></select></label>
      <label>Адрес площадки<Input type="url" value={url} onChange={event => setUrl(event.target.value)} placeholder="https://t.me/…" /></label></div>
    {error && <p id="acquisition-source-error" role="alert" className="text-sm text-destructive">{error}</p>}
    {mutation.isError && <p role="alert" className="text-sm text-destructive">{mutation.error.message}</p>}
    <div className="flex flex-wrap gap-3"><Button variant="outline" type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Сохраняем…' : 'Сохранить источник'}</Button><Button variant="ghost" type="button" onClick={onCancel} disabled={mutation.isPending}>Отмена</Button></div>
  </form>;
}
