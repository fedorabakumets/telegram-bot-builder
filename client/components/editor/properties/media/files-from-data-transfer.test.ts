/**
 * @fileoverview Разбор DataTransfer при перетаскивании файла или ссылки.
 * @module components/editor/properties/media/files-from-data-transfer.test
 */

import { describe, it, expect } from 'vitest';
import { filesFromDataTransfer, httpUrlsFromDataTransfer } from './files-from-data-transfer';

describe('filesFromDataTransfer', () => {
  it('берёт FileList', () => {
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    const dt = { files: [file], items: [] } as unknown as DataTransfer;
    expect(filesFromDataTransfer(dt).map((f) => f.name)).toEqual(['a.png']);
  });

  it('пустой DataTransfer даёт пустой список', () => {
    expect(filesFromDataTransfer(null)).toEqual([]);
  });

  it('берёт файл из items, если FileList пуст', () => {
    const file = new File(['y'], 'b.jpg', { type: 'image/jpeg' });
    const dt = {
      files: [],
      items: [{ kind: 'file', type: 'image/jpeg', getAsFile: () => file }],
    } as unknown as DataTransfer;
    expect(filesFromDataTransfer(dt).map((f) => f.name)).toEqual(['b.jpg']);
  });

  it('не дублирует файл из FileList и items (перетаскивание из браузера)', () => {
    const listed = new File(['same'], 'pic.png', { type: 'image/png', lastModified: 1 });
    const fromItem = new File(['same'], 'pic.png', { type: 'image/png', lastModified: 99 });
    const dt = {
      files: [listed],
      items: [{ kind: 'file', type: 'image/png', getAsFile: () => fromItem }],
    } as unknown as DataTransfer;
    expect(filesFromDataTransfer(dt)).toHaveLength(1);
  });

  it('пропускает пустой файл и берёт items', () => {
    const empty = new File([], 'empty.png', { type: 'image/png' });
    const real = new File(['y'], 'ok.png', { type: 'image/png' });
    const dt = {
      files: [empty],
      items: [{ kind: 'file', type: 'image/png', getAsFile: () => real }],
    } as unknown as DataTransfer;
    expect(filesFromDataTransfer(dt).map((f) => f.name)).toEqual(['ok.png']);
  });
});

describe('httpUrlsFromDataTransfer', () => {
  it('читает text/uri-list и пропускает комментарии', () => {
    const dt = {
      getData: (type: string) => (type === 'text/uri-list' ? '#note\nhttps://ex.com/a.png\n' : ''),
    } as unknown as DataTransfer;
    expect(httpUrlsFromDataTransfer(dt)).toEqual(['https://ex.com/a.png']);
  });

  it('берёт text/plain если uri-list пуст', () => {
    const dt = {
      getData: (type: string) => (type === 'text/plain' ? 'https://ex.com/b.jpg' : ''),
    } as unknown as DataTransfer;
    expect(httpUrlsFromDataTransfer(dt)).toEqual(['https://ex.com/b.jpg']);
  });

  it('убирает повтор URL в uri-list', () => {
    const dt = {
      getData: (type: string) =>
        type === 'text/uri-list' ? 'https://ex.com/a.png\nhttps://ex.com/a.png\n' : '',
    } as unknown as DataTransfer;
    expect(httpUrlsFromDataTransfer(dt)).toEqual(['https://ex.com/a.png']);
  });
});
