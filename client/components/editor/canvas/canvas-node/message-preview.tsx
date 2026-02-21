/**
 * @fileoverview Компонент превью текстового сообщения
 * 
 * Отображает визуальное представление текстового сообщения
 * с форматированием текста (HTML или Markdown).
 */

import { Node } from '@/types/bot';

/**
 * Интерфейс свойств компонента MessagePreview
 *
 * @interface MessagePreviewProps
 * @property {Node} node - Узел с текстовым сообщением
 */
interface MessagePreviewProps {
  node: Node;
}

/**
 * Компонент превью сообщения
 *
 * @component
 * @description Отображает превью текстового сообщения с форматированием
 *
 * @param {MessagePreviewProps} props - Свойства компонента
 * @param {Node} props.node - Узел с сообщением
 *
 * @returns {JSX.Element | null} Компонент превью или null если нет текста
 */
export function MessagePreview({ node }: MessagePreviewProps) {
  if (!node.data.messageText) {
    return null;
  }

  // Функция парсинга форматированного текста (импортируется из canvas-node)
  // Для автономности компонента дублируем логику
  const parseFormattedText = (text: string): JSX.Element => {
    if (!text) return <span>{text}</span>;
    
    const parseHTML = (htmlText: string): JSX.Element[] => {
      const parts: JSX.Element[] = [];
      let remaining = htmlText;
      let key = 0;

      while (remaining.length > 0) {
        const boldMatch = remaining.match(/^(.*?)<(?:b|strong)>(.*?)<\/(?:b|strong)>(.*)/);
        if (boldMatch) {
          if (boldMatch[1]) parts.push(<span key={key++}>{boldMatch[1]}</span>);
          parts.push(<strong key={key++} className="font-bold">{boldMatch[2]}</strong>);
          remaining = boldMatch[3];
          continue;
        }

        const italicMatch = remaining.match(/^(.*?)<(?:i|em)>(.*?)<\/(?:i|em)>(.*)/);
        if (italicMatch) {
          if (italicMatch[1]) parts.push(<span key={key++}>{italicMatch[1]}</span>);
          parts.push(<em key={key++} className="italic">{italicMatch[2]}</em>);
          remaining = italicMatch[3];
          continue;
        }

        const underlineMatch = remaining.match(/^(.*?)<u>(.*?)<\/u>(.*)/);
        if (underlineMatch) {
          if (underlineMatch[1]) parts.push(<span key={key++}>{underlineMatch[1]}</span>);
          parts.push(<span key={key++} className="underline">{underlineMatch[2]}</span>);
          remaining = underlineMatch[3];
          continue;
        }

        const strikeMatch = remaining.match(/^(.*?)<s>(.*?)<\/s>(.*)/);
        if (strikeMatch) {
          if (strikeMatch[1]) parts.push(<span key={key++}>{strikeMatch[1]}</span>);
          parts.push(<span key={key++} className="line-through">{strikeMatch[2]}</span>);
          remaining = strikeMatch[3];
          continue;
        }

        const codeMatch = remaining.match(/^(.*?)<code>(.*?)<\/code>(.*)/);
        if (codeMatch) {
          if (codeMatch[1]) parts.push(<span key={key++}>{codeMatch[1]}</span>);
          parts.push(<code key={key++} className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs font-mono">{codeMatch[2]}</code>);
          remaining = codeMatch[3];
          continue;
        }

        parts.push(<span key={key++}>{remaining}</span>);
        break;
      }

      return parts;
    };

    const hasHTMLTags = text.includes('<b>') || text.includes('<i>') || text.includes('<u>') ||
                       text.includes('<s>') || text.includes('<code>') || text.includes('<strong>') ||
                       text.includes('<em>') || text.includes('<a href');
    
    const parsedParts = hasHTMLTags ? parseHTML(text) : [<span key="0">{text}</span>];
    return <span>{parsedParts}</span>;
  };

  return (
    <div className="rounded-xl p-4 mb-4 bg-gradient-to-br from-blue-50/80 to-sky-50/80 dark:from-blue-900/20 dark:to-sky-900/20 border border-blue-100 dark:border-blue-800/30">
      <div className="flex items-start space-x-2">
        <div className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400 mt-1.5 flex-shrink-0"></div>
        <div className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed line-clamp-8 font-medium">
          {parseFormattedText(node.data.messageText)}
        </div>
      </div>
    </div>
  );
}
