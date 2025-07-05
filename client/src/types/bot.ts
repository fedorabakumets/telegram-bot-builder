export interface Position {
  x: number;
  y: number;
}

export interface Button {
  id: string;
  text: string;
  action: 'goto' | 'command' | 'url';
  target?: string;
  url?: string;
}

export interface NodeData {
  command?: string;
  description?: string;
  messageText?: string;
  imageUrl?: string;
  keyboardType: 'reply' | 'inline' | 'none';
  buttons: Button[];
  oneTimeKeyboard: boolean;
  resizeKeyboard: boolean;
  markdown: boolean;
}

export interface Node {
  id: string;
  type: 'start' | 'message' | 'photo' | 'keyboard' | 'condition' | 'input' | 'command';
  position: Position;
  data: NodeData;
}

export interface Connection {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface BotData {
  nodes: Node[];
  connections: Connection[];
}

export interface BotProject {
  id: number;
  name: string;
  description?: string;
  data: BotData;
  createdAt: Date;
  updatedAt: Date;
}

export interface ComponentDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  type: Node['type'];
  defaultData: Partial<NodeData>;
}
