/**
 * @fileoverview Компонент заголовка узла
 * 
 * Отображает заголовок узла с иконкой типа, названием,
 * описанием и индикатором перетаскивания.
 */

import { Node } from '@/types/bot';
import { cn } from '@/lib/utils';
import { CommandBadge } from './command-badge';
import { ContentManagementHeader } from './content-management-header';
import { UserManagementHeader } from './user-management-header';
import { AdminRightsHeaderSmall } from './admin-rights-header-small';
import { BroadcastHeader } from './broadcast-header';
import { SynonymsList } from './synonyms-list';
import { nodeIcons } from './node-icons';
import { nodeColors } from './node-colors';

/**
 * Интерфейс свойств компонента NodeHeader
 *
 * @interface NodeHeaderProps
 * @property {Node} node - Узел с данными
 * @property {boolean} [onMove] - Есть ли возможность перемещения
 */
interface NodeHeaderProps {
  node: Node;
  onMove?: boolean;
}

/**
 * Компонент заголовка узла
 *
 * @component
 * @description Отображает заголовок узла со всей информацией
 *
 * @param {NodeHeaderProps} props - Свойства компонента
 * @param {Node} props.node - Узел с данными
 * @param {boolean} [props.onMove] - Есть ли возможность перемещения
 *
 * @returns {JSX.Element} Компонент заголовка узла
 */
export function NodeHeader({ node, onMove }: NodeHeaderProps) {
  // Рендер заголовка в зависимости от типа узла
  const renderTitle = () => {
    switch (node.type) {
      case 'start':
        return <CommandBadge node={node} type="start" />;
      case 'command':
        return <CommandBadge node={node} type="command" />;
      case 'message':
        return 'Сообщение';
      case 'sticker':
        return 'Стикер';
      case 'voice':
        return 'Голосовое сообщение';
      case 'animation':
        return 'GIF анимация';
      case 'location':
        return 'Геолокация';
      case 'contact':
        return 'Контакт';
      case 'pin_message':
      case 'unpin_message':
      case 'delete_message':
        return <ContentManagementHeader node={node} type={node.type} />;
      case 'ban_user':
      case 'unban_user':
      case 'mute_user':
      case 'unmute_user':
      case 'kick_user':
      case 'promote_user':
      case 'demote_user':
        return <UserManagementHeader node={node} type={node.type} />;
      case 'admin_rights':
        return <AdminRightsHeaderSmall node={node} />;
      case 'broadcast':
        return <BroadcastHeader />;
      default:
        return null;
    }
  };

  return (
    <div className="flex items-start mb-6 relative">
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mr-4 shadow-sm relative", nodeColors[node.type])}>
        <i className={cn(nodeIcons[node.type], "text-lg")}></i>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-base flex items-center truncate">
            {renderTitle()}
          </h3>
          {onMove && (
            <div className="ml-2 opacity-40 hover:opacity-70 transition-colors duration-200 cursor-grab">
              <i className="fas fa-grip-vertical text-xs text-gray-400 dark:text-gray-500"></i>
            </div>
          )}
        </div>
        {node.data.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            {node.data.description}
          </p>
        )}
        <SynonymsList node={node} />
      </div>
    </div>
  );
}
