/**
 * @fileoverview Конфигурация пересылки сообщения через Bot API
 */

import { Node } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

type TargetChatMode = 'manual' | 'variable' | 'admin_ids';

interface ForwardMessageTargetRecipient {
  id: string;
  targetChatIdSource: TargetChatMode;
  targetChatId?: string;
  targetChatVariableName?: string;
}

interface ForwardMessageConfigurationProps {
  selectedNode: Node;
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
  allNodes?: Node[];
  formatNodeDisplay?: (node: Node) => string;
}

const isTargetChatMode = (value: unknown): value is TargetChatMode =>
  value === 'manual' || value === 'variable' || value === 'admin_ids';

const createTargetRecipient = (mode: TargetChatMode = 'manual'): ForwardMessageTargetRecipient => ({
  id: `target-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
  targetChatIdSource: mode,
  targetChatId: '',
  targetChatVariableName: '',
});

const normalizeTargetRecipient = (
  recipient: Partial<ForwardMessageTargetRecipient>,
  index: number
): ForwardMessageTargetRecipient => ({
  id: typeof recipient.id === 'string' && recipient.id.trim() ? recipient.id.trim() : `target-${index + 1}`,
  targetChatIdSource: isTargetChatMode(recipient.targetChatIdSource) ? recipient.targetChatIdSource : 'manual',
  targetChatId: typeof recipient.targetChatId === 'string' ? recipient.targetChatId : '',
  targetChatVariableName: typeof recipient.targetChatVariableName === 'string' ? recipient.targetChatVariableName : '',
});

const getTargetRecipients = (data: any): ForwardMessageTargetRecipient[] => {
  const rawTargets = Array.isArray(data.targetChatTargets) ? data.targetChatTargets : [];

  if (rawTargets.length > 0) {
    return rawTargets.map((recipient: Partial<ForwardMessageTargetRecipient>, index: number) =>
      normalizeTargetRecipient(recipient, index)
    );
  }

  return [
    normalizeTargetRecipient(
      {
        id: 'legacy-target',
        targetChatIdSource: isTargetChatMode(data.targetChatIdSource) ? data.targetChatIdSource : 'manual',
        targetChatId: data.targetChatId || '',
        targetChatVariableName: data.targetChatVariableName || '',
      },
      0
    ),
  ];
};

export function ForwardMessageConfiguration({
  selectedNode,
  onNodeUpdate,
  allNodes = [],
  formatNodeDisplay,
}: ForwardMessageConfigurationProps) {
  const data = selectedNode.data as any;
  const sourceMode = data.sourceMessageIdSource || 'current_message';
  const linkedSourceNodeId = (data.sourceMessageNodeId || '').trim();
  const linkedSourceNode = linkedSourceNodeId
    ? allNodes.find((node) => node.id === linkedSourceNodeId) ?? null
    : null;
  const linkedSourceLabel = linkedSourceNode
    ? (formatNodeDisplay ? formatNodeDisplay(linkedSourceNode) : linkedSourceNode.type)
    : '';
  const targetRecipients = getTargetRecipients(data);

  const updateTargetRecipients = (nextRecipients: ForwardMessageTargetRecipient[]) => {
    const normalizedRecipients = (nextRecipients.length > 0 ? nextRecipients : [createTargetRecipient()])
      .map((recipient, index) => normalizeTargetRecipient(recipient, index));
    const primaryRecipient = normalizedRecipients[0];

    onNodeUpdate(selectedNode.id, {
      targetChatTargets: normalizedRecipients,
      targetChatIdSource: primaryRecipient.targetChatIdSource,
      targetChatId: primaryRecipient.targetChatIdSource === 'manual' ? (primaryRecipient.targetChatId || '') : '',
      targetChatVariableName: primaryRecipient.targetChatIdSource === 'variable'
        ? (primaryRecipient.targetChatVariableName || '')
        : '',
    });
  };

  const updateRecipient = (index: number, updates: Partial<ForwardMessageTargetRecipient>) => {
    const nextRecipients = targetRecipients.map((recipient, recipientIndex) => (
      recipientIndex === index ? { ...recipient, ...updates } : recipient
    ));
    updateTargetRecipients(nextRecipients);
  };

  const addRecipient = () => {
    updateTargetRecipients([...targetRecipients, createTargetRecipient()]);
  };

  const removeRecipient = (index: number) => {
    updateTargetRecipients(targetRecipients.filter((_, recipientIndex) => recipientIndex !== index));
  };

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
            onValueChange={(value) => onNodeUpdate(selectedNode.id, {
              sourceMessageIdSource: value as any,
              ...((value === 'manual' || value === 'variable') ? {
                sourceMessageId: '',
                sourceMessageVariableName: '',
                sourceMessageNodeId: '',
              } : {}),
            })}
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
              <div className="text-xs text-amber-600/70 dark:text-amber-400/70 leading-relaxed">
                Telegram message_id сообщения в диалоге с ботом. Найти можно в логах бота — строка вида{' '}
                <span className="font-mono bg-amber-100/60 dark:bg-amber-900/30 px-1 rounded">tg_message_id=XXXX</span>
                . Или используй режим «Последнее сообщение» — тогда ID подставится автоматически.
              </div>
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

          {linkedSourceNodeId && (
            <div className="text-xs text-amber-700/80 dark:text-amber-300/80 leading-relaxed">
              Источник привязан к узлу: {linkedSourceLabel || linkedSourceNodeId}
            </div>
          )}

          <div className="text-xs text-amber-700/80 dark:text-amber-300/80 leading-relaxed">
            Связь на холсте с узлом сообщения задаёт источник пересылки и не запускает `forward_message` автоматически. При необходимости можно указать ID вручную или взять его из переменной.
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
          <div className="text-xs text-sky-700/80 dark:text-sky-300/80 leading-relaxed">
            Можно добавить несколько получателей. Первый получатель сохраняется в старые поля для совместимости.
          </div>

          <div className="space-y-3">
            {targetRecipients.map((recipient, index) => (
              <div
                key={recipient.id}
                className="space-y-3 rounded-xl border border-sky-200/40 dark:border-sky-800/40 bg-white/50 dark:bg-slate-950/30 p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <Label className="text-xs font-medium text-sky-700 dark:text-sky-300">
                    Получатель {index + 1}
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                    onClick={() => removeRecipient(index)}
                  >
                    <i className="fas fa-trash text-xs mr-2"></i>
                    Удалить
                  </Button>
                </div>

                <Select
                  value={recipient.targetChatIdSource}
                  onValueChange={(value) => updateRecipient(index, { targetChatIdSource: value as TargetChatMode })}
                >
                  <SelectTrigger className="bg-card/70 border border-sky-200/50 dark:border-sky-800/50">
                    <SelectValue placeholder="Выберите способ указания чата" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Вручную</SelectItem>
                    <SelectItem value="variable">Из переменной</SelectItem>
                    <SelectItem value="admin_ids">Admin IDs проекта</SelectItem>
                  </SelectContent>
                </Select>

                {recipient.targetChatIdSource === 'manual' && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-sky-700 dark:text-sky-300">ID или username чата</Label>
                    <Input
                      value={recipient.targetChatId || ''}
                      onChange={(e) => updateRecipient(index, { targetChatId: e.target.value })}
                      placeholder="-1001234567890 или @channel_name"
                      className="bg-white/60 dark:bg-slate-950/60 border-sky-200/50 dark:border-sky-800/50"
                    />
                  </div>
                )}

                {recipient.targetChatIdSource === 'variable' && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-sky-700 dark:text-sky-300">Имя переменной</Label>
                    <Input
                      value={recipient.targetChatVariableName || ''}
                      onChange={(e) => updateRecipient(index, { targetChatVariableName: e.target.value })}
                      placeholder="target_chat_id"
                      className="bg-white/60 dark:bg-slate-950/60 border-sky-200/50 dark:border-sky-800/50"
                    />
                  </div>
                )}

                {recipient.targetChatIdSource === 'admin_ids' && (
                  <div className="rounded-lg border border-sky-200/40 dark:border-sky-800/30 bg-sky-50/70 dark:bg-sky-950/20 px-3 py-2 text-xs text-sky-700 dark:text-sky-300 leading-relaxed">
                    Будут использованы admin ids проекта. Это удобно для отправки сообщения сразу всем администраторам.
                  </div>
                )}
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full border-dashed border-sky-300 text-sky-700 hover:bg-sky-50 dark:border-sky-700 dark:text-sky-300 dark:hover:bg-sky-950/20"
            onClick={addRecipient}
          >
            <i className="fas fa-plus mr-2"></i>
            Добавить получателя
          </Button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-50/50 to-slate-100/30 dark:from-slate-950/20 dark:to-slate-900/10 border border-slate-200/30 dark:border-slate-800/30 rounded-lg p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Label className="text-sm font-semibold text-slate-900 dark:text-slate-100">Отправлять без уведомления</Label>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Пересылать сообщение тихо, без звука и push-уведомления у получателя.
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
