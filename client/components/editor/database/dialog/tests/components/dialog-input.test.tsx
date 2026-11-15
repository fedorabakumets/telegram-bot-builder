/**
 * @fileoverview Проверка меню вложений и отправки сообщений компактного редактора диалога.
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DialogInput } from '../../components/dialog-input';

/** Подменяет тяжёлый редактор управляемым полем, сохраняя контракт ввода. */
/** Загрузка из буфера проверяется отдельно от панели сообщения. */
vi.mock('@/components/editor/properties/hooks/use-media', () => ({ useUploadMedia: () => ({ mutateAsync: vi.fn() }) }));
vi.mock('@/components/editor/inline-rich/compact-inline-editor', () => ({
  CompactInlineEditor: ({ value, onChange, placeholder }: any) => (
    <input aria-label="Текст сообщения" value={value} placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)} />
  ),
}));
/** Подменяет загрузку файла локальным выбором без сетевых запросов. */
vi.mock('@/components/editor/properties/media/multi-media-selector', () => ({
  MultiMediaSelector: ({ onChange }: any) => (
    <button onClick={() => onChange(['/uploads/1/photo.jpg'])}>Выбрать тестовый файл</button>
  ),
}));
/** Подменяет проверку Telegram file_id локальным значением. */
vi.mock('@/components/editor/properties/media/file-id-input', () => ({
  FileIdInput: ({ onAdd }: any) => (
    <button onClick={() => onAdd('test-file-id')}>Добавить тестовый file_id</button>
  ),
}));
/** Подменяет редактор кнопок изменением существующего контракта состояния. */
vi.mock('../../components/dialog-buttons-editor', () => ({
  DialogButtonsEditor: ({ onChange, onButtonsPerRowChange }: any) => (
    <button onClick={() => { onChange([{ id: 'link', text: 'Сайт', url: 'https://example.com' }]);
      onButtonsPerRowChange(2); }}>Добавить тестовую кнопку</button>
  ),
}));

/** Открывает настоящее меню Radix клавиатурой. */
function openAttachments() {
  const trigger = screen.getByRole('button', { name: /^Прикрепить/ });
  trigger.focus();
  fireEvent.keyDown(trigger, { key: 'Enter', code: 'Enter' });
  return trigger;
}
/** Выбирает действие меню, не вызывая отправку сообщения. */
async function selectAttachment(name: string) {
  openAttachments();
  fireEvent.click(await screen.findByRole('menuitem', { name }));
}
/** Возвращает кнопку отправки независимо от состояния запроса. */
function sendButton() {
  return screen.getByTestId('dialog-panel-button-send');
}

afterEach(cleanup);

describe('Компактный ввод диалога', () => {
  it('открывает меню клавиатурой и возвращает фокус после Escape', async () => {
    render(<DialogInput projectId={1} isPending={false} onSend={vi.fn()} />);
    const trigger = openAttachments();
    const menu = await screen.findByRole('menu');
    expect(screen.getByRole('menuitem', { name: 'Файл' })).toBeVisible();
    expect(screen.getByRole('menuitem', { name: 'Telegram file_id' })).toBeVisible();
    expect(screen.getByRole('menuitem', { name: 'Кнопки сообщения' })).toBeVisible();
    fireEvent.keyDown(menu, { key: 'Escape', code: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('скрывает открытую панель нажатием скрепки и сохраняет вложения', async () => {
    const onSend = vi.fn();
    render(<DialogInput projectId={1} isPending={false} onSend={onSend} sendLabel="Отправить рассылку" />);
    await selectAttachment('Файл');
    fireEvent.click(screen.getByText('Выбрать тестовый файл'));
    openAttachments();
    await waitFor(() => expect(screen.queryByText('Выбрать тестовый файл')).not.toBeInTheDocument());
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(sendButton()).toBeEnabled();
    expect(onSend).not.toHaveBeenCalled();
  });

  it.each(['', '   '])('блокирует отправку пустого текста %j', (text) => {
    const onSend = vi.fn();
    render(<DialogInput projectId={1} isPending={false} onSend={onSend} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: text } });
    expect(sendButton()).toBeDisabled();
    fireEvent.click(sendButton());
    expect(onSend).not.toHaveBeenCalled();
  });

  it('передаёт текст и очищает поле после отправки', () => {
    const onSend = vi.fn();
    render(<DialogInput projectId={1} isPending={false} onSend={onSend} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '  Привет  ' } });
    fireEvent.click(sendButton());
    expect(onSend).toHaveBeenCalledExactlyOnceWith('Привет', [], [], 0);
    expect(screen.getByRole('textbox')).toHaveValue('');
  });

  it('сохраняет отправку файла без текста через меню скрепки', async () => {
    const onSend = vi.fn();
    render(<DialogInput projectId={1} isPending={false} onSend={onSend} />);
    await selectAttachment('Файл');
    expect(onSend).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Выбрать тестовый файл'));
    expect(sendButton()).toBeEnabled();
    fireEvent.click(sendButton());
    expect(onSend).toHaveBeenCalledExactlyOnceWith('', ['/uploads/1/photo.jpg'], [], 0);
    expect(screen.queryByText('Выбрать тестовый файл')).not.toBeInTheDocument();
  });

  it('сохраняет file_id при переключении к кнопкам сообщения', async () => {
    const onSend = vi.fn();
    render(<DialogInput projectId={1} isPending={false} onSend={onSend} />);
    await selectAttachment('Telegram file_id');
    fireEvent.click(screen.getByText('Добавить тестовый file_id'));
    await selectAttachment('Кнопки сообщения');
    fireEvent.click(screen.getByText('Добавить тестовую кнопку'));
    expect(onSend).not.toHaveBeenCalled();
    fireEvent.click(sendButton());
    expect(onSend).toHaveBeenCalledExactlyOnceWith('', ['test-file-id'],
      [{ id: 'link', text: 'Сайт', url: 'https://example.com' }], 2);
  });

  it('не отправляет повторно во время запроса', () => {
    const onSend = vi.fn();
    render(<DialogInput projectId={1} isPending onSend={onSend} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Привет' } });
    expect(sendButton()).toBeDisabled();
    expect(sendButton()).toHaveAttribute('aria-busy', 'true');
    fireEvent.click(sendButton());
    expect(onSend).not.toHaveBeenCalled();
  });
});
