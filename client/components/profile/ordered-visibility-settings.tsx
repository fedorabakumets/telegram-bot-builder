/** @fileoverview Общий список управления порядком и видимостью элементов интерфейса. */
import { ArrowDown, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

/** Свойства списка действий с переключателями. */
interface OrderedVisibilitySettingsProps {
  /** Название группы. */
  legend: string;
  /** Префикс идентификаторов полей. */
  idPrefix: string;
  /** Доступные ключи в текущем порядке. */
  items: string[];
  /** Подписи элементов. */
  titles: Readonly<Record<string, string>>;
  /** Ключи скрытых элементов. */
  hidden: string[];
  /** Сохраняет обновлённый порядок. */
  onOrderChange: (items: string[]) => void;
  /** Сохраняет обновлённую видимость. */
  onHiddenChange: (items: string[]) => void;
}

/**
 * Показывает переключатели видимости и кнопки перемещения.
 * @param props - Элементы и обработчики списка.
 * @returns Настраиваемый список действий.
 */
export function OrderedVisibilitySettings({ legend, idPrefix, items, titles, hidden, onOrderChange, onHiddenChange }: OrderedVisibilitySettingsProps) {
  /**
   * Меняет кнопку местами с соседней.
   * @param from - Текущая позиция.
   * @param to - Позиция соседней кнопки.
   */
  const move = (from: number, to: number) => {
    const actionOrder = [...items];
    [actionOrder[from], actionOrder[to]] = [actionOrder[to], actionOrder[from]];
    onOrderChange(actionOrder);
  };

  return (
    <fieldset className="min-w-0 border-t pt-4">
      <legend className="px-1 text-sm font-medium">{legend}</legend>
      <ul className="divide-y">
        {items.map((id, index) => {
          const title = titles[id];
          return <li key={id} className="flex items-center justify-between gap-2 py-1.5">
            <Label htmlFor={`${idPrefix}-${id}`} className="min-w-0">{title}</Label>
            <div className="flex shrink-0 items-center gap-1">
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8" disabled={index === 0}
                aria-label={`Переместить выше: ${title}`} onClick={() => move(index, index - 1)}><ArrowUp aria-hidden="true" /></Button>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8" disabled={index === items.length - 1}
                aria-label={`Переместить ниже: ${title}`} onClick={() => move(index, index + 1)}><ArrowDown aria-hidden="true" /></Button>
              <Switch id={`${idPrefix}-${id}`} checked={!hidden.includes(id)}
                onCheckedChange={checked => onHiddenChange(checked ? hidden.filter(action => action !== id) : [...hidden, id])} />
            </div>
          </li>;
        })}
      </ul>
    </fieldset>
  );
}
