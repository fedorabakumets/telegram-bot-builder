/**
 * @fileoverview Поля текстов ошибок узла refund_stars
 * @module components/editor/properties/components/configuration/refund-error-messages-fields
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/** Дефолт: пустой код покупки */
export const DEFAULT_REFUND_MSG_EMPTY =
  'Пожалуйста, укажите код покупки: /back КОД';

/** Дефолт: код не найден */
export const DEFAULT_REFUND_MSG_NOT_FOUND =
  'Такой код покупки не найден. Проверьте данные и попробуйте снова.';

/** Дефолт: уже возвращено */
export const DEFAULT_REFUND_MSG_ALREADY =
  'За эту покупку уже ранее был произведён возврат.';

/**
 * Пропсы блока сообщений об ошибках возврата
 */
interface RefundErrorMessagesFieldsProps {
  /** Данные узла */
  data: any;
  /** ID узла */
  nodeId: string;
  /** Обновление полей data */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
}

/**
 * Три текста ошибок возврата звёзд (пусто / не найден / уже возвращён)
 *
 * @param props - Свойства компонента
 * @returns JSX блок полей
 */
export function RefundErrorMessagesFields({
  data,
  nodeId,
  onNodeUpdate,
}: RefundErrorMessagesFieldsProps) {
  return (
    <div className="space-y-3 rounded-lg border border-yellow-200/50 dark:border-yellow-800/40 p-3">
      <Label className="text-xs font-semibold text-yellow-700 dark:text-yellow-300">
        Сообщения об ошибках
      </Label>
      <div className="space-y-1.5">
        <Label className="text-[10px] text-muted-foreground">Пустой код</Label>
        <Input
          value={data?.refundMsgEmpty ?? DEFAULT_REFUND_MSG_EMPTY}
          onChange={(e) => onNodeUpdate(nodeId, { refundMsgEmpty: e.target.value })}
          placeholder={DEFAULT_REFUND_MSG_EMPTY}
          className="h-8 text-xs"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-[10px] text-muted-foreground">Код не найден</Label>
        <Input
          value={data?.refundMsgNotFound ?? DEFAULT_REFUND_MSG_NOT_FOUND}
          onChange={(e) => onNodeUpdate(nodeId, { refundMsgNotFound: e.target.value })}
          placeholder={DEFAULT_REFUND_MSG_NOT_FOUND}
          className="h-8 text-xs"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-[10px] text-muted-foreground">Уже возвращено</Label>
        <Input
          value={data?.refundMsgAlreadyRefunded ?? DEFAULT_REFUND_MSG_ALREADY}
          onChange={(e) => onNodeUpdate(nodeId, { refundMsgAlreadyRefunded: e.target.value })}
          placeholder={DEFAULT_REFUND_MSG_ALREADY}
          className="h-8 text-xs"
        />
      </div>
    </div>
  );
}
