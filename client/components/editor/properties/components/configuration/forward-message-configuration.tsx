/**
 * @fileoverview Конфигурация пересылки сообщения через Bot API
 */

import { Node } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface ForwardMessageConfigurationProps {
  selectedNode: Node;
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
}

export function ForwardMessageConfiguration({
  selectedNode,
  onNodeUpdate,
}: ForwardMessageConfigurationProps) {
  const data = selectedNode.data as any;
  const sourceMode = data.sourceMessageIdSource || 'current_message';
  const targetMode = data.targetChatIdSource || 'manual';

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10 border border-amber-200/30 dark:border-amber-800/30 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
            <i className="fas fa-share text-amber-600 dark:text-amber-400 text-xs"></i>
          </div>
          <Label className="text-sm font-semibold text-amber-900 dark:text-amber-100">Источник сообщения</Label>
        </div>

        <div className="space-y-3">
          <Select
            value={sourceMode}
            onValueChange={(value) => onNodeUpdate(selectedNode.id, { sourceMessageIdSource: value as any })}
          >
            <SelectTrigger className="bg-card/70 border border-amber-200/50 dark:border-amber-800/50">
              <SelectValue placeholder="Выберите источник сообщения" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current_message">Текущее сообщение</SelectItem>
              <SelectItem value="last_message">Последнее сообщение</SelectItem>
              <SelectItem value="manual">Вручную</SelectItem>
              <SelectItem value="variable">Из переменной</SelectItem>
            </SelectContent>
          </Select>

          {sourceMode === 'manual' && (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-amber-700 dark:text-amber-300">ID сообщения</Label>
              <Input
                value={data.sourceMessageId || ''}
                onChange={(e) => onNodeUpdate(selectedNode.id, { sourceMessageId: e.target.value })}
                placeholder="123456789"
                className="bg-white/60 dark:bg-slate-950/60 border-amber-200/50 dark:border-amber-800/50"
              />
            </div>
          )}

          {sourceMode === 'variable' && (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-amber-700 dark:text-amber-300">Имя переменной</Label>
              <Input
                value={data.sourceMessageVariableName || ''}
                onChange={(e) => onNodeUpdate(selectedNode.id, { sourceMessageVariableName: e.target.value })}
                placeholder="source_message_id"
                className="bg-white/60 dark:bg-slate-950/60 border-amber-200/50 dark:border-amber-800/50"
              />
            </div>
          )}

          <div className="text-xs text-amber-700/80 dark:text-amber-300/80 leading-relaxed">
            Узел пересылает текущее сообщение по умолчанию. Если нужно, можно подставить ID вручную или взять его из переменной.
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-sky-50/50 to-blue-50/30 dark:from-sky-950/20 dark:to-blue-950/10 border border-sky-200/30 dark:border-sky-800/30 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center">
            <i className="fas fa-inbox text-sky-600 dark:text-sky-400 text-xs"></i>
          </div>
          <Label className="text-sm font-semibold text-sky-900 dark:text-sky-100">Чат назначения</Label>
        </div>

        <div className="space-y-3">
          <Select
            value={targetMode}
            onValueChange={(value) => onNodeUpdate(selectedNode.id, { targetChatIdSource: value as any })}
          >
            <SelectTrigger className="bg-card/70 border border-sky-200/50 dark:border-sky-800/50">
              <SelectValue placeholder="Выберите способ указания чата" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Вручную</SelectItem>
              <SelectItem value="variable">Из переменной</SelectItem>
            </SelectContent>
          </Select>

          {targetMode === 'manual' && (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-sky-700 dark:text-sky-300">ID или username чата</Label>
              <Input
                value={data.targetChatId || ''}
                onChange={(e) => onNodeUpdate(selectedNode.id, { targetChatId: e.target.value })}
                placeholder="-1001234567890 или @channel_name"
                className="bg-white/60 dark:bg-slate-950/60 border-sky-200/50 dark:border-sky-800/50"
              />
            </div>
          )}

          {targetMode === 'variable' && (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-sky-700 dark:text-sky-300">Имя переменной</Label>
              <Input
                value={data.targetChatVariableName || ''}
                onChange={(e) => onNodeUpdate(selectedNode.id, { targetChatVariableName: e.target.value })}
                placeholder="target_chat_id"
                className="bg-white/60 dark:bg-slate-950/60 border-sky-200/50 dark:border-sky-800/50"
              />
            </div>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-50/50 to-slate-100/30 dark:from-slate-950/20 dark:to-slate-900/10 border border-slate-200/30 dark:border-slate-800/30 rounded-lg p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Label className="text-sm font-semibold text-slate-900 dark:text-slate-100">Отключить уведомление</Label>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Отправить пересланное сообщение без дополнительного уведомления.
            </div>
          </div>
          <Switch
            checked={data.disableNotification ?? false}
            onCheckedChange={(checked) => onNodeUpdate(selectedNode.id, { disableNotification: checked })}
          />
        </div>
      </div>
    </div>
  );
}
