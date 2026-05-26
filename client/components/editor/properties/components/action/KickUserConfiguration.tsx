/**
 * @fileoverview Панель свойств узла "Исключить пользователя"
 * @module properties/components/action/KickUserConfiguration
 */
import { useMemo } from 'react';
import type { Node } from '@shared/schema';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VariableSelector } from '../variables/variable-selector';
import { extractVariables } from '../../utils/variables-utils';
import type { Variable } from '@/components/editor/inline-rich/types';

/** Пропсы компонента KickUserConfiguration */
interface KickUserConfigurationProps {
  /** Выбранный узел */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
  /** Все узлы из всех листов (для извлечения переменных) */
  getAllNodesFromAllSheets?: Array<{ node: Node; sheetId?: string; sheetName?: string }>;
}

/**
 * Панель свойств узла исключения пользователя из чата.
 * Позволяет выбрать источник user_id, chat_id и настроить поведение при ошибках.
 *
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function KickUserConfiguration({
  selectedNode,
  onNodeUpdate,
  getAllNodesFromAllSheets = [],
}: KickUserConfigurationProps) {
  const data = selectedNode.data as any;

  /** Извлекаем переменные из всех узлов проекта */
  const textVariables = useMemo((): Variable[] => {
    const nodes = getAllNodesFromAllSheets.map((n) => n.node);
    const { textVariables: vars } = extractVariables(nodes);
    return vars as Variable[];
  }, [getAllNodesFromAllSheets]);

  /** Обновляет поле данных узла */
  const update = (field: string, value: any) =>
    onNodeUpdate(selectedNode.id, { [field]: value });

  const userIdSource = data.userIdSource ?? 'current_user';
  const chatIdSource = data.chatIdSource ?? 'current_chat';

  return (
    <div className="space-y-4 p-4">

      {/* Ограничения */}
      <div className="bg-gradient-to-br from-yellow-50/50 to-amber-50/30 dark:from-yellow-950/20 dark:to-amber-950/10 border border-yellow-200/30 dark:border-yellow-800/30 rounded-lg p-3">
        <div className="text-xs text-yellow-700 dark:text-yellow-300 leading-relaxed">
          <i className="fas fa-exclamation-triangle mr-1"></i>
          <span className="font-medium">Ограничения:</span> Бот должен быть админом с правом «Блокировка участников». Пользователь будет удалён из чата, но сможет вернуться по ссылке-приглашению.
        </div>
      </div>

      {/* Секция: Кого исключить */}
      <div className="bg-gradient-to-br from-rose-50/50 to-red-50/30 dark:from-rose-950/20 dark:to-red-950/10 border border-rose-200/30 dark:border-rose-800/30 rounded-lg p-4 space-y-3">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center">
            <i className="fas fa-user-times text-rose-600 dark:text-rose-400 text-xs"></i>
          </div>
          <Label className="text-sm font-semibold text-rose-900 dark:text-rose-100">Кого исключить</Label>
        </div>

        <Select value={userIdSource} onValueChange={(v) => update('userIdSource', v)}>
          <SelectTrigger className="bg-card/70 border border-rose-200/50 dark:border-rose-800/50">
            <SelectValue placeholder="Выберите источник пользователя" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current_user">Текущего пользователя (отправителя)</SelectItem>
            <SelectItem value="reply_user">Автора сообщения (reply)</SelectItem>
            <SelectItem value="custom">Указать вручную</SelectItem>
          </SelectContent>
        </Select>

        {userIdSource === 'current_user' && (
          <div className="text-xs text-rose-600/70 dark:text-rose-400/70 leading-relaxed">
            Исключит пользователя, который отправил сообщение-триггер.
          </div>
        )}
        {userIdSource === 'reply_user' && (
          <div className="text-xs text-rose-600/70 dark:text-rose-400/70 leading-relaxed">
            Исключит автора сообщения, на которое ответили (reply). Если reply нет — пропустит.
          </div>
        )}

        {userIdSource === 'custom' && (
          <div className="space-y-2">
            <Label className="text-xs font-medium text-rose-700 dark:text-rose-300">ID пользователя или переменная</Label>
            <div className="flex gap-2">
              <Input
                value={data.userIdManual ?? ''}
                onChange={(e) => update('userIdManual', e.target.value)}
                placeholder="123456789 или {user_id}"
                className="bg-white/60 dark:bg-slate-950/60 border-rose-200/50 dark:border-rose-800/50 flex-1"
              />
              <VariableSelector availableVariables={textVariables} onSelect={(name) => update('userIdManual', `{${name}}`)} />
            </div>
          </div>
        )}
      </div>

      {/* Секция: Чат */}
      <div className="bg-gradient-to-br from-slate-50/50 to-slate-100/30 dark:from-slate-950/20 dark:to-slate-900/10 border border-slate-200/30 dark:border-slate-800/30 rounded-lg p-4 space-y-3">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <i className="fas fa-comments text-slate-600 dark:text-slate-400 text-xs"></i>
          </div>
          <Label className="text-sm font-semibold text-slate-900 dark:text-slate-100">Чат</Label>
        </div>

        <Select value={chatIdSource} onValueChange={(v) => update('chatIdSource', v)}>
          <SelectTrigger className="bg-card/70">
            <SelectValue placeholder="Выберите источник чата" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current_chat">Текущий чат</SelectItem>
            <SelectItem value="custom">Указать ID</SelectItem>
          </SelectContent>
        </Select>

        {chatIdSource === 'custom' && (
          <div className="space-y-2">
            <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">ID чата или переменная</Label>
            <div className="flex gap-2">
              <Input
                value={data.chatIdManual ?? ''}
                onChange={(e) => update('chatIdManual', e.target.value)}
                placeholder="-1001234567890 или {chat_id}"
                className="bg-white/60 dark:bg-slate-950/60 flex-1"
              />
              <VariableSelector availableVariables={textVariables} onSelect={(name) => update('chatIdManual', `{${name}}`)} />
            </div>
          </div>
        )}
      </div>

      {/* Секция: Настройки */}
      <div className="bg-gradient-to-br from-green-50/50 to-emerald-50/30 dark:from-green-950/20 dark:to-emerald-950/10 border border-green-200/30 dark:border-green-800/30 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-semibold text-green-900 dark:text-green-100">Игнорировать ошибки</Label>
            <div className="text-xs text-green-600 dark:text-green-400 mt-1">
              Не прерывать сценарий если пользователь не в чате или бот не имеет прав
            </div>
          </div>
          <Switch
            checked={data.ignoreErrors ?? true}
            onCheckedChange={(checked) => update('ignoreErrors', checked)}
          />
        </div>
      </div>
    </div>
  );
}
