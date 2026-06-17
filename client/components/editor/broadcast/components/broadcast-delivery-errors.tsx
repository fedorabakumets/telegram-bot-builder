/**
 * @fileoverview Список ошибок доставки рассылки с ленивой загрузкой
 * @module client/components/editor/broadcast/components/broadcast-delivery-errors
 */

import { CheckCircle2, XCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useBroadcastDetail } from '../hooks/use-broadcast-detail';

/**
 * Пропсы компонента BroadcastDeliveryErrors
 */
interface BroadcastDeliveryErrorsProps {
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор рассылки */
  broadcastId: number;
  /** Выполнять запрос только при true (ленивая загрузка) */
  enabled?: boolean;
  /** Компактный режим для пузыря в чате */
  compact?: boolean;
}

/**
 * Отображает ошибки доставки рассылки: скелетон, пустое состояние или таблицу в аккордеоне.
 * @param props - Свойства компонента
 * @returns JSX элемент списка ошибок
 */
export function BroadcastDeliveryErrors({
  projectId,
  broadcastId,
  enabled = true,
  compact = false,
}: BroadcastDeliveryErrorsProps) {
  const { results, isLoading } = useBroadcastDetail(
    projectId,
    enabled ? broadcastId : null,
  );

  if (isLoading) {
    return <Skeleton className={compact ? 'h-10 w-full' : 'h-16 w-full'} />;
  }

  if (results.length === 0) {
    return (
      <p className={`text-muted-foreground flex items-center gap-1.5 ${compact ? 'text-[10px]' : 'text-xs'}`}>
        <CheckCircle2 className={`text-green-500 ${compact ? 'h-3 w-3' : 'h-3.5 w-3.5'}`} />
        Ошибок нет
      </p>
    );
  }

  return (
    <Collapsible defaultOpen={compact}>
      <CollapsibleTrigger
        className={`flex items-center gap-2 font-medium text-red-600 hover:text-red-700 w-full text-left ${
          compact ? 'text-[10px]' : 'text-sm'
        }`}
      >
        <XCircle className={compact ? 'h-3 w-3' : 'h-4 w-4'} />
        Ошибки доставки ({results.length})
      </CollapsibleTrigger>
      <CollapsibleContent className={`mt-2 border rounded-lg overflow-hidden ${compact ? 'max-h-40 overflow-y-auto' : ''}`}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">User ID</TableHead>
              <TableHead className="text-xs">Причина</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs">{r.userId}</TableCell>
                <TableCell className="text-xs text-red-500">{r.errorMessage ?? r.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CollapsibleContent>
    </Collapsible>
  );
}
