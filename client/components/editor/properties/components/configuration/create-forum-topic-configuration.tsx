/**
 * @fileoverview Компонент конфигурации узла создания топика в форум-группе Telegram
 * @module components/editor/properties/components/configuration/create-forum-topic-configuration
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CreateForumTopicConfigProps, ForumChatIdSource } from './create-forum-topic-types';
import { TOPIC_ICON_COLORS } from './create-forum-topic-colors';

/**
 * Компонент конфигурации узла create_forum_topic
 *
 * Три секции:
 * - Группа: источник ID форум-группы
 * - Топик: название и цвет иконки
 * - Сохранить ID топика: переменная и флаг skipIfExists
 */
export function CreateForumTopicConfiguration({ selectedNode, onNodeUpdate }: CreateForumTopicConfigProps) {
  const data = selectedNode.data as any;
  const chatIdSource: ForumChatIdSource = data.forumChatIdSource ?? 'manual';

  const update = (updates: Record<string, unknown>) =>
    onNodeUpdate(selectedNode.id, updates as any);

  return (
    <div className="space-y-6">
      {/* Секция: Группа */}
      <div className="bg-gradient-to-br from-teal-50/50 to-cyan-50/30 dark:from-teal-950/20 dark:to-cyan-950/10 border border-teal-200/30 dark:border-teal-800/30 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center">
            <i className="fas fa-users text-teal-600 dark:text-teal-400 text-xs"></i>
          </div>
          <Label className="text-sm font-semibold text-teal-900 dark:text-teal-100">Группа</Label>
        </div>

        <div className="space-y-3">
          <Select
            value={chatIdSource}
            onValueChange={(value) => update({ forumChatIdSource: value as ForumChatIdSource })}
          >
            <SelectTrigger className="bg-card/70 border border-teal-200/50 dark:border-teal-800/50">
              <SelectValue placeholder="Источник ID группы" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Вручную</SelectItem>
              <SelectItem value="variable">Из переменной</SelectItem>
            </SelectContent>
          </Select>

          {chatIdSource === 'manual' && (
            <div className="space-y-1">
              <Label className="text-xs font-medium text-teal-700 dark:text-teal-300">ID или username группы</Label>
              <Input
                value={data.forumChatId ?? ''}
                onChange={(e) => update({ forumChatId: e.target.value })}
                placeholder="2300967595 или @group_name"
                className="bg-white/60 dark:bg-slate-950/60 border-teal-200/50 dark:border-teal-800/50"
              />
            </div>
          )}

          {chatIdSource === 'variable' && (
            <div className="space-y-1">
              <Label className="text-xs font-medium text-teal-700 dark:text-teal-300">Имя переменной</Label>
              <Input
                value={data.forumChatVariableName ?? ''}
                onChange={(e) => update({ forumChatVariableName: e.target.value })}
                placeholder="forum_chat_id"
                className="bg-white/60 dark:bg-slate-950/60 border-teal-200/50 dark:border-teal-800/50"
              />
            </div>
          )}
        </div>
      </div>

      {/* Секция: Топик */}
      <div className="bg-gradient-to-br from-sky-50/50 to-blue-50/30 dark:from-sky-950/20 dark:to-blue-950/10 border border-sky-200/30 dark:border-sky-800/30 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center">
            <i className="fas fa-layer-group text-sky-600 dark:text-sky-400 text-xs"></i>
          </div>
          <Label className="text-sm font-semibold text-sky-900 dark:text-sky-100">Топик</Label>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs font-medium text-sky-700 dark:text-sky-300">Название топика</Label>
            <Input
              value={data.topicName ?? ''}
              onChange={(e) => update({ topicName: e.target.value })}
              placeholder="Топик {user_name}"
              className="bg-white/60 dark:bg-slate-950/60 border-sky-200/50 dark:border-sky-800/50"
            />
            <div className="text-xs text-sky-600/70 dark:text-sky-400/70">
              Поддерживает <span className="font-mono bg-sky-100/60 dark:bg-sky-900/30 px-1 rounded">{'{переменные}'}</span>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium text-sky-700 dark:text-sky-300">Цвет иконки</Label>
            <Select
              value={data.topicIconColor ?? '7322096'}
              onValueChange={(value) => update({ topicIconColor: value })}
            >
              <SelectTrigger className="bg-card/70 border border-sky-200/50 dark:border-sky-800/50">
                <SelectValue placeholder="Выберите цвет" />
              </SelectTrigger>
              <SelectContent>
                {TOPIC_ICON_COLORS.map((color) => (
                  <SelectItem key={color.value} value={color.value}>
                    {color.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Секция: Сохранить ID топика */}
      <div className="bg-gradient-to-br from-slate-50/50 to-slate-100/30 dark:from-slate-950/20 dark:to-slate-900/10 border border-slate-200/30 dark:border-slate-800/30 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center">
            <i className="fas fa-save text-slate-600 dark:text-slate-400 text-xs"></i>
          </div>
          <Label className="text-sm font-semibold text-slate-900 dark:text-slate-100">Сохранить ID топика</Label>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Переменная для thread_id</Label>
            <Input
              value={data.saveThreadIdTo ?? ''}
              onChange={(e) => update({ saveThreadIdTo: e.target.value })}
              placeholder="forum_thread_id"
              className="bg-white/60 dark:bg-slate-950/60 border-slate-200/50 dark:border-slate-800/50"
            />
            <div className="text-xs text-slate-600/70 dark:text-slate-400/70">
              Используй{' '}
              <span className="font-mono bg-slate-100/60 dark:bg-slate-800/30 px-1 rounded">{'{имя_переменной}'}</span>{' '}
              в узлах <span className="font-mono">forward_message</span> и <span className="font-mono">message</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-card/50 border border-slate-200/30 dark:border-slate-800/30">
            <div>
              <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Не создавать повторно</Label>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Пропустить, если переменная уже заполнена
              </div>
            </div>
            <Switch
              checked={data.skipIfExists ?? false}
              onCheckedChange={(checked) => update({ skipIfExists: checked })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
