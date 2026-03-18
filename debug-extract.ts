import { extractNodesAndConnections } from './lib/bot-generator/core/extract-nodes-and-connections.ts';

// Создаём чистый проект с reply клавиатурой
const p: any = {
  sheets: [{
    id: 'sheet1',
    name: 'Main',
    nodes: [{
      id: 'start1',
      type: 'start',
      position: { x: 0, y: 0 },
      data: {
        command: '/start',
        messageText: 'Привет!',
        keyboardType: 'reply',
        buttons: [],
      },
    }],
    connections: [],
  }],
  version: 2,
  activeSheetId: 'sheet1',
};

const { nodes } = extractNodesAndConnections(p);
console.log('Nodes:', nodes);
console.log('Node 0 keyboardType:', (nodes[0] as any)?.data?.keyboardType);
