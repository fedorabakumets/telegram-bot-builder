/**
 * @fileoverview Панель свойств ноды userbot_message
 * Переиспользует компоненты секции текста из message
 * @module components/editor/properties/components/userbot/UserbotMessageConfiguration
 */

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MessageTextSectionContent } from '../message/message-text-section-content';
import { SectionHeader } from '../layout/section-header';
import type { ProjectVariable } from '../../utils/variables-utils';
import type { Node } from '@shared/schema';

/** Пропсы конфигурации userbot_message */
interface UserbotMessageConfigurationProps {
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
 * Панель свойств ноды отправки сообщения через юзербот
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function UserbotMessageConfiguration({
  selectedNode,
  allNodes,
  availableVariables,
  onNodeUpdate,
}: UserbotMessageConfigurationProps) {
  const [isTextOpen, setIsTextOpen] = useState(true);
  const [isRecipientOpen, setIsRecipientOpen] = useState(true);
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
            <Label className="text-xs text-muted-foreground">
              Entity (получатель)
            </Label>
            <Input
              value={data.userbotEntity ?? ''}
              onChange={(e) => onNodeUpdate(selectedNode.id, { userbotEntity: e.target.value })}
              placeholder="@username, ID, {переменная} или 'me'"
              className="h-9 text-sm font-mono"
            />
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
          <MessageTextSectionContent
            nodeId={selectedNode.id}
            messageText={data.messageText || ''}
            markdown={data.markdown}
            availableVariables={availableVariables}
            allNodes={allNodes}
            variableFilters={data.variableFilters}
            onNodeUpdate={onNodeUpdate}
          />
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
