/**
 * @fileoverview Панель свойств ноды userbot_click_button
 * @module components/editor/properties/components/userbot/UserbotClickButtonConfiguration
 */

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SectionHeader } from '../layout/section-header';
import { VariableSelector } from '../variables/variable-selector';
import type { ProjectVariable } from '../../utils/variables-utils';
import type { Variable } from '../../../inline-rich/types';
import type { Node } from '@shared/schema';

/** Пропсы конфигурации userbot_click_button */
interface UserbotClickButtonConfigurationProps {
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
 * Панель свойств ноды нажатия кнопки через юзербот
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function UserbotClickButtonConfiguration({
  selectedNode,
  allNodes,
  availableVariables,
  onNodeUpdate,
}: UserbotClickButtonConfigurationProps) {
  const [isOpen, setIsOpen] = useState(true);
  const data = selectedNode.data as any;

  return (
    <div className="space-y-4">
      {/* Секция настроек */}
      <div className="space-y-3 bg-gradient-to-br from-violet-50/40 to-purple-50/20 dark:from-violet-950/30 dark:to-purple-900/20 rounded-xl p-3 sm:p-4 border border-violet-200/40 dark:border-violet-800/40">
        <SectionHeader
          title="Нажатие кнопки"
          description="Нажать inline-кнопку в сообщении"
          isOpen={isOpen}
          onToggle={() => setIsOpen(!isOpen)}
          icon="hand-pointer"
          iconGradient="from-violet-100 to-purple-100 dark:from-violet-900/50 dark:to-purple-900/50"
          iconColor="text-violet-600 dark:text-violet-400"
          titleGradient="bg-gradient-to-r from-violet-900 to-purple-800 dark:from-violet-100 dark:to-purple-200 bg-clip-text text-transparent"
          descriptionColor="text-violet-700/70 dark:text-violet-300/70"
        />
        {isOpen && (
          <div className="space-y-3">
            {/* Entity */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Чат (entity)</Label>
              <div className="flex gap-1">
                <Input
                  value={data.userbotEntity ?? ''}
                  onChange={(e) => onNodeUpdate(selectedNode.id, { userbotEntity: e.target.value })}
                  placeholder="@bot_username или {переменная}"
                  className="h-8 text-sm font-mono flex-1"
                />
                <VariableSelector
                  availableVariables={availableVariables as Variable[]}
                  onSelect={(v) => onNodeUpdate(selectedNode.id, { userbotEntity: `{${v}}` })}
                />
              </div>
            </div>

            {/* Message ID */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">ID сообщения с кнопками</Label>
              <div className="flex gap-1">
                <Input
                  value={data.messageId ?? ''}
                  onChange={(e) => onNodeUpdate(selectedNode.id, { messageId: e.target.value })}
                  placeholder="{response_message_id} или число"
                  className="h-8 text-sm font-mono flex-1"
                />
                <VariableSelector
                  availableVariables={availableVariables as Variable[]}
                  onSelect={(v) => onNodeUpdate(selectedNode.id, { messageId: `{${v}}` })}
                />
              </div>
            </div>

            {/* Способ поиска */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Способ поиска кнопки</Label>
              <Select
                value={data.clickMode ?? 'text'}
                onValueChange={(v) => onNodeUpdate(selectedNode.id, { clickMode: v })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">По тексту кнопки</SelectItem>
                  <SelectItem value="data">По callback_data</SelectItem>
                  <SelectItem value="index">По индексу (row, col)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Значение поиска */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                {data.clickMode === 'text' ? 'Текст кнопки' : data.clickMode === 'data' ? 'callback_data' : 'Индекс (row, col)'}
              </Label>
              <div className="flex gap-1">
                <Input
                  value={data.clickValue ?? ''}
                  onChange={(e) => onNodeUpdate(selectedNode.id, { clickValue: e.target.value })}
                  placeholder={data.clickMode === 'index' ? '0, 1' : data.clickMode === 'data' ? 'menu_games' : 'Играть'}
                  className="h-8 text-sm font-mono flex-1"
                />
                <VariableSelector
                  availableVariables={availableVariables as Variable[]}
                  onSelect={(v) => onNodeUpdate(selectedNode.id, { clickValue: `{${v}}` })}
                />
              </div>
            </div>

            {/* Сохранить alert */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Сохранить alert в переменную</Label>
              <div className="flex gap-1">
                <Input
                  value={data.saveAlertTo ?? ''}
                  onChange={(e) => onNodeUpdate(selectedNode.id, { saveAlertTo: e.target.value })}
                  placeholder="alert_text (необязательно)"
                  className="h-8 text-sm flex-1"
                />
                <VariableSelector
                  availableVariables={availableVariables as Variable[]}
                  onSelect={(v) => onNodeUpdate(selectedNode.id, { saveAlertTo: v })}
                />
              </div>
            </div>

            {/* Сохранить текст сообщения */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Сохранить текст сообщения</Label>
              <div className="flex gap-1">
                <Input
                  value={data.saveResultTo ?? ''}
                  onChange={(e) => onNodeUpdate(selectedNode.id, { saveResultTo: e.target.value })}
                  placeholder="new_message_text (необязательно)"
                  className="h-8 text-sm flex-1"
                />
                <VariableSelector
                  availableVariables={availableVariables as Variable[]}
                  onSelect={(v) => onNodeUpdate(selectedNode.id, { saveResultTo: v })}
                />
              </div>
            </div>

            {/* Сохранить кнопки (JSON) */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Сохранить кнопки (JSON)</Label>
              <div className="flex gap-1">
                <Input
                  value={data.saveButtonsTo ?? ''}
                  onChange={(e) => onNodeUpdate(selectedNode.id, { saveButtonsTo: e.target.value })}
                  placeholder="buttons_json (необязательно)"
                  className="h-8 text-sm flex-1"
                />
                <VariableSelector
                  availableVariables={availableVariables as Variable[]}
                  onSelect={(v) => onNodeUpdate(selectedNode.id, { saveButtonsTo: v })}
                />
              </div>
            </div>

            {/* Сохранить флаг медиа */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Сохранить наличие медиа</Label>
              <div className="flex gap-1">
                <Input
                  value={data.saveHasMediaTo ?? ''}
                  onChange={(e) => onNodeUpdate(selectedNode.id, { saveHasMediaTo: e.target.value })}
                  placeholder="has_media (необязательно)"
                  className="h-8 text-sm flex-1"
                />
                <VariableSelector
                  availableVariables={availableVariables as Variable[]}
                  onSelect={(v) => onNodeUpdate(selectedNode.id, { saveHasMediaTo: v })}
                />
              </div>
            </div>

            {/* Сохранить медиа (для пересылки) */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Сохранить медиа (для пересылки)</Label>
              <div className="flex gap-1">
                <Input
                  value={data.saveMediaTo ?? ''}
                  onChange={(e) => onNodeUpdate(selectedNode.id, { saveMediaTo: e.target.value })}
                  placeholder="media_object (необязательно)"
                  className="h-8 text-sm flex-1"
                />
                <VariableSelector
                  availableVariables={availableVariables as Variable[]}
                  onSelect={(v) => onNodeUpdate(selectedNode.id, { saveMediaTo: v })}
                />
              </div>
              <p className="text-[10px] text-muted-foreground/60">
                Медиа-объект можно переслать через userbot_message в поле attachedMedia как {'{переменная}'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Информация */}
      <div className="rounded-lg border border-violet-200/40 dark:border-violet-800/40 bg-violet-50/30 dark:bg-violet-950/20 p-3">
        <div className="flex items-center gap-2 text-xs text-violet-700 dark:text-violet-300">
          <i className="fas fa-info-circle" />
          <span>Нажимает inline-кнопку от имени аккаунта. Работает только с inline-клавиатурами.</span>
        </div>
      </div>
    </div>
  );
}
