/**
 * @fileoverview Raw-редактор переменных окружения в формате .env
 * Позволяет редактировать все переменные как текст KEY=VALUE
 * @module components/editor/bot/card/BotEnvRawEditor
 */

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Check, X } from 'lucide-react';
import {
  parseEnvText, serializeEnvVars, SECRET_MASK, SYSTEM_KEYS, IGNORED_KEYS,
} from './env-raw-parser';

/** Свойства raw-редактора */
interface BotEnvRawEditorProps {
  /** Системные переменные (key, value) */
  systemVars: Array<{ key: string; value: string; isSecret: boolean }>;
  /** Кастомные переменные из БД */
  customItems: Array<{ id: number; key: string; value: string; isSecret: number | null }>;
  /** Колбэк обновления системной переменной */
  onSystemUpdate: (key: string, value: string) => void;
  /** Колбэк создания кастомной переменной */
  onCreate: (key: string, value: string, isSecret: number) => void;
  /** Колбэк обновления кастомной переменной */
  onUpdate: (id: number, value: string) => void;
  /** Колбэк удаления кастомной переменной */
  onDelete: (id: number) => void;
  /** Колбэк закрытия редактора */
  onClose: () => void;
}

/**
 * Raw-редактор переменных окружения
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BotEnvRawEditor({
  systemVars, customItems, onSystemUpdate, onCreate, onUpdate, onDelete, onClose,
}: BotEnvRawEditorProps) {
  /** Начальный текст для textarea */
  const initialText = useMemo(
    () => serializeEnvVars(systemVars, customItems),
    [systemVars, customItems],
  );

  const [text, setText] = useState(initialText);

  /** Обработчик сохранения */
  function handleSave() {
    const parsed = parseEnvText(text);
    const customMap = new Map(customItems.map(v => [v.key, v]));
    const systemMap = new Map(systemVars.map(v => [v.key, v.value]));
    const parsedKeys = new Set(parsed.map(p => p.key));

    for (const { key, value } of parsed) {
      if (IGNORED_KEYS.has(key)) continue;
      if (value === SECRET_MASK) continue;

      if (SYSTEM_KEYS.has(key)) {
        /** Обновляем системную если значение изменилось */
        if (systemMap.get(key) !== value) {
          onSystemUpdate(key, value);
        }
      } else if (customMap.has(key)) {
        /** Обновляем существующую кастомную */
        const existing = customMap.get(key)!;
        if (existing.value !== value) {
          onUpdate(existing.id, value);
        }
      } else {
        /** Создаём новую кастомную */
        onCreate(key, value, 0);
      }
    }

    /** Удаляем кастомные переменные, которых нет в textarea */
    for (const item of customItems) {
      if (!parsedKeys.has(item.key) && !SYSTEM_KEYS.has(item.key)) {
        onDelete(item.id);
      }
    }

    onClose();
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="font-mono text-xs border rounded min-h-[200px] resize-y"
        rows={12}
        placeholder="KEY=VALUE"
        spellCheck={false}
      />
      <div className="flex items-center gap-2 justify-end">
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={onClose}>
          <X className="h-3.5 w-3.5" /> Отмена
        </Button>
        <Button variant="default" size="sm" className="h-7 text-xs gap-1" onClick={handleSave}>
          <Check className="h-3.5 w-3.5" /> Сохранить
        </Button>
      </div>
    </div>
  );
}
