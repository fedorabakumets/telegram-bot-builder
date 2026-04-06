/**
 * @fileoverview Переиспользуемый редактор пар ключ-значение
 * @module components/editor/properties/components/common/key-value-editor
 */
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react';

/** Пара ключ-значение */
export interface KeyValuePair {
  /** Уникальный идентификатор пары */
  id: string;
  /** Ключ */
  key: string;
  /** Значение */
  value: string;
}

/** Пропсы компонента редактора пар ключ-значение */
interface KeyValueEditorProps {
  /** Список пар */
  pairs: KeyValuePair[];
  /** Обработчик изменения списка */
  onChange: (pairs: KeyValuePair[]) => void;
  /** Плейсхолдер для поля ключа */
  keyPlaceholder?: string;
  /** Плейсхолдер для поля значения */
  valuePlaceholder?: string;
}

/**
 * Конвертирует массив пар в JSON строку
 * @param pairs - массив пар ключ-значение
 * @returns JSON строка
 */
export function pairsToJson(pairs: KeyValuePair[]): string {
  if (!pairs.length) return '';
  return JSON.stringify(pairs.map(({ key, value }) => ({ key, value })));
}

/**
 * Конвертирует JSON строку в массив пар
 * @param json - JSON строка
 * @returns массив пар ключ-значение
 */
export function jsonToPairs(json: string): KeyValuePair[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => ({
        id: Date.now().toString() + Math.random(),
        key: item.key || '',
        value: item.value || '',
      }));
    }
    if (typeof parsed === 'object' && parsed !== null) {
      return Object.entries(parsed).map(([key, value]) => ({
        id: Date.now().toString() + Math.random(),
        key,
        value: String(value),
      }));
    }
  } catch {
    // невалидный JSON
  }
  return [];
}

/**
 * Компонент редактора пар ключ-значение
 * @param props - свойства компонента
 * @returns JSX элемент
 */
export function KeyValueEditor({
  pairs,
  onChange,
  keyPlaceholder = 'Ключ',
  valuePlaceholder = 'Значение',
}: KeyValueEditorProps) {
  /** Обновляет поле пары по id */
  const update = (id: string, field: 'key' | 'value', val: string) => {
    onChange(pairs.map((p) => (p.id === id ? { ...p, [field]: val } : p)));
  };

  /** Удаляет пару по id */
  const remove = (id: string) => {
    onChange(pairs.filter((p) => p.id !== id));
  };

  /** Добавляет новую пустую пару */
  const add = () => {
    onChange([...pairs, { id: Date.now().toString(), key: '', value: '' }]);
  };

  return (
    <div className="space-y-1.5">
      {pairs.map((pair) => (
        <div key={pair.id} className="flex gap-1.5 items-center">
          <Input
            value={pair.key}
            onChange={(e) => update(pair.id, 'key', e.target.value)}
            placeholder={keyPlaceholder}
            className="h-7 text-xs font-mono flex-1"
          />
          <Input
            value={pair.value}
            onChange={(e) => update(pair.id, 'value', e.target.value)}
            placeholder={valuePlaceholder}
            className="h-7 text-xs font-mono flex-1"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => remove(pair.id)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-xs text-muted-foreground w-full justify-start gap-1.5 px-1"
        onClick={add}
      >
        <Plus className="h-3.5 w-3.5" />
        Добавить параметр
      </Button>
    </div>
  );
}
