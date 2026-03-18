/**
 * @fileoverview Renderer для шаблона навигации по узлам
 * @module templates/node-navigation/node-navigation.renderer
 */

import type { EnhancedNode } from '../../bot-generator/types';
import { formatTextForPython } from '../filters';
import { renderPartialTemplate } from '../template-renderer';
import type { NavigationTargetNode, NodeNavigationParams } from './node-navigation.params';

/**
 * Генерирует код навигации по узлам бота
 */
export function generateNodeNavigation(
  nodes: EnhancedNode[],
  baseIndent: string,
  nextNodeIdVar: string,
  messageVar: string,
  userVarsVar: string
): string {
  if (nodes.length === 0) return '';

  const targetNodes: NavigationTargetNode[] = nodes.map(node => {
    const autoTransitionTo = node.data?.autoTransitionTo;
    const autoTargetNode = autoTransitionTo
      ? nodes.find(n => n.id === autoTransitionTo)
      : undefined;

    return {
      id: node.id,
      messageText: formatTextForPython(node.data?.messageText || node.data?.text || ''),
      attachedMedia: node.data?.attachedMedia || [],
      enableAutoTransition: node.data?.enableAutoTransition ?? false,
      autoTransitionTo: autoTransitionTo || '',
      autoTransitionSafeName: autoTargetNode
        ? autoTargetNode.id.replace(/[^a-zA-Z0-9_]/g, '_')
        : '',
      collectUserInput: node.data?.collectUserInput,
      autoTransitionExists: !!autoTargetNode,
    };
  });

  const params: NodeNavigationParams = {
    nodes: targetNodes,
    baseIndent,
    nextNodeIdVar,
    messageVar,
    userVarsVar,
  };

  return renderPartialTemplate('node-navigation/node-navigation.py.jinja2', params);
}
