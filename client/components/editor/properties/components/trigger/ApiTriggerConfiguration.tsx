/**
 * @fileoverview Панель свойств API-триггера
 * @module properties/components/trigger/ApiTriggerConfiguration
 */

import type { Node } from '@shared/schema';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TriggerTargetSelector } from './TriggerTargetSelector';
import { formatNodeDisplay as defaultFormatNodeDisplay } from '../../utils/node-formatters';
import { useAppConfig } from '@/hooks/use-app-config';
import {
  buildApiHookPublicUrl,
  getApiHookUrlHint,
  resolveApiHooksBaseUrl,
} from '../../utils/api-hooks-url';

/** HTTP-методы API-триггера */
const API_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

/** Пропсы ApiTriggerConfiguration */
interface ApiTriggerConfigurationProps {
  /** Выбранный узел */
  selectedNode: Node;
  /** ID проекта */
  projectId: number;
  /** Обновление данных узла */
  onUpdateNode: (nodeId: string, updates: Partial<Node['data']>) => void;
  /** Все узлы из всех листов */
  getAllNodesFromAllSheets?: Array<{ node: Node; sheetId?: string; sheetName?: string }>;
  /** Форматирование названия узла */
  formatNodeDisplay?: (node: Node, sheetName?: string) => string;
}

/**
 * Генерирует случайный secret-токен
 * @returns Строка токена
 */
function generateSecret(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Панель свойств API-триггера
 * @param props - Пропсы компонента
 * @returns JSX элемент
 */
export function ApiTriggerConfiguration({
  selectedNode,
  projectId,
  onUpdateNode,
  getAllNodesFromAllSheets = [],
  formatNodeDisplay = defaultFormatNodeDisplay,
}: ApiTriggerConfigurationProps) {
  const { data: appConfig } = useAppConfig();
  const data = selectedNode.data as Record<string, unknown>;
  const method = String(data.apiMethod ?? 'POST');
  const path = String(data.apiPath ?? '');
  const secret = String(data.apiSecretToken ?? '');
  const baseUrl = resolveApiHooksBaseUrl(appConfig?.apiBaseUrl);
  const fromServerEnv = Boolean(appConfig?.apiBaseUrl?.trim());
  const publicUrl = buildApiHookPublicUrl(baseUrl, projectId, path);
  const urlHint = getApiHookUrlHint(baseUrl, fromServerEnv);

  /**
   * Обновляет поле data узла
   * @param field - Имя поля
   * @param value - Значение
   */
  const update = (field: string, value: unknown) =>
    onUpdateNode(selectedNode.id, { [field]: value });

  return (
    <div className="space-y-4 p-4">
      <div className="rounded-xl bg-violet-50/60 dark:bg-violet-900/20 border border-violet-200/50 dark:border-violet-700/40 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <i className="fas fa-plug text-violet-600 dark:text-violet-400 text-sm" />
          <span className="text-sm font-medium text-violet-700 dark:text-violet-300">API триггер</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Принимает HTTP-запрос от внешней системы и запускает цепочку. Secret передавайте в заголовке X-Api-Secret.
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Публичный URL</Label>
        <Input readOnly value={publicUrl} className="font-mono text-xs" />
        {urlHint && (
          <p className="text-[10px] text-muted-foreground">{urlHint}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs">Метод</Label>
          <Select value={method} onValueChange={(v) => update('apiMethod', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {API_METHODS.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Путь</Label>
          <Input value={path} onChange={(e) => update('apiPath', e.target.value)} placeholder="/payment" />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Secret (X-Api-Secret)</Label>
        <div className="flex gap-2">
          <Input value={secret} onChange={(e) => update('apiSecretToken', e.target.value)} className="font-mono text-xs" />
          <Button type="button" variant="outline" size="sm" onClick={() => update('apiSecretToken', generateSecret())}>
            Сгенерировать
          </Button>
        </div>
        <p className="text-[10px] text-amber-600 dark:text-amber-400">Не вставляйте secret во frontend-код сайта.</p>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Сохранить body в</Label>
        <Input value={String(data.apiSaveBodyTo ?? '')} onChange={(e) => update('apiSaveBodyTo', e.target.value)} placeholder="body" />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Сохранить query в (опц.)</Label>
        <Input value={String(data.apiSaveQueryTo ?? '')} onChange={(e) => update('apiSaveQueryTo', e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Сохранить headers в (опц.)</Label>
        <Input value={String(data.apiSaveHeadersTo ?? '')} onChange={(e) => update('apiSaveHeadersTo', e.target.value)} />
      </div>

      <TriggerTargetSelector
        selectedNode={selectedNode}
        getAllNodesFromAllSheets={getAllNodesFromAllSheets}
        formatNodeDisplay={formatNodeDisplay}
        autoTransitionTo={selectedNode.data.autoTransitionTo}
        onNodeUpdate={onUpdateNode}
      />
    </div>
  );
}
