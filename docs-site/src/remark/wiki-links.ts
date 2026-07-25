/**
 * @fileoverview Remark-плагин: WikiNest `[[path]]` → markdown-ссылки Docusaurus
 * @module docs-site/src/remark/wiki-links
 */

import {visit} from 'unist-util-visit';
import type {Root, PhrasingContent, Text} from 'mdast';
import type {Parent} from 'unist';

/** Префиксы docs, исключённые из сайта — ссылка ведёт на GitHub */
const GITHUB_ONLY_PREFIXES = ['futures/', 'roadmaps/', 'smm/', 'bots/'] as const;

const GITHUB_DOCS_BASE =
  'https://github.com/fedorabakumets/telegram-bot-builder/blob/main/docs';

/**
 * WikiNest: [[path]], [[path#якорь]], [[path|подпись]], [[path#якорь|подпись]]
 */
const WIKI_RE =
  /\[\[([^\]|#]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/g;

/**
 * Делает slug якоря в стиле GitHub / Docusaurus
 * @param heading - текст заголовка из wiki-ссылки
 * @returns slug для URL-hash
 */
function slugifyHeading(heading: string): string {
  return heading
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}\-_]/gu, '');
}

/**
 * Строит URL из wiki-пути
 * @param path - путь относительно docs/ (без .md)
 * @param hash - опциональный якорь
 * @returns абсолютный путь сайта или URL GitHub
 */
function resolveWikiUrl(path: string, hash?: string): string {
  const normalized = path.replace(/\.md$/i, '').replace(/^\/+/, '');
  const hashSuffix = hash ? `#${slugifyHeading(hash)}` : '';

  if (GITHUB_ONLY_PREFIXES.some((p) => normalized.startsWith(p))) {
    return `${GITHUB_DOCS_BASE}/${normalized}.md${hashSuffix}`;
  }

  return `/docs/${normalized}${hashSuffix}`;
}

/**
 * Подпись ссылки: явная |label или path[#hash]
 * @param path - wiki-путь
 * @param hash - якорь
 * @param label - явная подпись
 * @returns текст ссылки
 */
function linkLabel(path: string, hash?: string, label?: string): string {
  if (label?.trim()) return label.trim();
  return hash ? `${path}#${hash}` : path;
}

/**
 * Разбивает текстовый узел с [[wiki]] на text + link узлы
 * @param value - исходный текст
 * @returns массив phrasing-узлов или null, если wiki-ссылок нет
 */
function splitWikiText(value: string): PhrasingContent[] | null {
  if (!value.includes('[[')) return null;

  const parts: PhrasingContent[] = [];
  let lastIndex = 0;
  const re = new RegExp(WIKI_RE.source, 'g');
  let match: RegExpExecArray | null;

  while ((match = re.exec(value)) !== null) {
    const [full, rawPath, rawHash, rawLabel] = match;
    const path = rawPath.trim();

    // Пропуск мусора вроде [[KeyboardButton(...)]] вне code fence
    if (!path || /[(=]/.test(path)) continue;

    if (match.index > lastIndex) {
      parts.push({type: 'text', value: value.slice(lastIndex, match.index)});
    }

    const hash = rawHash?.trim();
    parts.push({
      type: 'link',
      url: resolveWikiUrl(path, hash),
      children: [{type: 'text', value: linkLabel(path, hash, rawLabel)}],
    });
    lastIndex = match.index + full.length;
  }

  if (parts.length === 0) return null;
  if (lastIndex < value.length) {
    parts.push({type: 'text', value: value.slice(lastIndex)});
  }
  return parts;
}

/**
 * Remark-плагин преобразования WikiNest-ссылок
 * @returns transformer AST
 */
export default function remarkWikiLinks() {
  return (tree: Root) => {
    visit(tree, 'text', (node: Text, index, parent: Parent | undefined) => {
      if (parent == null || index == null) return;
      // Не трогаем код и ссылки
      if (parent.type === 'link' || parent.type === 'linkReference') return;

      const parts = splitWikiText(node.value);
      if (!parts) return;

      parent.children.splice(index, 1, ...parts);
      return index + parts.length;
    });
  };
}
