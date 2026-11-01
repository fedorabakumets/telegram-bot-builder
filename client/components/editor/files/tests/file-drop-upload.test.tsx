/** @fileoverview Проверки загрузки перетаскиванием: файлы, вложенные области, отмена и блокировка. */
import { createRef } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FileDropUpload } from '../panel/file-drop-upload';

afterEach(cleanup);

/**
 * Создаёт панель и обработчик без запросов к серверу.
 * @param disabled - Заблокирована ли загрузка
 * @returns Панель, вложенный элемент и обработчик загрузки
 */
function setup(disabled = false) {
  const inputRef = createRef<HTMLInputElement>();
  const onFiles = vi.fn();
  render(<div data-testid="file-storage-panel"><input ref={inputRef} /><span data-testid="child">Файлы</span>
    <FileDropUpload inputRef={inputRef} onFiles={onFiles} disabled={disabled} />
  </div>);
  return { panel: screen.getByTestId('file-storage-panel'), child: screen.getByTestId('child'), onFiles };
}

describe('Перетаскивание файлов в панель', () => {
  it('разрешает внешний перенос, раскрывающий тип файла только при сбросе', () => {
    const { panel, onFiles } = setup();
    const dataTransfer = { types: [], files: [], effectAllowed: 'uninitialized', dropEffect: 'none' };
    fireEvent.dragEnter(panel, { dataTransfer });
    expect(screen.queryByRole('status')).not.toBeNull();
    expect(fireEvent.dragOver(panel, { dataTransfer })).toBe(false);
    const file = new File(['image'], 'telegram.png');
    fireEvent.drop(panel, { dataTransfer: { ...dataTransfer, files: [file] } });
    expect(onFiles).toHaveBeenCalledWith([file]);
  });
  it('принимает файл из items без FileList и маркера Files', () => {
    const { panel, onFiles } = setup();
    const file = new File(['image'], 'image.png', { type: 'image/png' });
    fireEvent.drop(panel, { dataTransfer: { types: [], files: [], items: [{ kind: 'file', type: 'image/png', getAsFile: () => file }] } });
    expect(onFiles).toHaveBeenCalledWith([file]);
  });
  it('сохраняет разрешённый источником режим переноса', () => {
    const { panel } = setup();
    const dataTransfer = { types: ['Files'], effectAllowed: 'move', dropEffect: 'none' };
    fireEvent.dragOver(panel, { dataTransfer });
    expect(dataTransfer.dropEffect).toBe('move');
  });
  it('передаёт все файлы общей загрузке и убирает подсказку', () => {
    const { panel, onFiles } = setup();
    const files = [new File(['a'], 'a.txt'), new File(['b'], 'b.txt')];
    const dataTransfer = { types: ['Files'], files };
    fireEvent.dragEnter(panel, { dataTransfer });
    expect(screen.getByRole('status').textContent).toContain('Отпустите файлы');
    fireEvent.drop(panel, { dataTransfer });
    expect(onFiles).toHaveBeenCalledTimes(1);
    expect(onFiles).toHaveBeenCalledWith(files);
    expect(screen.queryByRole('status')).toBeNull();
  });
  it('не мигает при входе во вложенные элементы', () => {
    const { panel, child } = setup();
    const dataTransfer = { types: ['Files'] };
    fireEvent.dragEnter(panel, { dataTransfer });
    fireEvent.dragEnter(child, { dataTransfer });
    fireEvent.dragLeave(child, { dataTransfer });
    expect(screen.queryByRole('status')).not.toBeNull();
    fireEvent.dragLeave(panel, { dataTransfer });
    expect(screen.queryByRole('status')).toBeNull();
  });
  it('не перехватывает текст и ссылки', () => {
    const { panel, onFiles } = setup();
    const dataTransfer = { types: ['text/plain'], files: [], getData: () => 'Обычный текст' };
    fireEvent.dragEnter(panel, { dataTransfer });
    fireEvent.drop(panel, { dataTransfer });
    expect(screen.queryByRole('status')).toBeNull();
    expect(onFiles).not.toHaveBeenCalled();
  });
  it('блокирует новую пачку во время загрузки', () => {
    const { panel, onFiles } = setup(true);
    const dataTransfer = { types: ['Files'], files: [new File(['a'], 'a.txt')] };
    fireEvent.dragEnter(panel, { dataTransfer });
    expect(screen.getByRole('status').textContent).toContain('Дождитесь');
    fireEvent.drop(panel, { dataTransfer });
    expect(onFiles).not.toHaveBeenCalled();
  });
  it('снимает подсветку при отмене переноса', () => {
    const { panel, onFiles } = setup();
    fireEvent.dragEnter(panel, { dataTransfer: { types: ['Files'] } });
    fireEvent.dragEnd(window);
    expect(screen.queryByRole('status')).toBeNull();
    expect(onFiles).not.toHaveBeenCalled();
  });
});
