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
import { getNodeDefaults } from './node-defaults';

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
const nodeTypeNames: Record<Node['type'], string> = {
  start: '/start команда',
  command: 'Пользовательская команда',
  message: 'Текстовое сообщение',
  sticker: 'Стикер',
  voice: 'Голосовое сообщение',
  animation: 'GIF анимация',
  location: 'Местоположение',
  contact: 'Контакт',
  pin_message: 'Закрепить сообщение',
  unpin_message: 'Открепить сообщение',
  delete_message: 'Удалить сообщение',
  ban_user: 'Заблокировать пользователя',
  unban_user: 'Разблокировать пользователя',
  mute_user: 'Ограничить пользователя',
  unmute_user: 'Снять ограничения',
  kick_user: 'Исключить пользователя',
  promote_user: 'Назначить администратором',
  demote_user: 'Снять с администратора',
  admin_rights: 'Права администратора'
};

/**
 * Маппинг иконок типов узлов
 */
const nodeIcons: Record<Node['type'], string> = {
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
  ban_user: 'fas fa-user-slash',
  unban_user: 'fas fa-user-check',
  mute_user: 'fas fa-volume-mute',
  unmute_user: 'fas fa-volume-up',
  kick_user: 'fas fa-door-open',
  promote_user: 'fas fa-user-shield',
  demote_user: 'fas fa-user-minus',
  admin_rights: 'fas fa-crown'
};

/**
 * Маппинг цветов типов узлов
 */
const nodeColors: Record<Node['type'], string> = {
  start: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
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
  ban_user: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  unban_user: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  mute_user: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  unmute_user: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  kick_user: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
  promote_user: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  demote_user: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400',
  admin_rights: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
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
    return (selectedNode.type === 'start' || selectedNode.type === 'command')
      ? `${selectedNode.data.command || nodeTypeNames[selectedNode.type]}`
      : nodeTypeNames[selectedNode.type];
  };

  return (
    <div className="bg-gradient-to-br from-slate-50/50 to-slate-100/30 dark:from-slate-950/40 dark:to-slate-900/30 border-b border-border/50 backdrop-blur-sm">
      <div className="p-3 sm:p-4 space-y-3">
        {/* Main Info Row */}
        <div className="space-y-3 sm:space-y-3.5">
          {/* Header with Icon and Title */}
          <div className="flex items-center gap-3 sm:gap-3.5 justify-between">
            <div className="flex items-center gap-3 sm:gap-3.5 flex-1">
              <div className={`w-10 sm:w-11 h-10 sm:h-11 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm transition-all ${nodeColors[selectedNode.type]}`}>
                <i className={`${nodeIcons[selectedNode.type]} text-base sm:text-lg`}></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Текущий элемент</p>
                <h2 className="text-base sm:text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent leading-tight truncate">
                  {getNodeTitle()}
                </h2>
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

          {/* Type Selector */}
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <i className="fas fa-exchange-alt text-slate-600 dark:text-slate-400 text-xs sm:text-sm"></i>
              Изменить тип
            </label>
            <Select
              value={selectedNode.type}
              onValueChange={(value) => {
                if (onNodeTypeChange) {
                  const newData = getNodeDefaults(value as Node['type']);
                  const preservedData = {
                    messageText: selectedNode.data.messageText,
                    keyboardType: selectedNode.data.keyboardType,
                    buttons: selectedNode.data.buttons,
                    markdown: selectedNode.data.markdown,
                    oneTimeKeyboard: selectedNode.data.oneTimeKeyboard,
                    resizeKeyboard: selectedNode.data.resizeKeyboard
                  };
                  const finalData = { ...newData, ...preservedData };
                  onNodeTypeChange(selectedNode.id, value as Node['type'], finalData);
                }
              }}
            >
              <SelectTrigger className="w-full text-xs sm:text-sm bg-white/60 dark:bg-slate-950/60 border border-slate-300/40 dark:border-slate-700/40 hover:border-slate-400/60 dark:hover:border-slate-600/60 hover:bg-white/80 dark:hover:bg-slate-900/60 focus:border-slate-500 dark:focus:border-slate-500 focus:ring-2 focus:ring-slate-400/30 dark:focus:ring-slate-600/30 transition-all duration-200 rounded-lg text-slate-900 dark:text-slate-50">
                {getNodeTitle()}
              </SelectTrigger>
              <SelectContent className="z-50 bg-gradient-to-br from-slate-50/95 to-slate-100/90 dark:from-slate-900/95 dark:to-slate-800/95 max-h-60 overflow-y-auto">
                <SelectItem value="message">📝 Текстовое сообщение</SelectItem>
                <SelectItem value="sticker">😀 Стикер</SelectItem>
                <SelectItem value="voice">🎤 Голосовое сообщение</SelectItem>
                <SelectItem value="animation">🎞️ GIF анимация</SelectItem>
                <SelectItem value="location">📍 Геолокация</SelectItem>
                <SelectItem value="contact">📞 Контакт</SelectItem>
                <SelectItem value="start">▶️ /start команда</SelectItem>
                <SelectItem value="command">🔧 Пользовательская команда</SelectItem>
                <SelectItem value="pin_message">📌 Закрепить сообщение</SelectItem>
                <SelectItem value="unpin_message">📌❌ Открепить сообщение</SelectItem>
                <SelectItem value="delete_message">🗑️ Удалить сообщение</SelectItem>
                <SelectItem value="ban_user">🚫 Заблокировать пользователя</SelectItem>
                <SelectItem value="unban_user">✅ Разблокировать пользователя</SelectItem>
                <SelectItem value="mute_user">🔇 Ограничить пользователя</SelectItem>
                <SelectItem value="unmute_user">🔊 Снять ограничения</SelectItem>
                <SelectItem value="kick_user">👢 Исключить пользователя</SelectItem>
                <SelectItem value="promote_user">👑 Назначить администратором</SelectItem>
                <SelectItem value="demote_user">👤 Снять с администратора</SelectItem>
                <SelectItem value="admin_rights">⚡ Права администратора</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ID Badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-muted-foreground px-2 py-1 rounded-md bg-muted/40">ID:</span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(displayNodeId);
              toast({
                title: "✅ ID скопирован!",
                description: `"${displayNodeId}" в буфер обмена`,
              });
            }}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-gradient-to-r from-blue-500/15 to-cyan-500/10 dark:from-blue-600/20 dark:to-cyan-600/15 hover:from-blue-500/25 hover:to-cyan-500/20 dark:hover:from-blue-600/30 dark:hover:to-cyan-600/25 border border-blue-300/40 dark:border-blue-600/40 hover:border-blue-400/60 dark:hover:border-blue-500/60 rounded-lg transition-all duration-200 cursor-pointer group shadow-sm hover:shadow-md"
            title="Нажмите, чтобы скопировать ID"
            data-testid="button-copy-node-id"
          >
            <code className="text-xs sm:text-sm font-mono font-semibold text-blue-700 dark:text-blue-300 truncate group-hover:text-blue-800 dark:group-hover:text-blue-200 transition-colors">
              {displayNodeId}
            </code>
            <i className="fas fa-copy text-blue-600 dark:text-blue-400 text-xs opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0"></i>
          </button>
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Настройте параметры выбранного элемента ниже
        </p>
      </div>
    </div>
  );
}
