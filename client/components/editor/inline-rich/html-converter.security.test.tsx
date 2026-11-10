/** @fileoverview Регрессии опасного HTML, ссылок и сохранения форматирования редактора. */
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { htmlToValue, valueToHtml } from './html-converter';
import { parseHTML } from './utils/formatting-parser';
import { safeRichUrl, sanitizeRichHtml } from './utils/safe-rich-html';

/**
 * Разбирает результат без подключения к живому DOM или загрузки ресурсов.
 * @param html - HTML редактора
 * @returns Инертное содержимое шаблона
 */
function content(html: string): DocumentFragment {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template.content;
}

describe('безопасный HTML редактора', () => {
  it.each([false, true])('сохраняет переносы contenteditable при markdown=%s', (markdown) => {
    expect(htmlToValue('Первая<div>Вторая</div><div>Третья</div>', markdown))
      .toBe('Первая\nВторая\nТретья');
  });
  it.each([false, true])('удаляет активный HTML при markdown=%s', (markdown) => {
    const result = content(valueToHtml('&lt;img src=x onerror="alert(1)"&gt;'
      + '<b onclick="alert(1)" style="color:red">Жирный</b>'
      + '<svg><a onload="alert(1)">SVG</a></svg><script>alert(1)</script>'
      + '<iframe srcdoc="опасный HTML"></iframe>', markdown));
    expect(result.querySelector('img,svg,script,iframe,[onclick],[onerror],[style]')).toBeNull();
    expect(result.querySelector('b')?.textContent).toBe('Жирный');
  });

  it('сохраняет переменные как текст и не разбивает атрибуты ссылок', () => {
    const result = content(valueToHtml('{x" onmouseover="alert(1)} '
      + '<a href="https://example.com/{path}">{name|upper}</a>', false));
    expect(result.querySelector('[onmouseover]')).toBeNull();
    expect(result.querySelector('.variable-chip')?.textContent).toBe('{x" onmouseover="alert(1)}');
    expect(result.querySelector('a')?.getAttribute('href')).toBe('https://example.com/{path}');
    expect(result.querySelector('a .variable-chip')?.textContent).toBe('{name|upper}');
  });

  it.each(['javascript:alert(1)', 'java\tscript:alert(1)', 'data:text/html,unsafe', 'vbscript:msgbox(1)'])
  ('отклоняет опасный протокол %s во всех рендерерах', (url) => {
    expect(safeRichUrl(url)).toBeNull();
    const source = `<a href="${url}">Ссылка</a>`;
    expect(content(valueToHtml(source, false)).querySelector('a[href]')).toBeNull();
    const view = render(<div>{parseHTML(source)}</div>);
    expect(view.container.querySelector('a')).toBeNull();
    view.unmount();
  });

  it('очищает созданную Markdown-ссылку и атрибуты вставленного HTML перед сохранением', () => {
    expect(content(valueToHtml('[Текст](javascript:evil)', true)).querySelector('a[href]')).toBeNull();
    const result = htmlToValue('<b onclick="evil">Текст</b><a href="javascript:evil">ссылка</a>', false);
    expect(result).not.toMatch(/onclick|javascript:/);
    expect(result).toContain('<b>Текст</b>');
  });

  it('сохраняет формат Telegram, языки кода и обычные ссылки', () => {
    const source = '<blockquote expandable><b>Жирный</b><tg-spoiler>Скрыто</tg-spoiler></blockquote>'
      + '<pre><code class="language-python">print(1)</code></pre>'
      + '<a href="tg://user?id=42">Профиль</a>\n{name|upper}';
    const result = valueToHtml(source, false);
    expect(content(result).querySelector('blockquote[expandable] b')?.textContent).toBe('Жирный');
    expect(content(result).querySelector('code.language-python')).not.toBeNull();
    expect(content(result).querySelector('a')?.getAttribute('href')).toBe('tg://user?id=42');
    expect(htmlToValue(result, false)).toContain('{name|upper}');
    expect(content(valueToHtml('*Жирный* _Курсив_ ||Скрыто||', true)).querySelector('strong')).not.toBeNull();
  });

  it('повторно проверяет ссылку после декодирования сущностей при сохранении', () => {
    const source = '<a href="java&amp;#x73;cript:evil">Текст</a>';
    const saved = htmlToValue(source, false);
    expect(saved).not.toMatch(/href=/);
    expect(content(valueToHtml(saved, false)).querySelector('a[href]')).toBeNull();
  });

  it('не превращает экранированный текст и примеры HTML в форматирование при сохранении', () => {
    expect(htmlToValue('2 &lt; 3 &amp; 4 &gt; 1', false)).toBe('2 &lt; 3 &amp; 4 &gt; 1');
    const saved = htmlToValue('<pre><code>&lt;b&gt;пример&lt;/b&gt;</code></pre>', false);
    expect(saved).toBe('<pre><code>&lt;b&gt;пример&lt;/b&gt;</code></pre>');
    const result = content(valueToHtml(saved, false));
    expect(result.querySelector('code')?.textContent).toBe('<b>пример</b>');
    expect(result.querySelector('code b')).toBeNull();
  });

  it('не сохраняет атрибуты clobbering, формы и инородные пространства имён', () => {
    const result = content(sanitizeRichHtml('<form id="document"><input name="cookie"></form>'
      + '<math><mtext>опасно</mtext></math><b id="location" name="window">Текст</b>'));
    expect(result.querySelector('form,input,math,[id],[name]')).toBeNull();
    expect(result.textContent).toBe('Текст');
  });
});
