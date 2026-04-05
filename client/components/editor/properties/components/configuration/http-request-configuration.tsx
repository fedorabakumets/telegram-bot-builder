/**
 * @fileoverview Панель свойств узла HTTP запроса
 * @module components/editor/properties/components/configuration/http-request-configuration
 */
import { Node } from '@shared/schema';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

/** Доступные HTTP методы */
const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

/** Пропсы компонента настройки HTTP запроса */
interface HttpRequestConfigurationProps {
  /** Выбранный узел */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
}

/**
 * Компонент настройки узла HTTP запроса
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function HttpRequestConfiguration({ selectedNode, onNodeUpdate }: HttpRequestConfigurationProps) {
  const data = selectedNode.data;
  const method = data.httpRequestMethod || 'GET';
  const showBody = method === 'POST' || method === 'PUT' || method === 'PATCH';

  return (
    <div className="space-y-4 p-4">
      {/* Метод и URL */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Метод и URL</Label>
        <div className="flex gap-2">
          <Select
            value={method}
            onValueChange={(v) => onNodeUpdate(selectedNode.id, { httpRequestMethod: v as typeof HTTP_METHODS[number] })}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HTTP_METHODS.map(m => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="https://api.example.com/endpoint"
            value={data.httpRequestUrl || ''}
            onChange={(e) => onNodeUpdate(selectedNode.id, { httpRequestUrl: e.target.value })}
            className="flex-1 font-mono text-sm"
          />
        </div>
      </div>

      {/* Заголовки */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Заголовки (JSON)</Label>
        <Textarea
          placeholder={'{"Authorization": "Bearer {api_key}"}'}
          value={data.httpRequestHeaders || ''}
          onChange={(e) => onNodeUpdate(selectedNode.id, { httpRequestHeaders: e.target.value })}
          className="font-mono text-xs h-20 resize-none"
        />
      </div>

      {/* Тело запроса — только для POST/PUT/PATCH */}
      {showBody && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Тело запроса (JSON)</Label>
          <Textarea
            placeholder={'{"key": "{variable}"}'}
            value={data.httpRequestBody || ''}
            onChange={(e) => onNodeUpdate(selectedNode.id, { httpRequestBody: e.target.value })}
            className="font-mono text-xs h-24 resize-none"
          />
        </div>
      )}

      {/* Переменная для ответа */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Сохранить ответ в переменную</Label>
        <Input
          placeholder="response"
          value={data.httpRequestResponseVariable || ''}
          onChange={(e) => onNodeUpdate(selectedNode.id, { httpRequestResponseVariable: e.target.value })}
          className="font-mono text-sm"
        />
      </div>

      {/* Переменная для статус кода */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Сохранить статус код в переменную (опционально)</Label>
        <Input
          placeholder="status_code"
          value={data.httpRequestStatusVariable || ''}
          onChange={(e) => onNodeUpdate(selectedNode.id, { httpRequestStatusVariable: e.target.value })}
          className="font-mono text-sm"
        />
      </div>

      {/* Таймаут */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Таймаут (секунды)</Label>
        <Input
          type="number"
          min={1}
          max={300}
          value={data.httpRequestTimeout ?? 30}
          onChange={(e) => onNodeUpdate(selectedNode.id, { httpRequestTimeout: parseInt(e.target.value) || 30 })}
          className="w-24"
        />
      </div>
    </div>
  );
}
