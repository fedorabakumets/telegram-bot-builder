/**
 * @fileoverview Панель свойств для узла рассылки
 * Позволяет настраивать параметры рассылки сообщений пользователям
 */

import { Node } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { IdSourceSelector } from './id-source-selector';
import { ApiTypeSelector } from './api-type-selector';

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
    <div className="space-y-4 p-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">📢 Рассылка</h3>
        <p className="text-sm text-muted-foreground">
          Настройка отправки сообщений всем пользователям
        </p>
      </div>

      {/* Выбор типа API */}
      <ApiTypeSelector node={node} onUpdate={onUpdate} />

      {/* Выбор источника ID */}
      <IdSourceSelector node={node} onUpdate={onUpdate} />

      {/* Подтверждение рассылки */}
      <div className="flex items-center justify-between">
        <Label htmlFor="enableConfirmation">Подтверждение отправки</Label>
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
          <Label htmlFor="confirmationText">Текст подтверждения</Label>
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

      {/* Сообщение об успехе */}
      <div className="space-y-2">
        <Label htmlFor="successMessage">Сообщение об успехе</Label>
        <Input
          id="successMessage"
          value={data.successMessage || ''}
          onChange={(e) => onUpdate(node.id, { successMessage: e.target.value })}
          placeholder="✅ Рассылка отправлена!"
        />
      </div>

      {/* Сообщение об ошибке */}
      <div className="space-y-2">
        <Label htmlFor="errorMessage">Сообщение об ошибке</Label>
        <Input
          id="errorMessage"
          value={data.errorMessage || ''}
          onChange={(e) => onUpdate(node.id, { errorMessage: e.target.value })}
          placeholder="❌ Ошибка рассылки"
        />
      </div>
    </div>
  );
}
