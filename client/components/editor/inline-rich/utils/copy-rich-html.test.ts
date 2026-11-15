/** @fileoverview Регрессии копирования: форматы буфера, безопасная вставка и текстовый запасной вариант. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyRichHtml } from './copy-rich-html';
import { pasteRichHtml } from './paste-rich-html';

afterEach(() => { vi.unstubAllGlobals(); document.body.replaceChildren(); });

describe('копирование форматированного текста', () => {
  it('передаёт HTML отдельно от текста и восстанавливает оформление при вставке', async () => {
    let formats: Record<string, Blob> = {};
    vi.stubGlobal('ClipboardItem', class {
      /** Сохраняет форматы, переданные браузеру. */
      constructor(data: Record<string, Blob>) { formats = data; }
    });
    vi.stubGlobal('navigator', { clipboard: { write: vi.fn().mockResolvedValue(undefined) } });
    const source = '<b onclick="evil()">Заголовок</b><br><a href="https://example.com">Ссылка</a>';
    expect(await copyRichHtml(source)).toBe(true);
    /** Читает содержимое Blob в среде jsdom. */
    const read = (blob: Blob): Promise<string> => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.readAsText(blob);
    });
    const html = await read(formats['text/html']);
    expect(await read(formats['text/plain'])).toBe('Заголовок\nСсылка');
    expect(html).not.toContain('onclick');
    const editor = document.createElement('div');
    document.body.append(editor);
    const selection = window.getSelection()!;
    const range = document.createRange();
    range.selectNodeContents(editor);
    selection.removeAllRanges();
    selection.addRange(range);
    expect(pasteRichHtml(editor, { getData: (type) => type === 'text/html' ? html : '' })).toBe(true);
    expect(editor.querySelector('b')?.textContent).toBe('Заголовок');
    expect(editor.querySelector('a')?.getAttribute('href')).toBe('https://example.com');
    expect(editor.querySelector('br')).not.toBeNull();
  });

  it('при недоступном богатом буфере копирует читаемый текст, а не HTML', async () => {
    vi.stubGlobal('ClipboardItem', undefined);
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    expect(await copyRichHtml('<div>Первая</div><div><i>Вторая</i></div>')).toBe(false);
    expect(writeText).toHaveBeenCalledWith('Первая\nВторая');
  });

  it('после отказа богатого буфера использует текстовый и сохраняет явный перенос', async () => {
    vi.stubGlobal('ClipboardItem', class {});
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { write: vi.fn().mockRejectedValue(new Error('Запрет')), writeText } });
    expect(await copyRichHtml('<b>Текст</b><br>')).toBe(false);
    expect(writeText).toHaveBeenCalledWith('Текст\n');
  });
});
