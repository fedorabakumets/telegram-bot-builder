import { CodeWithMap, CodeNodeRange } from "../../bot-generator";

// Функция для парсинга маркеров и создания карты кода

export function parseCodeMap(code: string): CodeWithMap {
  const lines = code.split('\n');
  const nodeMap: CodeNodeRange[] = [];
  const stack: Array<{ nodeId: string; startLine: number; }> = [];

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    // Проверяем маркер начала
    const startMatch = line.match(/# @@NODE_START:(.+?)@@/);
    if (startMatch) {
      const nodeId = startMatch[1];
      stack.push({ nodeId, startLine: lineNumber });
      return;
    }

    // Проверяем маркер конца
    const endMatch = line.match(/# @@NODE_END:(.+?)@@/);
    if (endMatch) {
      const nodeId = endMatch[1];
      const startInfo = stack.pop();

      if (startInfo && startInfo.nodeId === nodeId) {
        nodeMap.push({
          nodeId,
          startLine: startInfo.startLine,
          endLine: lineNumber
        });
      }
    }
  });

  return { code, nodeMap };
}
