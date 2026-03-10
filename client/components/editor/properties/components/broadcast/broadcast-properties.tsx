/**
 * @fileoverview Панель свойств для узла рассылки
 * Позволяет настраивать параметры рассылки сообщений пользователям
 */

import { Node } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { IdSourceSelector } from '../navigation/id-source-selector';
import { ApiTypeSelector } from '../common/api-type-selector';
import { ComingSoonBadge } from '../conditional-message-card/coming-soon-badge';

/**
 * Свойства компонента панели настроек рассылки
 */
interface BroadcastNodePropertiesProps {
  /** Данные узла для редактирования */
  node: Node;
  /** Колбэк для обновления данных узла */
  onUpdate: (nodeId: string, data: Partial<Node['data']>) => void;
}

/**
 * Компонент панели свойств для узла рассылки
 * @param props - Свойства компонента
 * @returns JSX элемент панели свойств
 */
export function BroadcastNodeProperties({ node, onUpdate }: BroadcastNodePropertiesProps) {
  const data = node.data;

  return (
    <div className="w-full bg-gradient-to-br from-orange-50/40 to-amber-50/20 dark:from-orange-950/30 dark:to-amber-900/20 rounded-xl p-3 sm:p-4 md:p-5 border border-orange-200/40 dark:border-orange-800/40 backdrop-blur-sm space-y-3">
      {/* Выбор типа API */}
      <ApiTypeSelector node={node} onUpdate={onUpdate} />

      {/* Выбор источника ID */}
      <IdSourceSelector node={node} onUpdate={onUpdate} />

      {/* Подтверждение рассылки */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label htmlFor="enableConfirmation">Подтверждение отправки</Label>
          <ComingSoonBadge />
        </div>
        <Switch
          id="enableConfirmation"
          checked={data.enableConfirmation}
          onCheckedChange={(checked) =>
            onUpdate(node.id, { enableConfirmation: checked })
          }
        />
      </div>

      {/* Текст подтверждения */}
      {data.enableConfirmation && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="confirmationText">Текст подтверждения</Label>
            <ComingSoonBadge />
          </div>
          <Input
            id="confirmationText"
            value={data.confirmationText || ''}
            onChange={(e) =>
              onUpdate(node.id, { confirmationText: e.target.value })
            }
            placeholder="Отправить рассылку всем пользователям?"
          />
        </div>
      )}
    </div>
  );
}
