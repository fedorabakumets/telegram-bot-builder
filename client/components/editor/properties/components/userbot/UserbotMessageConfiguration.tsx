/**
 * @fileoverview Панель свойств ноды userbot_message
 * Переиспользует компоненты секции текста и медиа из message
 * @module components/editor/properties/components/userbot/UserbotMessageConfiguration
 */

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MessageTextSectionContent } from '../message/message-text-section-content';
import { SaveMessageIdSection } from '../message/save-message-id-section';
import { MediaFileSection } from '../media-file/media-file-section';
import { SectionHeader } from '../layout/section-header';
import { VariableSelector } from '../variables/variable-selector';
import type { ProjectVariable } from '../../utils/variables-utils';
import type { Variable } from '../../../inline-rich/types';
import type { Node } from '@shared/schema';

/** Пропсы конфигурации userbot_message */
interface UserbotMessageConfigurationProps {
  /** Выбранный узел */
  selectedNode: Node;
  /** Все узлы проекта */
  allNodes: Node[];
  /** Доступные переменные */
  availableVariables: ProjectVariable[];
  /** ID проекта */
  projectId: number;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
}

/**
 * Панель свойств ноды отправки сообщения через юзербот
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function UserbotMessageConfiguration({
  selectedNode,
  allNodes,
  availableVariables,
  projectId,
  onNodeUpdate,
}: UserbotMessageConfigurationProps) {
  const [isTextOpen, setIsTextOpen] = useState(true);
  const [isRecipientOpen, setIsRecipientOpen] = useState(true);
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const data = selectedNode.data as any;

  return (
    <div className="space-y-4">
      {/* Секция получателя */}
      <div className="space-y-3 bg-gradient-to-br from-violet-50/40 to-purple-50/20 dark:from-violet-950/30 dark:to-purple-900/20 rounded-xl p-3 sm:p-4 border border-violet-200/40 dark:border-violet-800/40">
        <SectionHeader
          title="Получатель"
          description="Кому отправить сообщение от аккаунта"
          isOpen={isRecipientOpen}
          onToggle={() => setIsRecipientOpen(!isRecipientOpen)}
          icon="user"
          iconGradient="from-violet-100 to-purple-100 dark:from-violet-900/50 dark:to-purple-900/50"
          iconColor="text-violet-600 dark:text-violet-400"
          titleGradient="bg-gradient-to-r from-violet-900 to-purple-800 dark:from-violet-100 dark:to-purple-200 bg-clip-text text-transparent"
          descriptionColor="text-violet-700/70 dark:text-violet-300/70"
        />
        {isRecipientOpen && (
          <div className="space-y-2">
            {(data.userbotRecipients ?? [data.userbotEntity || '']).map((entity: string, idx: number) => (
              <div key={idx} className="flex items-center gap-1">
                <span className="text-xs text-violet-500/70 w-5 flex-shrink-0">{idx + 1}.</span>
                <Input
                  value={entity}
                  onChange={(e) => {
                    const list = [...(data.userbotRecipients ?? [data.userbotEntity || ''])];
                    list[idx] = e.target.value;
                    onNodeUpdate(selectedNode.id, { userbotRecipients: list, userbotEntity: list[0] || '' });
                  }}
                  placeholder="@username, ID, {переменная} или 'me'"
                  className="h-8 text-sm font-mono flex-1"
                />
                <VariableSelector
                  availableVariables={availableVariables as Variable[]}
                  onSelect={(v) => {
                    const list = [...(data.userbotRecipients ?? [data.userbotEntity || ''])];
                    list[idx] = `{${v}}`;
                    onNodeUpdate(selectedNode.id, { userbotRecipients: list, userbotEntity: list[0] || '' });
                  }}
                />
                {(data.userbotRecipients ?? []).length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-400 hover:text-red-500"
                    onClick={() => {
                      const list = [...(data.userbotRecipients ?? [data.userbotEntity || ''])];
                      list.splice(idx, 1);
                      onNodeUpdate(selectedNode.id, { userbotRecipients: list, userbotEntity: list[0] || '' });
                    }}
                  >
                    <i className="fas fa-times text-xs" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full h-7 text-xs border-dashed border-violet-300 text-violet-600 hover:bg-violet-50 dark:border-violet-700 dark:text-violet-400 dark:hover:bg-violet-950/20"
              onClick={() => {
                const list = [...(data.userbotRecipients ?? [data.userbotEntity || '']), ''];
                onNodeUpdate(selectedNode.id, { userbotRecipients: list, userbotEntity: list[0] || '' });
              }}
            >
              <i className="fas fa-plus mr-1" /> Добавить получателя
            </Button>
            <p className="text-[10px] text-muted-foreground/70">
              Юзербот должен быть участником чата. Поддерживается: @username, числовой ID, телефон, {'{переменная}'}.
            </p>
          </div>
        )}
      </div>

      {/* Секция текста сообщения */}
      <div className="space-y-3 bg-gradient-to-br from-blue-50/40 to-cyan-50/20 dark:from-blue-950/30 dark:to-cyan-900/20 rounded-xl p-3 sm:p-4 border border-blue-200/40 dark:border-blue-800/40">
        <SectionHeader
          title="Текст сообщения"
          description="Содержание сообщения от аккаунта"
          isOpen={isTextOpen}
          onToggle={() => setIsTextOpen(!isTextOpen)}
          icon="message"
          iconGradient="from-blue-100 to-cyan-100 dark:from-blue-900/50 dark:to-cyan-900/50"
          iconColor="text-blue-600 dark:text-blue-400"
          titleGradient="bg-gradient-to-r from-blue-900 to-cyan-800 dark:from-blue-100 dark:to-cyan-200 bg-clip-text text-transparent"
          descriptionColor="text-blue-700/70 dark:text-blue-300/70"
        />
        {isTextOpen && (
          <>
            <MessageTextSectionContent
              nodeId={selectedNode.id}
              messageText={data.messageText || ''}
              markdown={data.markdown}
              availableVariables={availableVariables}
              allNodes={allNodes}
              variableFilters={data.variableFilters}
              onNodeUpdate={onNodeUpdate}
            />
            {/* Отключить превью ссылок */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="ub-disableLinkPreview"
                checked={!!data.disableLinkPreview}
                onChange={(e) => onNodeUpdate(selectedNode.id, { disableLinkPreview: e.target.checked })}
                className="h-3.5 w-3.5 rounded border-gray-300"
              />
              <label htmlFor="ub-disableLinkPreview" className="text-xs text-muted-foreground cursor-pointer">
                Отключить превью ссылок
              </label>
            </div>
          </>
        )}
      </div>

      {/* Секция медиафайлов */}
      <MediaFileSection
        projectId={projectId}
        selectedNode={selectedNode}
        isOpen={isMediaOpen}
        onToggle={() => setIsMediaOpen(!isMediaOpen)}
        onNodeUpdate={onNodeUpdate}
        getAllNodesFromAllSheets={allNodes}
      />

      {/* Сохранить ID сообщения */}
      <div className="bg-gradient-to-br from-amber-50/30 to-yellow-50/20 dark:from-amber-950/20 dark:to-yellow-900/10 rounded-xl p-3 border border-amber-200/30 dark:border-amber-800/30">
        <SaveMessageIdSection
          selectedNode={selectedNode}
          onNodeUpdate={onNodeUpdate}
          textVariables={availableVariables as Variable[]}
        />
      </div>

      {/* Сохранить ID ответа (ждёт ответ от получателя) */}
      <div className="bg-gradient-to-br from-violet-50/30 to-purple-50/20 dark:from-violet-950/20 dark:to-purple-900/10 rounded-xl p-3 border border-violet-200/30 dark:border-violet-800/30 space-y-2">
        <Label className="text-xs text-muted-foreground">Сохранить ID ответа (ждёт ответ)</Label>
        <div className="flex gap-1">
          <Input
            value={data.saveResponseIdTo ?? ''}
            onChange={(e) => onNodeUpdate(selectedNode.id, { saveResponseIdTo: e.target.value })}
            placeholder="response_msg_id (необязательно)"
            className="h-8 text-sm flex-1"
          />
          <VariableSelector
            availableVariables={availableVariables as Variable[]}
            onSelect={(v) => onNodeUpdate(selectedNode.id, { saveResponseIdTo: v })}
          />
        </div>
        <p className="text-[10px] text-muted-foreground/60">
          После отправки ждёт 2 сек и сохраняет ID последнего сообщения от получателя. Используй в «Нажать кнопку».
        </p>

        {/* Сохранить текст ответа */}
        {data.saveResponseIdTo && (
          <div className="space-y-2 pt-2 border-t border-violet-200/20 dark:border-violet-800/20">
            <Label className="text-xs text-muted-foreground">Сохранить текст ответа в</Label>
            <div className="flex gap-1">
              <Input
                value={data.saveResponseTextTo ?? ''}
                onChange={(e) => onNodeUpdate(selectedNode.id, { saveResponseTextTo: e.target.value })}
                placeholder="response_text (необязательно)"
                className="h-8 text-sm flex-1"
              />
              <VariableSelector
                availableVariables={availableVariables as Variable[]}
                onSelect={(v) => onNodeUpdate(selectedNode.id, { saveResponseTextTo: v })}
              />
            </div>
          </div>
        )}

        {/* Время ожидания ответа */}
        {data.saveResponseIdTo && (
          <div className="space-y-1 pt-2 border-t border-violet-200/20 dark:border-violet-800/20">
            <Label className="text-xs text-muted-foreground">Время ожидания ответа (сек)</Label>
            <Input
              type="number"
              min={1}
              max={60}
              value={data.responseWaitSeconds ?? 3}
              onChange={(e) => onNodeUpdate(selectedNode.id, { responseWaitSeconds: parseInt(e.target.value) || 3 })}
              className="h-8 text-sm w-24"
            />
          </div>
        )}

        {/* Стратегия выбора ответа */}
        {data.saveResponseTextTo && (
          <div className="space-y-1 pt-2 border-t border-violet-200/20 dark:border-violet-800/20">
            <Label className="text-xs text-muted-foreground">Стратегия выбора ответа</Label>
            <select
              value={data.responseStrategy ?? 'longest'}
              onChange={(e) => onNodeUpdate(selectedNode.id, { responseStrategy: e.target.value })}
              className="h-8 text-sm w-full rounded-md border border-input bg-background px-3"
            >
              <option value="first">Первое сообщение</option>
              <option value="longest">Самое длинное</option>
              <option value="regex_match">По regex</option>
            </select>
          </div>
        )}

        {/* Фильтр ответа (regex) */}
        {data.responseStrategy === 'regex_match' && (
          <div className="space-y-1 pt-2 border-t border-violet-200/20 dark:border-violet-800/20">
            <Label className="text-xs text-muted-foreground">Фильтр ответа (regex)</Label>
            <Input
              value={data.responseFilterRegex ?? ''}
              onChange={(e) => onNodeUpdate(selectedNode.id, { responseFilterRegex: e.target.value })}
              placeholder="Курс покупки.*"
              className="h-8 text-sm font-mono"
            />
          </div>
        )}
      </div>

      {/* Информация о режиме */}
      <div className="rounded-lg border border-violet-200/40 dark:border-violet-800/40 bg-violet-50/30 dark:bg-violet-950/20 p-3">
        <div className="flex items-center gap-2 text-xs text-violet-700 dark:text-violet-300">
          <i className="fas fa-info-circle" />
          <span>Сообщение отправляется от аккаунта через Telethon. Кнопки не поддерживаются.</span>
        </div>
      </div>
    </div>
  );
}
