/**
 * @fileoverview Компонент заголовка панели свойств узла
 * 
 * Отображает информацию о выбранном узле, иконку типа,
 * селектор типа узла и ID для копирования.
 * 
 * @module PropertiesHeader
 */

import { Node } from '@shared/schema';
import { Button as UIButton } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getNodeDefaults } from '../../utils/node-defaults';

/**
 * Пропсы компонента заголовка панели свойств
 */
interface PropertiesHeaderProps {
  /** Выбранный узел для редактирования */
  selectedNode: Node;
  /** Функция изменения типа узла */
  onNodeTypeChange?: (nodeId: string, newType: Node['type'], newData: Partial<Node['data']>) => void;
  /** Функция закрытия панели */
  onClose?: (() => void) | undefined;
  /** Отображаемый ID узла */
  displayNodeId: string;
}

/**
 * Маппинг названий типов узлов
 */
const nodeTypeNames: Partial<Record<Node['type'], string>> = {
  start: 'Старт',
  command: 'Команда',
  message: 'Текстовое сообщение',
  sticker: 'Стикер',
  voice: 'Голосовое сообщение',
  animation: 'GIF анимация',
  location: 'Местоположение',
  contact: 'Контакт',
  pin_message: 'Закрепить сообщение',
  unpin_message: 'Открепить сообщение',
  delete_message: 'Удалить сообщение',
  forward_message: 'Переслать сообщение',
  ban_user: 'Заблокировать пользователя',
  unban_user: 'Разблокировать пользователя',
  mute_user: 'Ограничить пользователя',
  unmute_user: 'Снять ограничения',
  kick_user: 'Исключить пользователя',
  promote_user: 'Назначить администратором',
  demote_user: 'Снять с администратора',
  admin_rights: 'Права администратора',
  broadcast: '📢 Рассылка',
  photo: 'Фото',
  video: 'Видео',
  audio: 'Аудио',
  document: 'Документ',
  keyboard: 'Клавиатура',
  input: 'Сохранить ответ',
  condition: 'Условие',
  client_auth: 'Авторизация Client API',
  command_trigger: 'Триггер команды',
  text_trigger: 'Текстовый триггер',
  incoming_message_trigger: 'Триггер входящего сообщения',
  group_message_trigger: 'Триггер входящего сообщения в теме группы',
  media: 'Медиафайл',
};

/**
 * Маппинг иконок типов узлов
 */
const nodeIcons: Partial<Record<Node['type'], string>> = {
  start: 'fas fa-play',
  command: 'fas fa-terminal',
  message: 'fas fa-comment',
  sticker: 'fas fa-smile',
  voice: 'fas fa-microphone',
  animation: 'fas fa-film',
  location: 'fas fa-map-marker-alt',
  contact: 'fas fa-address-book',
  pin_message: 'fas fa-thumbtack',
  unpin_message: 'fas fa-times',
  delete_message: 'fas fa-trash',
  forward_message: 'fas fa-share',
  ban_user: 'fas fa-user-slash',
  unban_user: 'fas fa-user-check',
  mute_user: 'fas fa-volume-mute',
  unmute_user: 'fas fa-volume-up',
  kick_user: 'fas fa-door-open',
  promote_user: 'fas fa-user-shield',
  demote_user: 'fas fa-user-minus',
  admin_rights: 'fas fa-crown',
  broadcast: 'fas fa-bullhorn',
  photo: 'fas fa-image',
  video: 'fas fa-video',
  audio: 'fas fa-music',
  document: 'fas fa-file',
  keyboard: 'fas fa-keyboard',
  input: 'fas fa-keyboard',
  condition: 'fas fa-code-branch',
  client_auth: 'fas fa-key',
  command_trigger: 'fas fa-bolt',
  text_trigger: 'fas fa-comment-dots',
  incoming_message_trigger: 'fas fa-inbox',
  media: 'fas fa-photo-video',
};

