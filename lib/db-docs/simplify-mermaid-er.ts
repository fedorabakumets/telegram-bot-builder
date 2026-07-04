/**
 * @fileoverview Упрощение Mermaid ER-диаграммы — только связи, без атрибутов таблиц
 * @module lib/db-docs/simplify-mermaid-er
 */

/**
 * Оставляет в erDiagram только строки связей (без блоков `{ ... }` с колонками).
 * Полные описания колонок — в отдельных `{table}.md`; атрибуты в ER ломают Mermaid 11.
 * @param markdown - Markdown с блоком ```mermaid erDiagram
 * @returns Markdown с упрощённой диаграммой
 */
export function simplifyMermaidErInMarkdown(markdown: string): string {
  return markdown.replace(/```mermaid\s*\n(erDiagram[\s\S]*?)```/g, (_match, block: string) => {
    const lines = block.split("\n");
    const kept = lines.filter((line) => {
      const trimmed = line.trim();
      if (trimmed === "erDiagram") return true;
      return /--/.test(trimmed) && /:\s/.test(trimmed);
    });
    return "```mermaid\n" + kept.join("\n") + "\n```";
  });
}

/**
 * Извлекает и упрощает Mermaid ER из markdown (только связи).
 * @param markdown - Исходный markdown
 * @returns Текст диаграммы без обёртки code fence или null
 */
export function extractSimplifiedErDiagram(markdown: string): string | null {
  const match = markdown.match(/```mermaid\s*\n(erDiagram[\s\S]*?)```/);
  if (!match?.[1]) return null;
  const simplified = simplifyMermaidErInMarkdown("```mermaid\n" + match[1] + "\n```");
  const inner = simplified.match(/```mermaid\s*\n([\s\S]*?)```/);
  return inner?.[1]?.trim() ?? null;
}
