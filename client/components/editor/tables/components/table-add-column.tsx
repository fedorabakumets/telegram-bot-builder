/** @fileoverview Добавление именованного столбца пользовательской таблицы. */
import { useState } from 'react';
/** Свойства формы столбца. */
interface TableAddColumnProps {
  /** Обработчик создания столбца. */
  onAdd: (name: string) => void;
}
/**
 * Показывает обязательное поле имени и кнопку добавления.
 * @param props - Обработчик добавления.
 * @returns Компактная форма столбца.
 */
export function TableAddColumn({ onAdd }: TableAddColumnProps) {
  const [name, setName] = useState('');
  return <form className="flex shrink-0 flex-wrap items-center gap-2 px-4 py-2" onSubmit={(event) => { event.preventDefault(); if (name.trim()) { onAdd(name.trim()); setName(''); } }}>
    <input aria-label="Имя нового столбца" required value={name} onChange={(event) => setName(event.target.value)} placeholder="Имя нового столбца" className="min-w-0 max-w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm" />
    <button type="submit" disabled={!name.trim()} className="tables-control rounded-md border border-border px-3 py-2 text-sm disabled:opacity-40">Добавить столбец</button>
  </form>;
}
