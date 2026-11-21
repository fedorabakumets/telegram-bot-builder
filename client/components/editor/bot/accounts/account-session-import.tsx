/**
 * @fileoverview Выбор демонстрационного способа подключения Telegram.
 */

import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { MockSessionKind } from './mock-account-types';

/** Способы подключения, которые можно просмотреть в прототипе. */
const mockSessionMethods = [
  { id: 'phone', label: 'Вход по номеру', sample: 'Демоаккаунт · номер и код подтверждения' },
  { id: 'tdata', label: 'Telegram Desktop (tdata)', sample: 'Папка tdata' },
  { id: 'session', label: 'Сессия (.session)', sample: 'demo.session' },
  { id: 'session-json', label: 'Сессия и настройки (.session + .json)', sample: 'demo.session и demo.json' },
  { id: 'string-session', label: 'Строка сессии', sample: 'Демонстрационная StringSession' },
] as const satisfies readonly {
  /** Способ подключения. */
  id: MockSessionKind;
  /** Подпись элемента списка. */
  label: string;
  /** Название образца для проверки сценария. */
  sample: string;
}[];

/** Свойства выбора способа подключения. */
interface AccountSessionImportProps {
  /** Способ, сохранённый в демонстрационной карточке аккаунта. */
  currentMethod?: MockSessionKind | null;
  /** Применяет выбранный способ к карточке аккаунта. */
  onImport: (method: MockSessionKind) => void;
}

/**
 * Показывает способы подключения с образцами данных.
 * @param props - Текущий способ и обработчик подключения.
 * @returns Поля и действие демонстрационного подключения.
 */
export function AccountSessionImport({ currentMethod, onImport }: AccountSessionImportProps) {
  const id = useId();
  const [draft, setDraft] = useState<MockSessionKind>();
  const selected = mockSessionMethods.find((method) => method.id === (draft ?? currentMethod));
  const current = mockSessionMethods.find((method) => method.id === currentMethod);

  return (
    <section aria-labelledby={`${id}-heading`} className="space-y-3">
      <div className="space-y-1">
        <h3 id={`${id}-heading`} className="text-sm font-semibold">Сессия Telegram</h3>
        <p className="text-xs text-muted-foreground">Для проверки интерфейса используются примеры сессий.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${id}-method`} className="text-xs">Способ подключения</Label>
        <Select value={selected?.id ?? ''} onValueChange={(value) => {
          const method = mockSessionMethods.find((option) => option.id === value);
          if (method) setDraft(method.id);
        }}>
          <SelectTrigger id={`${id}-method`} className="h-9">
            <SelectValue placeholder="Выберите способ" />
          </SelectTrigger>
          <SelectContent>
            {mockSessionMethods.map((method) => (
              <SelectItem key={method.id} value={method.id}>{method.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {selected && (
        <p className="break-words rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          {selected.sample}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" disabled={!selected}
          onClick={() => selected && onImport(selected.id)}>
          {selected?.id === 'phone' ? 'Смоделировать вход' : 'Импортировать пример'}
        </Button>
        <span role="status" className="text-xs text-muted-foreground">
          {current && `Подключено через «${current.label}»`}
        </span>
      </div>
    </section>
  );
}
