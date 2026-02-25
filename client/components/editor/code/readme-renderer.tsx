/**
 * @fileoverview Компонент адаптивного рендеринга Markdown для README
 *
 * Предоставляет стилизованные компоненты для красивого отображения
 * Markdown-контента с поддержкой тёмной темы и адаптивности.
 *
 * @module ReadmeRenderer
 */

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { useMemo, useRef, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { Components } from 'react-markdown';

/**
 * Парсит статистику из Markdown контента
 * Ищет секцию "### Статистика" и извлекает значения
 */
function parseStats(content: string): Array<{ label: string; value: number }> | null {
  const statsMatch = content.match(/### Статистика\s*\n([\s\S]*?)(?=\n##|\n#|$)/);
  if (!statsMatch) return null;

  const statsBlock = statsMatch[1];
  const stats: Array<{ label: string; value: number }> = [];

  const lines = statsBlock.split('\n');
  for (const line of lines) {
    // Ищем формат: - **Текст**: число
    const match = line.match(/-\s*\*\*([^*]+)\*\*:\s*(\d+)/);
    if (match) {
      stats.push({ label: match[1].trim(), value: parseInt(match[2], 10) });
    }
  }

  return stats.length > 0 ? stats : null;
}

/**
 * Извлекает команды BotFather из Markdown контента
 */
function extractBotFatherCommands(content: string): string | null {
  const startMarker = '<!-- BOTFATHER_COMMANDS_START -->';
  const endMarker = '<!-- BOTFATHER_COMMANDS_END -->';

  const startIndex = content.indexOf(startMarker);
  const endIndex = content.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1) return null;

  const block = content.substring(startIndex + startMarker.length, endIndex);
  const codeMatch = block.match(/```([\s\S]*?)```/);

  return codeMatch ? codeMatch[1].trim() : null;
}

/**
 * Компонент карточек статистики
 */
function StatsCards({ stats }: { stats: Array<{ label: string; value: number }> }) {
  const colors = [
    { bg: 'bg-blue-50/50 dark:bg-blue-900/25', border: 'border-blue-200/50 dark:border-blue-800/50', text: 'text-blue-600 dark:text-blue-400', label: 'text-blue-700 dark:text-blue-300' },
    { bg: 'bg-green-50/50 dark:bg-green-900/25', border: 'border-green-200/50 dark:border-green-800/50', text: 'text-green-600 dark:text-green-400', label: 'text-green-700 dark:text-green-300' },
    { bg: 'bg-purple-50/50 dark:bg-purple-900/25', border: 'border-purple-200/50 dark:border-purple-800/50', text: 'text-purple-600 dark:text-purple-400', label: 'text-purple-700 dark:text-purple-300' },
    { bg: 'bg-orange-50/50 dark:bg-orange-900/25', border: 'border-orange-200/50 dark:border-orange-800/50', text: 'text-orange-600 dark:text-orange-400', label: 'text-orange-700 dark:text-orange-300' },
    { bg: 'bg-cyan-50/50 dark:bg-cyan-900/25', border: 'border-cyan-200/50 dark:border-cyan-800/50', text: 'text-cyan-600 dark:text-cyan-400', label: 'text-cyan-700 dark:text-cyan-300' },
    { bg: 'bg-pink-50/50 dark:bg-pink-900/25', border: 'border-pink-200/50 dark:border-pink-800/50', text: 'text-pink-600 dark:text-pink-400', label: 'text-pink-700 dark:text-pink-300' },
  ];

  return (
    <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-6 gap-2 xs:gap-2.5 my-4">
      {stats.map((stat, index) => {
        const color = colors[index % colors.length];
        return (
          <div
            key={index}
            className={`${color.bg} ${color.border} border rounded-md p-2 xs:p-2.5 text-center`}
          >
            <div className={`${color.text} text-sm xs:text-base font-bold`}>{stat.value}</div>
            <div className={`${color.label} text-xs mt-0.5`}>{stat.label}</div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Компонент команд BotFather
 */
function BotFatherCard({ commands }: { commands: string }) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(commands);
      alert('Команды скопированы!');
    } catch {
      alert('Не удалось скопировать команды');
    }
  };

  return (
    <div className="bg-blue-50 dark:bg-blue-950/30 p-3 xs:p-4 rounded-lg border border-blue-200 dark:border-blue-800/40 space-y-2 my-4">
      <div className="flex items-center justify-between gap-2">
        <h4 className="font-medium text-blue-800 dark:text-blue-200 text-sm xs:text-base">
          <i className="fas fa-robot mr-2"></i>
          Команды для @BotFather
        </h4>
        <button
          onClick={handleCopy}
          className="text-xs px-2 py-1 rounded border border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
          title="Скопировать команды"
        >
          <i className="fas fa-copy mr-1"></i>
          Копировать
        </button>
      </div>
      <pre className="bg-background p-2 xs:p-3 rounded text-xs overflow-auto max-h-32 border border-blue-200/50 dark:border-blue-800/30 whitespace-pre-wrap break-words cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" onClick={handleCopy}>
        {commands}
      </pre>
    </div>
  );
}

/**
 * Компонент для инлайн кода с копированием
 */
function InlineCode({ children }: { children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const text = String(children).replace(/^\//, '');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <code
      className={`px-1.5 py-0.5 rounded text-xs sm:text-sm font-mono cursor-pointer transition-colors inline-block ${
        copied 
          ? 'bg-green-500 text-white' 
          : 'bg-muted text-accent-foreground hover:bg-muted/80'
      }`}
      onClick={handleCopy}
      title="Нажмите для копирования"
    >
      {copied ? '✓ Скопировано' : children}
    </code>
  );
}

/**
 * Пользовательские компоненты для рендеринга Markdown
 */
const markdownComponents: Components = {
  h1: ({ node, ...props }) => (
    <h1 className="text-2xl sm:text-3xl font-bold text-foreground mt-6 mb-4" {...props} />
  ),
  h2: ({ node, ...props }) => (
    <h2 className="text-xl sm:text-2xl font-bold text-foreground mt-5 mb-3" {...props} />
  ),
  h3: ({ node, ...props }) => (
    <h3 className="text-lg sm:text-xl font-medium text-foreground mt-4 mb-2" {...props} />
  ),
  p: ({ node, ...props }) => (
    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-3 last:mb-0" {...props} />
  ),
  ul: ({ node, children, ...props }) => (
    <ul className="list-disc space-y-1 mb-3 text-sm sm:text-base text-muted-foreground" {...props}>
      {children}
    </ul>
  ),
  ol: ({ node, children, ...props }) => (
    <ol className="list-decimal space-y-1 mb-3 text-sm sm:text-base text-muted-foreground" {...props}>
      {children}
    </ol>
  ),
  li: ({ node, children, ...props }) => (
    <li className="leading-relaxed" {...props}>
      {children}
    </li>
  ),
  code: ({ node, inline, className, children, ...props }: any) => {
    return inline ? (
      <InlineCode>{children}</InlineCode>
    ) : (
      <pre className="bg-muted/50 dark:bg-muted/20 rounded-lg p-3 sm:p-4 overflow-x-auto mb-4" {...props}>
        <code className="text-xs sm:text-sm font-mono text-accent-foreground block" {...props}>
          {children}
        </code>
      </pre>
    );
  },
  blockquote: ({ node, ...props }) => (
    <blockquote className="border-l-4 border-primary pl-4 py-2 my-4 text-muted-foreground italic" {...props} />
  ),
  hr: ({ node, ...props }) => (
    <hr className="border-border my-6" {...props} />
  ),
  a: ({ node, ...props }) => (
    <a className="text-primary hover:underline font-medium text-xs sm:text-sm break-all" {...props} />
  ),
  strong: ({ node, ...props }) => (
    <strong className="font-semibold text-foreground" {...props} />
  ),
  table: ({ node, ...props }) => (
    <div className="overflow-x-auto my-4">
      <table className="w-full border-collapse text-sm sm:text-base" {...props} />
    </div>
  ),
  th: ({ node, ...props }) => (
    <th className="border border-border bg-muted/50 px-3 py-2 text-left font-semibold text-xs sm:text-sm" {...props} />
  ),
  td: ({ node, ...props }) => (
    <td className="border border-border px-3 py-2 text-muted-foreground text-xs sm:text-sm" {...props} />
  ),
};

/**
 * Компонент для рендеринга Markdown контента
 * @param content - Markdown контент для отображения
 */
export function ReadmeRenderer({ content }: { content: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stats = parseStats(content);
  const botFatherCommands = extractBotFatherCommands(content);

  // Обрабатываем контент до рендеринга
  const processedContent = useMemo(() => {
    let result = content;

    // Заменяем секцию статистики на плейсхолдер
    if (stats && stats.length > 0) {
      result = result.replace(
        /### Статистика\s*\n([\s\S]*?)\n+(?=\n*## )/,
        (match, p1) => {
          const hasStats = /-\s*\*\*[^*]+\*\*:\s*\d+/.test(p1);
          return hasStats ? '\n<div data-replace="stats"></div>\n\n' : match;
        }
      );
    }

    // Заменяем секцию команд BotFather на плейсхолдер
    if (botFatherCommands) {
      result = result.replace(
        /<!-- BOTFATHER_COMMANDS_START -->[\s\S]*?<!-- BOTFATHER_COMMANDS_END -->/g,
        '\n<div data-replace="botfather"></div>\n'
      );
    }

    // Очищаем лишние пустые строки
    result = result.replace(/\n{4,}/g, '\n\n\n');

    return result;
  }, [content, stats, botFatherCommands]);

  // Заменяем плейсхолдеры на карточки после рендеринга
  useEffect(() => {
    if (!containerRef.current) return;

    // Заменяем плейсхолдер статистики
    const statsPlaceholder = containerRef.current.querySelector('[data-replace="stats"]');
    if (statsPlaceholder && stats && stats.length > 0) {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = '<div></div>';
      const tempDiv = wrapper.firstChild as HTMLDivElement;
      const root = createRoot(tempDiv);
      root.render(<StatsCards stats={stats} />);
      statsPlaceholder.replaceWith(tempDiv);
    }

    // Заменяем плейсхолдер команд BotFather
    const botFatherPlaceholder = containerRef.current.querySelector('[data-replace="botfather"]');
    if (botFatherPlaceholder && botFatherCommands) {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = '<div></div>';
      const tempDiv = wrapper.firstChild as HTMLDivElement;
      const root = createRoot(tempDiv);
      root.render(<BotFatherCard commands={botFatherCommands} />);
      botFatherPlaceholder.replaceWith(tempDiv);
    }

    // Добавляем обработчик клика для всех pre элементов (для копирования кода)
    const handlePreClick = async (e: Event) => {
      const target = e.target as HTMLElement;
      const pre = target.closest('pre');
      if (pre) {
        const code = pre.querySelector('code');
        if (code) {
          const text = code.textContent || '';
          try {
            await navigator.clipboard.writeText(text);
            // Показываем временную подсказку
            const tooltip = document.createElement('div');
            tooltip.textContent = '✓ Скопировано';
            tooltip.className = 'absolute top-2 right-2 px-2 py-1 rounded text-xs bg-green-500 text-white';
            pre.style.position = 'relative';
            pre.appendChild(tooltip);
            setTimeout(() => tooltip.remove(), 2000);
          } catch (err) {
            console.error('Failed to copy:', err);
          }
        }
      }
    };

    containerRef.current.addEventListener('click', handlePreClick);
    return () => {
      containerRef.current?.removeEventListener('click', handlePreClick);
    };
  }, [stats, botFatherCommands]);

  return (
    <div ref={containerRef} className="readme-content max-w-none">
      <style>{`
        .readme-content h2 {
          font-weight: 700 !important;
          font-size: 1.5rem !important;
        }
        .readme-content ol > li,
        .readme-content ul > li {
          display: list-item !important;
        }
        .readme-content ol > li > p:first-child,
        .readme-content ul > li > p:first-child {
          display: inline !important;
          margin-bottom: 0 !important;
        }
        .readme-content ol > li > p:not(:first-child),
        .readme-content ul > li > p:not(:first-child) {
          margin-top: 0.5rem !important;
        }
        .readme-content ul > li > code,
        .readme-content ol > li > code {
          display: inline !important;
          margin: 0 0.25rem 0 0 !important;
        }
        .readme-content ul > li > p > code,
        .readme-content ol > li > p > code {
          display: inline !important;
          white-space: nowrap !important;
        }
        .readme-content ul > li > pre,
        .readme-content ol > li > pre {
          display: inline !important;
          margin: 0 0.25rem 0 0 !important;
          padding: 0.1rem 0.4rem !important;
          background: transparent !important;
          border: none !important;
        }
        .readme-content ul > li > pre > code,
        .readme-content ol > li > pre > code {
          display: inline !important;
          padding: 0 !important;
          background: transparent !important;
        }
        .readme-content p > code {
          display: inline !important;
          white-space: nowrap !important;
        }
        .readme-content p {
          display: inline !important;
          white-space: normal !important;
        }
        .readme-content li > p {
          display: inline !important;
        }
        .readme-content li > p > pre {
          display: inline !important;
          margin: 0 0.25rem !important;
          padding: 0.1rem 0.4rem !important;
          background: transparent !important;
          border: none !important;
          overflow: visible !important;
          max-height: none !important;
        }
        .readme-content li > p > pre,
        .readme-content li > p > pre > code {
          margin-bottom: 0 !important;
        }
        .readme-content li > p > pre > code {
          display: inline !important;
        }
        .readme-content li > p,
        .readme-content li > p > * {
          margin-bottom: 0 !important;
        }
        .readme-content .mb-3,
        .readme-content .mb-4 {
          margin-bottom: 0 !important;
        }
        .readme-content .block {
          display: inline !important;
        }
        .readme-content ul > li,
        .readme-content ol > li {
          display: list-item !important;
        }
        .readme-content ul > li > *,
        .readme-content ol > li > * {
          display: inline !important;
        }
        .readme-content pre {
          cursor: pointer !important;
        }
        .readme-content pre:hover {
          background-color: rgba(128, 128, 128, 0.1) !important;
        }
      `}</style>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={markdownComponents}>
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