/**
 * Маппинг цветов типов узлов
 */
const nodeColors: Partial<Record<Node['type'], string>> = {
  start: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  command: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  message: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  sticker: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
  voice: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  animation: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
  location: 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',
  contact: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
  pin_message: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
  unpin_message: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
  delete_message: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  forward_message: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  ban_user: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  unban_user: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  mute_user: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  unmute_user: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  kick_user: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
  promote_user: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  demote_user: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400',
  admin_rights: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  broadcast: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  photo: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  video: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  audio: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  document: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  keyboard: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  input: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
  condition: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  client_auth: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  command_trigger: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
  text_trigger: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  incoming_message_trigger: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  media: 'bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-900/30 dark:text-fuchsia-400',
};

/**
 * Компонент заголовка панели свойств узла
 * 
 * @param {PropertiesHeaderProps} props - Пропсы компонента
 * @returns {JSX.Element} Заголовок панели свойств
 */
export function PropertiesHeader({
  selectedNode,
  onNodeTypeChange,
  onClose,
  displayNodeId
}: PropertiesHeaderProps) {
  const { toast } = useToast();

  const getNodeTitle = () => {
    return nodeTypeNames[selectedNode.type] || 'Узел';
  };

  const nodeTitle = getNodeTitle();
  const nodeIcon = nodeIcons[selectedNode.type] || 'fas fa-circle';
  const nodeColor = nodeColors[selectedNode.type] || 'bg-slate-100 text-slate-600';

  return (
    <div className="bg-gradient-to-br from-slate-50/50 to-slate-100/30 dark:from-slate-950/40 dark:to-slate-900/30 border-b border-border/50 backdrop-blur-sm">
      <div className="p-3 sm:p-4 space-y-3">
        {/* Main Info Row */}
        <div className="space-y-3 sm:space-y-3.5">
          {/* Header with Icon and Title */}
          <div className="flex items-center gap-3 sm:gap-3.5 justify-between">
            <div className="flex items-center gap-3 sm:gap-3.5 flex-1 min-w-0">
              <div className={`w-10 sm:w-11 h-10 sm:h-11 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm transition-all ${nodeColor}`}>
                <i className={`${nodeIcon} text-base sm:text-lg`}></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Текущий элемент</p>
                <div className="flex items-center gap-2 mt-2 w-full">
                  <Select
                    value={selectedNode.type}
                    onValueChange={(value) => {
                      if (onNodeTypeChange) {
                        const nextType = value as Node['type'];
                        const newData = getNodeDefaults(nextType);

                        if (nextType === 'input') {
                          onNodeTypeChange(selectedNode.id, nextType, {
                            ...newData,
                            inputType: selectedNode.data.inputType ?? 'any',
                            inputVariable: selectedNode.data.inputVariable ?? '',
                            appendVariable: selectedNode.data.appendVariable ?? false,
                            saveToDatabase: selectedNode.data.saveToDatabase ?? false,
                            inputPrompt: selectedNode.data.inputPrompt ?? 'Введите ответ',
                            inputRequired: selectedNode.data.inputRequired ?? true,
                          });
                          return;
                        }

                        const preservedData = {
                          messageText: selectedNode.data.messageText ?? '',
                          keyboardType: selectedNode.data.keyboardType ?? 'none',
                          buttons: selectedNode.data.buttons ?? [],
                          markdown: selectedNode.data.markdown ?? false,
                          oneTimeKeyboard: selectedNode.data.oneTimeKeyboard ?? false,
                          resizeKeyboard: selectedNode.data.resizeKeyboard ?? true
                        };
                        const finalData = { ...newData, ...preservedData };
                        onNodeTypeChange(selectedNode.id, nextType, finalData);
                      }
                    }}
                  >
                    <SelectTrigger className="w-1/2 h-9 text-xs sm:text-sm bg-transparent border-none shadow-none focus:ring-0 p-0 text-slate-900 dark:text-slate-100 font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent min-h-[36px]">
                      {nodeTitle}
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-gradient-to-br from-slate-50/95 to-slate-100/90 dark:from-slate-900/95 dark:to-slate-800/95 max-h-60 overflow-y-auto">
                      <SelectItem value="message">📝 Текстовое сообщение</SelectItem>
                      <SelectItem value="start">🚀 Старт</SelectItem>
                      <SelectItem value="command">⌨️ Команда</SelectItem>
                      <SelectItem value="keyboard">⌨️ Клавиатура</SelectItem>
                      <SelectItem value="sticker">😀 Стикер</SelectItem>
                      <SelectItem value="voice">🎤 Голосовое сообщение</SelectItem>
                      <SelectItem value="animation">🎞️ GIF анимация</SelectItem>
                      <SelectItem value="location">📍 Геолокация</SelectItem>
                      <SelectItem value="contact">📞 Контакт</SelectItem>
                      <SelectItem value="command_trigger">⚡ Триггер команды</SelectItem>
                      <SelectItem value="text_trigger">💬 Текстовый триггер</SelectItem>
                      <SelectItem value="pin_message">📌 Закрепить сообщение</SelectItem>
                      <SelectItem value="unpin_message">📌❌ Открепить сообщение</SelectItem>
                      <SelectItem value="delete_message">🗑️ Удалить сообщение</SelectItem>
                      <SelectItem value="forward_message">↗️ Переслать сообщение</SelectItem>
                      <SelectItem value="ban_user">🚫 Заблокировать пользователя</SelectItem>
                      <SelectItem value="unban_user">✅ Разблокировать пользователя</SelectItem>
                      <SelectItem value="mute_user">🔇 Ограничить пользователя</SelectItem>
                      <SelectItem value="unmute_user">🔊 Снять ограничения</SelectItem>
                      <SelectItem value="kick_user">👢 Исключить пользователя</SelectItem>
                      <SelectItem value="promote_user">👑 Назначить администратором</SelectItem>
                      <SelectItem value="demote_user">👤 Снять с администратора</SelectItem>
                      <SelectItem value="admin_rights">⚡ Права администратора</SelectItem>
                      <SelectItem value="broadcast">📢 Рассылка</SelectItem>
                      <SelectItem value="input">Сохранить ответ в переменную</SelectItem>
                      <SelectItem value="media">🖼️ Медиафайл</SelectItem>
                    </SelectContent>
                  </Select>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(displayNodeId);
                      toast({
                        title: "✅ ID скопирован!",
                        description: `"${displayNodeId}" в буфер обмена`,
                      });
                    }}
                    className="flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r from-blue-500/15 to-cyan-500/15 dark:from-blue-600/20 dark:to-cyan-600/20 hover:from-blue-500/25 hover:to-cyan-500/25 dark:hover:from-blue-600/30 dark:hover:to-cyan-600/30 border border-blue-300/40 dark:border-blue-600/40 hover:border-blue-400/60 dark:hover:border-blue-500/60 rounded-lg transition-all duration-200 group shadow-sm hover:shadow-md w-1/2 min-w-0"
                    title="Нажмите, чтобы скопировать ID"
                    data-testid="button-copy-node-id"
                  >
                    <code className="text-sm font-mono font-semibold text-blue-700 dark:text-blue-300 truncate group-hover:text-blue-800 dark:group-hover:text-blue-200 transition-colors w-full overflow-hidden text-left">
                      {displayNodeId}
                    </code>
                    <i className="fas fa-copy text-blue-600 dark:text-blue-400 text-sm opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0"></i>
                  </button>
                </div>
              </div>
            </div>
            {onClose && (
              <UIButton
                size="icon"
                variant="ghost"
                className="h-8 w-8 flex-shrink-0"
                onClick={onClose}
                title="Закрыть панель свойств"
                data-testid="button-close-properties"
              >
                <X className="w-4 h-4" />
              </UIButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
