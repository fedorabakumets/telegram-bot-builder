/** @fileoverview Форма создания таблицы с проверкой названия. */
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/** Свойства формы создания таблицы. */
interface TableCreateFormProps {
  /** Создание таблицы в проекте. */
  onCreate: (name: string) => void | Promise<void>;
  /** Закрытие формы. */
  onCancel: () => void;
}
/**
 * Проверяет название и отображает результат запроса создания.
 * @param props - Обработчики создания и отмены.
 * @returns Форма новой таблицы.
 */
export function TableCreateForm({ onCreate, onCancel }: TableCreateFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  /**
   * Создаёт таблицу после проверки обязательного названия.
   * @returns Завершение запроса создания.
   */
  async function submit() {
    if (!name.trim()) { setError('Введите название таблицы'); inputRef.current?.focus(); return; }
    setPending(true);
    setError('');
    try { await onCreate(name.trim()); onCancel(); }
    catch { setError('Не удалось создать таблицу. Попробуйте ещё раз.'); }
    finally { setPending(false); }
  }
  return (
    <form className="space-y-3 rounded-lg border border-border p-3" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
      <label htmlFor="new-table-name" className="block text-sm font-medium">Название таблицы <span className="text-xs text-muted-foreground">Обязательно</span></label>
      <Input ref={inputRef} id="new-table-name" autoFocus value={name} disabled={pending} placeholder="Например, Заказы"
        aria-invalid={!!error} aria-describedby={error ? 'new-table-error' : undefined}
        onChange={(event) => { setName(event.target.value); if (event.target.value.trim()) setError(''); }}
        onKeyDown={(event) => { if (event.key === 'Escape' && !pending) onCancel(); }} />
      {error && <p id="new-table-error" role="alert" className="text-xs text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="outline" size="sm" disabled={pending}>{pending ? 'Создание…' : 'Создать'}</Button>
        <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={onCancel}>Отмена</Button>
      </div>
    </form>
  );
}
