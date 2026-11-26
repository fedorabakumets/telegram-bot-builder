/**
 * @fileoverview Компонент заголовка панели свойств узла
 * 
 * Отображает информацию о выбранном узле, иконку типа,
 * название типа узла и ID для копирования.
 * 
 * @module PropertiesHeader
 */

import { useRef, type SyntheticEvent } from 'react';
import { Node } from '@shared/schema';
import { Button as UIButton } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { copyTextToClipboard } from '@/utils/copy-text';
import { getNodeName, getNodeIcon, getNodeColor } from '../../../shared/node-registry';
import { PropertiesViewToggle, type PropertiesView } from './properties-view-toggle';
import { invoiceCurrencyIconClass } from '../configuration/invoice-currency-utils';

/**
 * Пропсы компонента заголовка панели свойств
 */
interface PropertiesHeaderProps {
  /** Выбранный узел для редактирования */
  selectedNode: Node;
  /** Функция закрытия панели */
  onClose?: (() => void) | undefined;
  /** Отображаемый ID узла */
  displayNodeId: string;
  /** Режим панели: форма или JSON */
  propertiesView?: PropertiesView;
  /** Смена режима панели */
  onPropertiesViewChange?: (view: PropertiesView) => void;
}

/**
 * Компонент заголовка панели свойств узла
 * 
 * @param {PropertiesHeaderProps} props - Пропсы компонента
 * @returns {JSX.Element} Заголовок панели свойств
 */
export function PropertiesHeader({
  selectedNode,
  onClose,
  displayNodeId,
  propertiesView,
  onPropertiesViewChange,
}: PropertiesHeaderProps) {
  const { toast } = useToast();
  /** Защита от двойного копирования: pointerdown + последующий click */
  const copyLockRef = useRef(false);

  /**
   * Копирует ID узла в буфер. Срабатывает и с мыши, и с клавиатуры.
   * @param event - Событие указателя или клика
   */
  const handleCopyNodeId = async (event: SyntheticEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (copyLockRef.current) return;
    copyLockRef.current = true;
    const nodeId = displayNodeId || selectedNode.id;
    const copied = await copyTextToClipboard(nodeId);
    if (copied) {
      toast({
        title: '✅ ID скопирован!',
        description: `"${nodeId}" в буфер обмена`,
      });
    } else {
      toast({
        title: 'Не удалось скопировать ID',
        description: 'Выделите ID и скопируйте вручную',
        variant: 'destructive',
      });
    }
    window.setTimeout(() => {
      copyLockRef.current = false;
    }, 300);
  };

  const getNodeTitle = () => {
    return getNodeName(selectedNode.type as string);
  };

  const nodeTitle = getNodeTitle();
  const nodeType = selectedNode.type as string;
  const nodeIcon =
    nodeType === 'send_invoice'
      ? invoiceCurrencyIconClass((selectedNode.data as any)?.invoiceCurrency)
      : getNodeIcon(nodeType);
  const nodeColor = getNodeColor(selectedNode.type as string);

  return (
    <div className="bg-gradient-to-br from-slate-50/50 to-slate-100/30 dark:from-slate-950/40 dark:to-slate-900/30 border-b border-border/50 backdrop-blur-sm">
      <div className="p-3 sm:p-4 space-y-3">

        {/** Название и копируемый идентификатор образуют единый блок рядом с иконкой узла. */}
        <div className="flex items-center gap-2.5">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${nodeColor}`}>
            <i aria-hidden="true" className={nodeIcon} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="break-words text-sm font-semibold leading-tight text-foreground">{nodeTitle}</h2>
            <button
              type="button"
              onPointerDown={handleCopyNodeId}
              onClick={handleCopyNodeId}
              className="inline-flex max-w-full items-center gap-1.5 rounded py-0.5 text-xs text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              title={`Скопировать ID: ${displayNodeId || selectedNode.id}`}
              data-testid="button-copy-node-id"
            >
              <code className="truncate">{displayNodeId || selectedNode.id}</code>
              <i aria-hidden="true" className="fas fa-copy shrink-0 text-[10px]" />
            </button>
          </div>
            {onClose && (
              <UIButton
                size="icon"
                variant="ghost"
                className="h-8 w-8 flex-shrink-0"
                onClick={onClose}
                title="Закрыть панель свойств"
                data-testid="button-close-properties"
              >
                <X className="w-4 h-4" />
              </UIButton>
            )}
        </div>
        {onPropertiesViewChange && propertiesView && (
          <PropertiesViewToggle value={propertiesView} onChange={onPropertiesViewChange} />
        )}
      </div>
    </div>
  );
}
