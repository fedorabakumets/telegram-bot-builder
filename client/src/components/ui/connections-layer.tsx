import { Connection, Node } from '@/types/bot';
import { EnhancedConnectionLine } from './enhanced-connection-line';

interface ConnectionsLayerProps {
  connections: Connection[];
  nodes: Node[];
  selectedConnectionId?: string;
  onConnectionSelect?: (connectionId: string) => void;
  onConnectionDelete?: (connectionId: string) => void;
}

export function ConnectionsLayer({ 
  connections, 
  nodes, 
  selectedConnectionId,
  onConnectionSelect,
  onConnectionDelete
}: ConnectionsLayerProps) {
  if (!connections || connections.length === 0) return null;

  return (
    <svg 
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ 
        zIndex: 0,
        overflow: 'visible'
      }}
    >
      {connections.map((connection) => (
        <EnhancedConnectionLine
          key={connection.id}
          connection={connection}
          nodes={nodes}
          isSelected={selectedConnectionId === connection.id}
          onClick={() => onConnectionSelect?.(connection.id)}
          onDelete={() => onConnectionDelete?.(connection.id)}
          showButtonInfo={true}
        />
      ))}
    </svg>
  );
}