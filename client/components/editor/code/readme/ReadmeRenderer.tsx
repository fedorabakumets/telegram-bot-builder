/**
 * @fileoverview Компонент рендеринга Markdown для README
 * Стилизованный рендерер с поддержкой карточек статистики и команд BotFather
 */

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { useMemo, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import type { Components } from 'react-markdown';
import { InlineCode } from './InlineCode';
import { StatsCards } from './StatsCards';
import { BotFatherCard } from './BotFatherCard';
import { parseStats, extractBotFatherCommands } from './use-readme-parser';

/**
 * Пользовательские компоненты для рендеринга Markdown
 */
const markdownComponents: Components = {
  h1: ({ node, ...props }) => <h1 className="text-2xl sm:text-3xl font-bold text-foreground mt-6 mb-4" {...props} />,
  h2: ({ node, ...props }) => <h2 className="text-xl sm:text-2xl font-bold text-foreground mt-5 mb-3" {...props} />,
  h3: ({ node, ...props }) => <h3 className="text-lg sm:text-xl font-medium text-foreground mt-4 mb-2" {...props} />,
  p: ({ node, ...props }) => <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-3 last:mb-0" {...props} />,
  ul: ({ node, children, ...props }) => <ul className="list-disc space-y-1 mb-3 text-sm sm:text-base text-muted-foreground" {...props}>{children}</ul>,
  ol: ({ node, children, ...props }) => <ol className="list-decimal space-y-1 mb-3 text-sm sm:text-base text-muted-foreground" {...props}>{children}</ol>,
  li: ({ node, children, ...props }) => <li className="leading-relaxed" {...props}>{children}</li>,
  code: ({ node, inline, className, children, ...props }: any) =>
    inline ? (
      <InlineCode>{children}</InlineCode>
    ) : (
      <pre className="bg-muted/50 dark:bg-muted/20 rounded-lg p-3 sm:p-4 overflow-x-auto mb-4" {...props}>
        <code className="text-xs sm:text-sm font-mono text-accent-foreground block">{children}</code>
      </pre>
    ),
  blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-primary pl-4 py-2 my-4 text-muted-foreground italic" {...props} />,
  hr: ({ node, ...props }) => <hr className="border-border my-6" {...props} />,
  a: ({ node, ...props }) => <a className="text-primary hover:underline font-medium text-xs sm:text-sm break-all" {...props} />,
  strong: ({ node, ...props }) => <strong className="font-semibold text-foreground" {...props} />,
  table: ({ node, ...props }) => <div className="overflow-x-auto my-4"><table className="w-full border-collapse text-sm sm:text-base" {...props} /></div>,
  th: ({ node, ...props }) => <th className="border border-border bg-muted/50 px-3 py-2 text-left font-semibold text-xs sm:text-sm" {...props} />,
  td: ({ node, ...props }) => <td className="border border-border px-3 py-2 text-muted-foreground text-xs sm:text-sm" {...props} />,
};

/**
 * Компонент для рендеринга Markdown контента README
 * @param props - Свойства компонента
 * @returns JSX элемент с отрендеренным Markdown
 */
export function ReadmeRenderer({ content }: { content: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stats = parseStats(content);
  const botFatherCommands = extractBotFatherCommands(content);

  const processedContent = useMemo(() => {
    let result = content;
    if (stats && stats.length > 0) {
      result = result.replace(
        /### Статистика\s*\n([\s\S]*?)\n+(?=\n*## )/,
        (match, p1) => (/-\s*\*\*[^*]+\*\*:\s*\d+/.test(p1) ? '\n<div data-replace="stats"></div>\n\n' : match),
      );
    }
    if (botFatherCommands) {
      result = result.replace(
        /<!-- BOTFATHER_COMMANDS_START -->[\s\S]*?<!-- BOTFATHER_COMMANDS_END -->/g,
        '\n<div data-replace="botfather"></div>\n',
      );
    }
    return result.replace(/\n{4,}/g, '\n\n\n');
  }, [content, stats, botFatherCommands]);

  useEffect(() => {
    if (!containerRef.current) return;

    const statsPlaceholder = containerRef.current.querySelector('[data-replace="stats"]');
    if (statsPlaceholder && stats && stats.length > 0) {
      const tempDiv = document.createElement('div');
      createRoot(tempDiv).render(<StatsCards stats={stats} />);
      statsPlaceholder.replaceWith(tempDiv);
    }

    const botFatherPlaceholder = containerRef.current.querySelector('[data-replace="botfather"]');
    if (botFatherPlaceholder && botFatherCommands) {
      const tempDiv = document.createElement('div');
      createRoot(tempDiv).render(<BotFatherCard commands={botFatherCommands} />);
      botFatherPlaceholder.replaceWith(tempDiv);
    }

    const handlePreClick = async (e: Event) => {
      const pre = (e.target as HTMLElement).closest('pre');
      if (!pre) return;
      const code = pre.querySelector('code');
      if (!code) return;
      try {
        await navigator.clipboard.writeText(code.textContent || '');
        const tooltip = document.createElement('div');
        tooltip.textContent = '✓ Скопировано';
        tooltip.className = 'absolute top-2 right-2 px-2 py-1 rounded text-xs bg-green-500 text-white';
        pre.style.position = 'relative';
        pre.appendChild(tooltip);
        setTimeout(() => tooltip.remove(), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    };

    containerRef.current.addEventListener('click', handlePreClick);
    return () => { containerRef.current?.removeEventListener('click', handlePreClick); };
  }, [stats, botFatherCommands]);

  return (
    <div ref={containerRef} className="readme-content max-w-none">
      <style>{`
        .readme-content h2 { font-weight: 700 !important; font-size: 1.5rem !important; }
        .readme-content ol > li, .readme-content ul > li { display: list-item !important; }
        .readme-content ol > li > p:first-child, .readme-content ul > li > p:first-child { display: inline !important; margin-bottom: 0 !important; }
        .readme-content p { display: inline !important; white-space: normal !important; }
        .readme-content li > p { display: inline !important; }
        .readme-content pre { cursor: pointer !important; }
        .readme-content pre:hover { background-color: rgba(128, 128, 128, 0.1) !important; }
      `}</style>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={markdownComponents}>
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
