/**
 * @fileoverview Форма выключения типов блоков в панели управления
 * @module components/admin/node-types/node-types-form
 */

import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { buildNodeTypeCatalog } from './node-types-catalog';
import { NodeTypeGroup } from './node-type-group';
import {
  useAdminDisabledNodeTypes,
  useSaveAdminDisabledNodeTypes,
} from './use-disabled-node-types';

/**
 * Список групп с переключателями и кнопкой сохранения
 * @returns JSX элемент формы
 */
export function NodeTypesForm() {
  const { toast } = useToast();
  const { data, isLoading } = useAdminDisabledNodeTypes();
  const saveMutation = useSaveAdminDisabledNodeTypes();
  const catalog = useMemo(() => buildNodeTypeCatalog(), []);
  const [disabled, setDisabled] = useState<string[]>([]);

  useEffect(() => {
    if (data?.disabled) setDisabled(data.disabled);
  }, [data]);

  const disabledSet = useMemo(() => new Set(disabled), [disabled]);

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
        if (Array.isArray(result?.disabled)) setDisabled(result.disabled);
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground max-w-2xl">
          Выключенный тип скрывается из набора слева и нельзя создать через помощника.
          Уже стоящие блоки на холсте остаются. Запуск бота с такими блоками будет отказан.
          Ядро конструктора выключить нельзя.
        </p>
        <Button onClick={onSave} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? 'Сохранение…' : 'Сохранить'}
        </Button>
      </div>
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
    </div>
  );
}
