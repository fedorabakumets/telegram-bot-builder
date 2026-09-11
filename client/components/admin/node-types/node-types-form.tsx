/**
 * @fileoverview Форма выключения типов блоков в панели управления
 * @module components/admin/node-types/node-types-form
 */

import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { buildNodeTypeCatalog } from './node-types-catalog';
import { NodeTypeGroup } from './node-type-group';
import { NodeTypesSaveFab } from './node-types-save-fab';
import {
  useAdminDisabledNodeTypes,
  useSaveAdminDisabledNodeTypes,
} from './use-disabled-node-types';

/**
 * Сравнивает два списка типов без учёта порядка
 * @param a - Первый список
 * @param b - Второй список
 * @returns true, если наборы совпадают
 */
function sameTypeSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((item) => setB.has(item));
}

/**
 * Список групп с переключателями и плавающей кнопкой сохранения
 * @returns JSX элемент формы
 */
export function NodeTypesForm() {
  const { toast } = useToast();
  const { data, isLoading } = useAdminDisabledNodeTypes();
  const saveMutation = useSaveAdminDisabledNodeTypes();
  const catalog = useMemo(() => buildNodeTypeCatalog(), []);
  const [disabled, setDisabled] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);

  useEffect(() => {
    if (!data?.disabled) return;
    setDisabled(data.disabled);
    setSaved(data.disabled);
  }, [data]);

  const disabledSet = useMemo(() => new Set(disabled), [disabled]);
  const dirty = !sameTypeSet(disabled, saved);

  const onToggle = (type: string, nextDisabled: boolean) => {
    setDisabled((prev) => {
      if (nextDisabled) {
        return prev.includes(type) ? prev : [...prev, type];
      }
      return prev.filter((item) => item !== type);
    });
  };

  const onSave = () => {
    saveMutation.mutate(disabled, {
      onSuccess: (result: { disabled?: string[] }) => {
        const next = Array.isArray(result?.disabled) ? result.disabled : disabled;
        setDisabled(next);
        setSaved(next);
        toast({ title: 'Список типов сохранён' });
      },
      onError: (error: Error) => {
        toast({
          title: 'Не удалось сохранить',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      <p className="text-sm text-muted-foreground max-w-2xl">
        Выключенный тип скрывается из набора слева и нельзя создать через помощника.
        Уже стоящие блоки на холсте остаются. Запуск бота с такими блоками будет отказан.
        Ядро конструктора выключить нельзя.
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        {catalog.map((group) => (
          <NodeTypeGroup
            key={group.title}
            group={group}
            disabledSet={disabledSet}
            onToggle={onToggle}
          />
        ))}
      </div>
      <NodeTypesSaveFab
        dirty={dirty}
        pending={saveMutation.isPending}
        onSave={onSave}
      />
    </div>
  );
}
