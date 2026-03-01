/**
 * @fileoverview Конфигурация типов узлов
 * 
 * Компонент для отображения настроек специфичных типов узлов.
 */

import type { Node } from '@shared/schema';

/** Пропсы компонента конфигурации узлов */
interface NodeTypeConfigurationsProps {
  /** Выбранный узел */
  selectedNode: Node;
  /** ID проекта */
  projectId: number;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
  /** Компонент конфигурации стикера */
  StickerConfiguration: React.ComponentType<{ selectedNode: Node; onNodeUpdate: (nodeId: string, updates: Partial<any>) => void }>;
  /** Компонент конфигурации голоса */
  VoiceConfiguration: React.ComponentType<{ projectId: number; selectedNode: Node; onNodeUpdate: (nodeId: string, updates: Partial<any>) => void }>;
  /** Компонент конфигурации анимации */
  AnimationConfiguration: React.ComponentType<{ projectId: number; selectedNode: Node; onNodeUpdate: (nodeId: string, updates: Partial<any>) => void }>;
  /** Компонент конфигурации локации */
  LocationCoordinatesSection: React.ComponentType<{ selectedNode: Node; onNodeUpdate: (nodeId: string, updates: Partial<any>) => void }>;
  LocationDetailsSection: React.ComponentType<{ selectedNode: Node; onNodeUpdate: (nodeId: string, updates: Partial<any>) => void }>;
  FoursquareIntegrationSection: React.ComponentType<{ selectedNode: Node; onNodeUpdate: (nodeId: string, updates: Partial<any>) => void }>;
  MapServicesSection: React.ComponentType<{ selectedNode: Node; onNodeUpdate: (nodeId: string, updates: Partial<any>) => void }>;
  /** Компонент конфигурации контакта */
  ContactConfiguration: React.ComponentType<{ selectedNode: Node; onNodeUpdate: (nodeId: string, updates: Partial<any>) => void }>;
  /** Компонент конфигурации рассылки */
  BroadcastNodeProperties: React.ComponentType<{ node: Node; onUpdate: (nodeId: string, updates: Partial<any>) => void }>;
  /** Компонент управления контентом */
  ContentManagementConfiguration: React.ComponentType<{ selectedNode: Node; onNodeUpdate: (nodeId: string, updates: Partial<any>) => void }>;
  /** Компонент управления пользователями */
  UserManagementConfiguration: React.ComponentType<{ selectedNode: Node; onNodeUpdate: (nodeId: string, updates: Partial<any>) => void }>;
  /** Компонент информации о правах администратора */
  AdminRightsInfo: React.ComponentType<{}>;
}

/**
 * Компонент конфигурации типов узлов
 * 
 * @param {NodeTypeConfigurationsProps} props - Пропсы компонента
 * @returns {JSX.Element | null} Конфигурация узлов или null
 */
export function NodeTypeConfigurations({
  selectedNode,
  projectId,
  onNodeUpdate,
  StickerConfiguration,
  VoiceConfiguration,
  AnimationConfiguration,
  LocationCoordinatesSection,
  LocationDetailsSection,
  FoursquareIntegrationSection,
  MapServicesSection,
  ContactConfiguration,
  BroadcastNodeProperties,
  ContentManagementConfiguration,
  UserManagementConfiguration,
  AdminRightsInfo
}: NodeTypeConfigurationsProps) {
  const nodeType = selectedNode.type as string;

  if (nodeType === 'sticker') {
    return <StickerConfiguration selectedNode={selectedNode} onNodeUpdate={onNodeUpdate} />;
  }

  if (nodeType === 'voice') {
    return <VoiceConfiguration projectId={projectId} selectedNode={selectedNode} onNodeUpdate={onNodeUpdate} />;
  }

  if (nodeType === 'animation') {
    return <AnimationConfiguration projectId={projectId} selectedNode={selectedNode} onNodeUpdate={onNodeUpdate} />;
  }

  if (nodeType === 'location') {
    return (
      <div className="space-y-6">
        <LocationCoordinatesSection selectedNode={selectedNode} onNodeUpdate={onNodeUpdate} />
        <LocationDetailsSection selectedNode={selectedNode} onNodeUpdate={onNodeUpdate} />
        <FoursquareIntegrationSection selectedNode={selectedNode} onNodeUpdate={onNodeUpdate} />
        <MapServicesSection selectedNode={selectedNode} onNodeUpdate={onNodeUpdate} />
      </div>
    );
  }

  if (nodeType === 'contact') {
    return <ContactConfiguration selectedNode={selectedNode} onNodeUpdate={onNodeUpdate} />;
  }

  if (nodeType === 'broadcast') {
    return <BroadcastNodeProperties node={selectedNode} onUpdate={onNodeUpdate} />;
  }

  if (nodeType === 'pin_message' || nodeType === 'unpin_message' || nodeType === 'delete_message') {
    return <ContentManagementConfiguration selectedNode={selectedNode} onNodeUpdate={onNodeUpdate} />;
  }

  if (nodeType === 'ban_user' || nodeType === 'unban_user' || nodeType === 'mute_user' ||
      nodeType === 'unmute_user' || nodeType === 'kick_user' || nodeType === 'promote_user' ||
      nodeType === 'demote_user' || nodeType === 'admin_rights') {
    return <UserManagementConfiguration selectedNode={selectedNode} onNodeUpdate={onNodeUpdate} />;
  }

  if (nodeType === 'admin_rights') {
    return <AdminRightsInfo />;
  }

  return null;
}
