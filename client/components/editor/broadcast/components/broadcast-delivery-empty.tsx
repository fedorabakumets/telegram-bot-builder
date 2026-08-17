/**
 * @fileoverview Пустое состояние списка ошибок доставки рассылки
 * @module client/components/editor/broadcast/components/broadcast-delivery-empty
 */

import { CheckCircle2 } from 'lucide-react';
import { DeliveryProblemChips } from './delivery-problem-chips';

/** Пропсы пустого состояния списка ошибок */
interface BroadcastDeliveryEmptyProps {
  /** Сумма проблем по счётчикам рассылки */
  problemCount: number;
  /** Заблокировали бота */
  blocked: number;
  /** Аккаунт удалён */
  deleted: number;
  /** Прочие ошибки */
  failed: number;
}

/**
 * Если счётчики есть, а строк нет — чипы и пояснение, иначе «Ошибок нет»
 * @param props - Счётчики проблем доставки
 * @returns JSX элемент
 */
export function BroadcastDeliveryEmpty({
  problemCount,
  blocked,
  deleted,
  failed,
}: BroadcastDeliveryEmptyProps) {
  if (problemCount > 0) {
    return (
      <div className="space-y-1.5">
        <DeliveryProblemChips
          blocked={blocked}
          deleted={deleted}
          failed={failed}
          showLabels
          size="md"
        />
        <p className="text-xs text-muted-foreground">Нет построчного списка получателей</p>
      </div>
    );
  }

  return (
    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
      Ошибок нет
    </p>
  );
}
