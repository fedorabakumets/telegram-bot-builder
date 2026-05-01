/**
 * @fileoverview Единый парсер HTML → JSX для форматированного текста
 * @description Преобразует HTML-строку в массив JSX-элементов через DOMParser.
 * Поддерживает все теги форматирования Telegram и Markdown, включая tg-spoiler.
 * @module formatting-parser
 */

import { decodeHtmlEntities } from './html-entities';

/**
 * Ссылка на счётчик ключей JSX — избегает глобального состояния
 * при параллельных вызовах parseHTML
 */
interface KeyRef {
  /** Текущее значение счётчика */
  current: number;
}

/**
 * CSS-класс для инлайн-кода (`<code>`) — моноширинный инлайн
 */
const CODE_CLASS =
  'bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs font-mono';

/**
 * CSS-класс для блока кода (`<pre>`) — тёмный блок с зелёным текстом
 */
const PRE_CLASS =
  'block my-1.5 px-3 py-2 rounded-lg bg-slate-900 dark:bg-slate-950 border border-slate-700/60 text-emerald-400 dark:text-emerald-300 font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap break-words';

/**
 * CSS-класс для бейджа языка программирования над блоком кода
 */
const LANG_BADGE_CLASS =
  'inline-block mb-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-700/80 text-slate-300 border border-slate-600/50 select-none';

/**
 * CSS-класс для блока цитаты
 */
const BLOCKQUOTE_CLASS =
  'border-l-4 border-blue-500 pl-3 my-2 italic text-slate-600 dark:text-slate-400';

/**
 * CSS-класс для спойлера в режиме просмотра (FormattedText).
 * Имитирует Telegram-спойлер: текст размыт, при наведении — виден.
 */
const SPOILER_CLASS =
  'inline blur-sm hover:blur-none transition-[filter] duration-200 cursor-pointer bg-slate-200/60 dark:bg-slate-700/60 rounded px-0.5';

/**
 * CSS-класс для ссылки
 */
const LINK_CLASS =
  'text-blue-600 dark:text-blue-400 underline break-all';

/**
 * Рекурсивно обходит DOM-узел и создаёт JSX-элемент
 * @param node - DOM-узел для обхода
 * @param keyRef - Ссылка на счётчик ключей
 * @returns JSX-элемент или null для неподдерживаемых узлов
 */
function nodeToJsx(node: Node, keyRef: KeyRef): JSX.Element | null {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent ?? '';
    return <span key={keyRef.current++}>{text}</span>;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return null;

  const el = node as Element;
  const tag = el.tagName.toUpperCase();

  /** Рекурсивно обрабатываем дочерние узлы */
  const children = Array.from(el.childNodes)
    .map((child) => nodeToJsx(child, keyRef))
    .filter(Boolean) as JSX.Element[];

  switch (tag) {
    case 'B':
    case 'STRONG':
    case 'H3':
    case 'H4':
    case 'H5':
      return <strong key={keyRef.current++} className="font-bold">{children}</strong>;

    case 'I':
    case 'EM':
      return <em key={keyRef.current++} className="italic">{children}</em>;

    case 'U':
      return <span key={keyRef.current++} className="underline">{children}</span>;

    case 'S':
    case 'STRIKE':
    case 'DEL':
      return <span key={keyRef.current++} className="line-through">{children}</span>;

    case 'CODE':
      return <code key={keyRef.current++} className={CODE_CLASS}>{children}</code>;

    case 'PRE': {
      // Проверяем наличие дочернего <code class="language-XXX">
      const codeChild = el.querySelector('code[class*="language-"]');
      const langMatch = codeChild?.className.match(/language-(\S+)/);
      const lang = langMatch ? langMatch[1] : null;
      return (
        <div key={keyRef.current++} className="my-1.5">
          {lang && (
            <span className={LANG_BADGE_CLASS}>{lang}</span>
          )}
          <pre className={PRE_CLASS}>{children}</pre>
        </div>
      );
    }

    case 'BLOCKQUOTE':
      return (
        <blockquote key={keyRef.current++} className={BLOCKQUOTE_CLASS}>
          {children}
        </blockquote>
      );

    case 'A': {
      const href = (el as HTMLAnchorElement).getAttribute('href') ?? '#';
      return (
        <a
          key={keyRef.current++}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={LINK_CLASS}
        >
          {children}
        </a>
      );
    }

    case 'BR':
      return <br key={keyRef.current++} />;

    /** Telegram-специфичный тег спойлера: скрывает текст до наведения */
    case 'TG-SPOILER':
      return (
        <span
          key={keyRef.current++}
          className={SPOILER_CLASS}
          title="Спойлер"
        >
          {children}
        </span>
      );

    default:
      /** Для неизвестных тегов рекурсивно возвращаем дочерние элементы */
      return <>{children}</>;
  }
}

/**
 * Парсит HTML-строку через DOMParser и возвращает массив JSX-элементов
 * @param htmlText - HTML-строка для парсинга
 * @returns Массив JSX-элементов
 */
export function parseHTML(htmlText: string): JSX.Element[] {
  if (!htmlText) return [];
  const keyRef: KeyRef = { current: 0 };
  const doc = new DOMParser().parseFromString(
    `<body>${htmlText}</body>`,
    'text/html'
  );
  return Array.from(doc.body.childNodes)
    .map((node) => nodeToJsx(node, keyRef))
    .filter(Boolean) as JSX.Element[];
}

/**
 * Форматирует текст с поддержкой HTML-тегов и возвращает единый JSX-элемент
 * @param text - Текст для форматирования (может содержать HTML)
 * @returns Обёрнутый span с отформатированным содержимым
 */
export function formatText(text: string): JSX.Element {
  if (!text) return <span>{text}</span>;
  const decoded = decodeHtmlEntities(text);
  return <span>{parseHTML(decoded)}</span>;
}
