/**
 * @fileoverview Превью триггера успешной оплаты на холсте
 * @module components/editor/canvas/canvas-node/successful-payment-trigger-preview
 */

import { Node } from '@/types/bot';

/** Пропсы превью */
interface SuccessfulPaymentTriggerPreviewProps {
  /** Узел триггера */
  node: Node;
}

/**
 * Компактное превью: фильтр метки и переменные
 * @param props - Пропсы
 * @returns JSX
 */
export function SuccessfulPaymentTriggerPreview({ node }: SuccessfulPaymentTriggerPreviewProps) {
  const data = node.data as any;
  const filter: string = data.payloadFilter || 'all';
  const value: string = data.payloadValue || '';
  const amountVar: string = data.savePaymentAmountTo || '';
  const chargeVar: string = data.savePaymentChargeIdTo || '';

  const filterLabel =
    filter === 'exact' ? `= ${value || '…'}`
      : filter === 'starts_with' ? `^ ${value || '…'}`
        : 'все оплаты';

  return (
    <div className="flex flex-col gap-2 w-full px-1">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
          <i className="fas fa-check-circle text-yellow-500 text-[10px]" />
        </div>
        <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-300">
          Успешная оплата
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <i className="fas fa-filter text-yellow-600/60 text-[10px]" />
        <span className="font-mono text-[10px] text-yellow-800/80 dark:text-yellow-200/80 bg-yellow-100/50 dark:bg-yellow-900/30 border border-yellow-300/40 dark:border-yellow-700/40 rounded px-1.5 py-0.5">
          {filterLabel}
        </span>
      </div>
      {(amountVar || chargeVar) && (
        <div className="flex flex-col gap-1 border-t border-yellow-800/20 pt-1.5">
          {amountVar && (
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className="text-slate-400">сумма →</span>
              <span className="font-mono text-yellow-700 dark:text-yellow-300">{amountVar}</span>
            </div>
          )}
          {chargeVar && (
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className="text-slate-400">код →</span>
              <span className="font-mono text-yellow-700 dark:text-yellow-300">{chargeVar}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
