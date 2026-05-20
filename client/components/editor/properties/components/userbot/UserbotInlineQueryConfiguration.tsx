/**
 * @fileoverview Панель свойств ноды userbot_inline_query
 * @module components/editor/properties/components/userbot/UserbotInlineQueryConfiguration
 */

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SectionHeader } from '../layout/section-header';
import { VariableSelector } from '../variables/variable-selector';
import type { ProjectVariable } from '../../utils/variables-utils';
import type { Variable } from '../../../inline-rich/types';
import type { Node } from '@shared/schema';

/** Пропсы конфигурации userbot_inline_query */
interface UserbotInlineQueryConfigurationProps {
  /** Выбранный узел */
  selectedNode: Node;
  /** Все узлы проекта */
  allNodes: Node[];
  /** Доступные переменные */
  availableVariables: ProjectVariable[];
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
}

/**
 * Панель свойств ноды inline-запроса через юзербот
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function UserbotInlineQueryConfiguration({
  selectedNode,
  allNodes,
  availableVariables,
  onNodeUpdate,
}: UserbotInlineQueryConfigurationProps) {
  const [isOpen, setIsOpen] = useState(true);
  const data = selectedNode.data as any;

  return (
    <div className="space-y-4">
      {/* Секция настроек */}
      <div className="space-y-3 bg-gradient-to-br from-violet-50/40 to-purple-50/20 dark:from-violet-950/30 dark:to-purple-900/20 rounded-xl p-3 sm:p-4 border border-violet-200/40 dark:border-violet-800/40">
        <SectionHeader
          title="Inline-запрос"
          description="Отправить inline-запрос к боту через Telethon"
          isOpen={isOpen}
          onToggle={() => setIsOpen(!isOpen)}
          icon="at"
          iconGradient="from-violet-100 to-purple-100 dark:from-violet-900/50 dark:to-purple-900/50"
          iconColor="text-violet-600 dark:text-violet-400"
          titleGradient="bg-gradient-to-r from-violet-900 to-purple-800 dark:from-violet-100 dark:to-purple-200 bg-clip-text text-transparent"
          descriptionColor="text-violet-700/70 dark:text-violet-300/70"
        />
        {isOpen && (
          <div className="space-y-3">
            {/* Bot username */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Bot username</Label>
              <div className="flex gap-1">
                <Input
                  value={data.botUsername ?? ''}
                  onChange={(e) => onNodeUpdate(selectedNode.id, { botUsername: e.target.value })}
                  placeholder="@bot_username или {переменная}"
                  className="h-8 text-sm font-mono flex-1"
                />
                <VariableSelector
                  availableVariables={availableVariables as Variable[]}
                  onSelect={(v) => onNodeUpdate(selectedNode.id, { botUsername: `{${v}}` })}
                />
              </div>
            </div>

            {/* Query */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Текст запроса (query)</Label>
              <div className="flex gap-1">
                <Input
                  value={data.query ?? ''}
                  onChange={(e) => onNodeUpdate(selectedNode.id, { query: e.target.value })}
                  placeholder="поисковый запрос или {переменная}"
                  className="h-8 text-sm font-mono flex-1"
                />
                <VariableSelector
                  availableVariables={availableVariables as Variable[]}
                  onSelect={(v) => onNodeUpdate(selectedNode.id, { query: `{${v}}` })}
                />
              </div>
            </div>

            {/* Отправить в тот же чат */}
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Отправить в тот же чат</Label>
              <Switch
                checked={data.sendToSameChat ?? true}
                onCheckedChange={(v) => onNodeUpdate(selectedNode.id, { sendToSameChat: v })}
              />
            </div>

            {/* Target chat — показывается только если Switch выключен */}
            {!(data.sendToSameChat ?? true) && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Целевой чат</Label>
                <div className="flex gap-1">
                  <Input
                    value={data.targetChat ?? ''}
                    onChange={(e) => onNodeUpdate(selectedNode.id, { targetChat: e.target.value })}
                    placeholder="@username, chat_id или {переменная}"
                    className="h-8 text-sm font-mono flex-1"
                  />
                  <VariableSelector
                    availableVariables={availableVariables as Variable[]}
                    onSelect={(v) => onNodeUpdate(selectedNode.id, { targetChat: `{${v}}` })}
                  />
                </div>
              </div>
            )}

            {/* Индекс результата */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Индекс результата</Label>
              <div className="flex gap-1">
                <Input
                  value={data.resultIndex ?? '0'}
                  onChange={(e) => onNodeUpdate(selectedNode.id, { resultIndex: e.target.value })}
                  placeholder="0 — первый результат"
                  className="h-8 text-sm font-mono flex-1"
                />
                <VariableSelector
                  availableVariables={availableVariables as Variable[]}
                  onSelect={(v) => onNodeUpdate(selectedNode.id, { resultIndex: `{${v}}` })}
                />
              </div>
            </div>

            {/* Сохранить title */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Сохранить title результата</Label>
              <div className="flex gap-1">
                <Input
                  value={data.saveResultTitleTo ?? ''}
                  onChange={(e) => onNodeUpdate(selectedNode.id, { saveResultTitleTo: e.target.value })}
                  placeholder="result_title (необязательно)"
                  className="h-8 text-sm flex-1"
                />
                <VariableSelector
                  availableVariables={availableVariables as Variable[]}
                  onSelect={(v) => onNodeUpdate(selectedNode.id, { saveResultTitleTo: v })}
                />
              </div>
            </div>

            {/* Сохранить description */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Сохранить description результата</Label>
              <div className="flex gap-1">
                <Input
                  value={data.saveResultDescTo ?? ''}
                  onChange={(e) => onNodeUpdate(selectedNode.id, { saveResultDescTo: e.target.value })}
                  placeholder="result_desc (необязательно)"
                  className="h-8 text-sm flex-1"
                />
                <VariableSelector
                  availableVariables={availableVariables as Variable[]}
                  onSelect={(v) => onNodeUpdate(selectedNode.id, { saveResultDescTo: v })}
                />
              </div>
            </div>

            {/* Сохранить ID отправленного */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Сохранить ID отправленного сообщения</Label>
              <div className="flex gap-1">
                <Input
                  value={data.saveResponseIdTo ?? ''}
                  onChange={(e) => onNodeUpdate(selectedNode.id, { saveResponseIdTo: e.target.value })}
                  placeholder="sent_msg_id (необязательно)"
                  className="h-8 text-sm flex-1"
                />
                <VariableSelector
                  availableVariables={availableVariables as Variable[]}
                  onSelect={(v) => onNodeUpdate(selectedNode.id, { saveResponseIdTo: v })}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Информация */}
      <div className="rounded-lg border border-violet-200/40 dark:border-violet-800/40 bg-violet-50/30 dark:bg-violet-950/20 p-3">
        <div className="flex items-center gap-2 text-xs text-violet-700 dark:text-violet-300">
          <i className="fas fa-info-circle" />
          <span>Выполняет inline-запрос (@bot query) и отправляет выбранный результат в чат.</span>
        </div>
      </div>
    </div>
  );
}
