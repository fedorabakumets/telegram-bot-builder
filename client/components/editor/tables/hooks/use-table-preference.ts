/** @fileoverview Сохранение настроек представления таблицы в текущем браузере. */
import { useState, useEffect, type Dispatch, type SetStateAction } from 'react';
/**
 * Читает и сохраняет настройку без зависимости от доступности хранилища.
 * @param key - Уникальный ключ проекта и таблицы.
 * @param initial - Начальное значение.
 * @returns Значение настройки и функция изменения.
 */
export function useTablePreference<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try { const raw = localStorage.getItem(key); return raw === null ? initial : JSON.parse(raw); }
    catch { return initial; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Настройка остаётся доступной в памяти. */ } }, [key, value]);
  return [value, setValue];
}
