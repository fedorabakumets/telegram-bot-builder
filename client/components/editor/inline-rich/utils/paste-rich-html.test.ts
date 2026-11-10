/** @fileoverview Проверка безопасной вставки буфера, выделения и позиции курсора. */
import { afterEach, describe, expect, it } from 'vitest';
import { pasteRichHtml } from './paste-rich-html';

/**
 * Создаёт редактор и выделяет среднее слово для замены буфером.
 * @returns Редактор с активным выделением
 */
function editorWithSelection(): HTMLDivElement {
  const editor = document.createElement('div');
  editor.textContent = 'До заменить после';
  document.body.append(editor);
  const range = document.createRange();
  range.setStart(editor.firstChild!, 3);
  range.setEnd(editor.firstChild!, 11);
  const selection = window.getSelection()!;
  selection.removeAllRanges();
  selection.addRange(range);
  return editor;
}

afterEach(() => { document.body.replaceChildren(); window.getSelection()?.removeAllRanges(); });

describe('безопасная вставка буфера', () => {
  it('сохраняет жирный текст, удаляет обработчики и ставит курсор после вставки', () => {
    const editor = editorWithSelection();
    const result = pasteRichHtml(editor, {
      getData: (type) => type === 'text/html' ? '<b onclick="evil">Новый</b><img src=x onerror="evil">' : '',
    });
    expect(result).toBe(true);
    expect(editor.innerHTML).toBe('До <b>Новый</b> после');
    const range = window.getSelection()!.getRangeAt(0);
    expect(range.collapsed).toBe(true);
    expect(range.startContainer).toBe(editor);
    expect(range.startOffset).toBe(2);
  });

  it('вставляет обычный текст буквально и сохраняет переносы', () => {
    const editor = editorWithSelection();
    pasteRichHtml(editor, { getData: (type) => type === 'text/plain' ? '<img>\nВторая' : '' });
    expect(editor.querySelector('img')).toBeNull();
    expect(editor.innerHTML).toBe('До &lt;img&gt;<br>Вторая после');
  });

  it('не изменяет документ при выделении за пределами редактора', () => {
    editorWithSelection();
    const other = document.createElement('div');
    expect(pasteRichHtml(other, { getData: () => 'Текст' })).toBe(false);
    expect(other.innerHTML).toBe('');
  });

  it('сохраняет несколько блочных строк форматированного буфера', () => {
    const editor = editorWithSelection();
    pasteRichHtml(editor, { getData: (type) => type === 'text/html' ? '<div>Первая</div><div>Вторая</div>' : '' });
    expect(editor.querySelectorAll('div')).toHaveLength(2);
    expect(editor.innerHTML).toBe('До <div>Первая</div><div>Вторая</div> после');
  });
});
