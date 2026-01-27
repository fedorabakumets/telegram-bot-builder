// Функция для поиска медиапеременных в тексте сообщения
function findMediaVariablesInText(text: string, mediaVariables: Map<string, { type: string; variable: string; }>): Array<{ variable: string; type: string; }> {
  if (!text || mediaVariables.size === 0) return [];

  const foundMedia: Array<{ variable: string; type: string; }> = [];

  // Регулярное выражение для поиска переменных формата {variable_name}
  const variableRegex = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;
  let match: RegExpExecArray | null;

  while ((match = variableRegex.exec(text)) !== null) {
    const variableName = match[1];
    const mediaInfo = mediaVariables.get(variableName);

    if (mediaInfo) {
      // Проверяем, не добавили ли мы уже эту переменную
      if (!foundMedia.some(m => m.variable === variableName)) {
        foundMedia.push({
          variable: variableName,
          type: mediaInfo.type
        });
      }
    }
  }

  return foundMedia;
}
