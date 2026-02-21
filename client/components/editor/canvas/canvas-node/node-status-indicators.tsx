/**
 * @fileoverview Компонент индикатора статуса узла
 * 
 * Отображает индикаторы состояния узла:
 * - Индикатор условных сообщений
 * - Индикатор заполненностиrequired fields
 */

import { Node } from '@/types/bot';

/**
 * Интерфейс свойств компонента NodeStatusIndicators
 *
 * @interface NodeStatusIndicatorsProps
 * @property {Node} node - Узел для отображения статуса
 */
interface NodeStatusIndicatorsProps {
  node: Node;
}

/**
 * Компонент индикаторов статуса узла
 *
 * @component
 * @description Отображает индикаторы состояния узла
 *
 * @param {NodeStatusIndicatorsProps} props - Свойства компонента
 * @param {Node} props.node - Узел для проверки
 *
 * @returns {JSX.Element} Компонент индикаторов статуса
 */
export function NodeStatusIndicators({ node }: NodeStatusIndicatorsProps) {
  const hasRequiredFields = (() => {
    switch (node.type) {
      case 'sticker': return !!(node.data.stickerUrl || node.data.stickerFileId);
      case 'voice': return !!node.data.voiceUrl;
      case 'location': return !!(node.data.latitude && node.data.longitude);
      case 'contact': return !!(node.data.phoneNumber && node.data.firstName);
      case 'command': return !!node.data.command;
      case 'admin_rights': return true;
      case 'broadcast': return true;
      default: return (node.type as any) === 'poll' 
        ? !!(((node.data as any).question && (node.data as any).options?.length)) 
        : !!node.data.messageText;
    }
  })();

  return (
    <div className="absolute -top-1 -right-1 flex items-center space-x-1">
      {/* Conditional messages indicator */}
      {node.data.enableConditionalMessages && node.data.conditionalMessages && node.data.conditionalMessages.length > 0 && (
        <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900" title={`Условные сообщения: ${node.data.conditionalMessages.length}`}>
          <i className="fas fa-code-branch text-white text-xs"></i>
        </div>
      )}

      {/* Main status indicator */}
      {hasRequiredFields ? (
        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
          <i className="fas fa-check text-white text-xs"></i>
        </div>
      ) : (
        <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
          <i className="fas fa-exclamation text-white text-xs"></i>
        </div>
      )}
    </div>
  );
}
