/** @fileoverview Вставка очищенного содержимого буфера без промежуточного небезопасного DOM. */
import { sanitizeRichHtml } from './safe-rich-html';

/**
 * Вставляет форматированный буфер либо обычный текст в текущее выделение редактора.
 * @param editor - Редактор, которому должно принадлежать выделение
 * @param clipboard - Доступ к форматам буфера обмена
 * @returns Удалось ли вставить содержимое
 */
export function pasteRichHtml(editor: HTMLElement, clipboard: Pick<DataTransfer, 'getData'>): boolean {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return false;
  const range = selection.getRangeAt(0);
  if (!editor.contains(range.commonAncestorContainer)) return false;
  const template = document.createElement('template');
  const rich = clipboard.getData('text/html');
  if (rich) template.innerHTML = sanitizeRichHtml(rich);
  else {
    const lines = clipboard.getData('text/plain').split(/\r?\n/);
    lines.forEach((line, index) => {
      if (index) template.content.append(document.createElement('br'));
      template.content.append(document.createTextNode(line));
    });
  }
  const last = template.content.lastChild;
  if (!last) return false;
  range.deleteContents();
  range.insertNode(template.content);
  range.setStartAfter(last);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
  return true;
}
