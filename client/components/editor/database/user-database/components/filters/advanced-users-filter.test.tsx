/** @fileoverview Проверки встроенного раскрытия, применения и сброса дополнительных фильтров. */
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { AdvancedUsersFilter } from './advanced-users-filter';
import { UserDirectoryControls, useDirectoryControls } from '../../content/user-directory-controls';
afterEach(cleanup);
/** Показывает применённые условия для проверки реального провайдера. */
function AppliedFilters() { return <output data-testid="applied">{JSON.stringify(useDirectoryControls()?.advanced)}</output>; }
/** Корректные поля применяются автоматически, а сброс снимает ограничения. */
it('автоматически применяет диапазон с нулём без кнопки подтверждения', async () => {
  render(<UserDirectoryControls><AdvancedUsersFilter tokenId={null} /><AppliedFilters /></UserDirectoryControls>);
  fireEvent.click(screen.getByRole('button', { name: 'Ещё фильтры' }));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(screen.getByRole('button', { name: 'Дата последней активности' })).toBeTruthy();
  expect(screen.queryByRole('combobox', { name: 'Последняя активность' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Входящие сообщения' }));
  fireEvent.change(screen.getByLabelText('Входящие сообщения: до'), { target: { value: '0' } });
  fireEvent.keyDown(screen.getByLabelText('Входящие сообщения: до'), { key: 'Escape' });
  expect(screen.queryByRole('button', { name: 'Применить' })).toBeNull();
  await waitFor(() => expect(JSON.parse(screen.getByTestId('applied').textContent!)).toEqual({ messagesMax: '0' }));
  fireEvent.click(screen.getByRole('button', { name: 'Сбросить дополнительные' }));
  expect(screen.getByTestId('applied').textContent).toBe('{}');
});
/** Ошибочный диапазон остаётся в форме, не отправляясь в список. */
it('не применяет обратные диапазоны и отключает число ботов для одного бота', () => {
  render(<UserDirectoryControls><AdvancedUsersFilter tokenId={16} /><AppliedFilters /></UserDirectoryControls>);
  fireEvent.click(screen.getByRole('button', { name: 'Ещё фильтры' }));
  expect(screen.getByRole('combobox', { name: 'Количество ботов' }).hasAttribute('disabled')).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Нажатия кнопок' }));
  fireEvent.change(screen.getByLabelText('Нажатия кнопок: от'), { target: { value: '10' } });
  fireEvent.change(screen.getByLabelText('Нажатия кнопок: до'), { target: { value: '2' } });
  fireEvent.keyDown(screen.getByLabelText('Нажатия кнопок: до'), { key: 'Escape' });
  expect(screen.getByRole('alert').textContent).toContain('Начало диапазона больше конца');
  expect(screen.getByTestId('applied').textContent).toBe('{}');
});

/** Имитирует основной выбор языка и общий сброс вне раскрытых дополнительных полей. */
function ExternalFilters() {
  const controls = useDirectoryControls();
  return <><button onClick={() => controls?.setAdvanced({ ...controls.advanced, language: 'ru' })}>Выбрать русский снаружи</button>
    <button onClick={() => controls?.setAdvanced({})}>Сбросить всё снаружи</button></>;
}
/** Основной язык сохраняется даже после ожидания автоприменения и внешнего сброса. */
it('не перезаписывает основной язык старым черновиком и синхронизирует внешний сброс', async () => {
  render(<UserDirectoryControls><AdvancedUsersFilter tokenId={null} hideLanguage /><ExternalFilters /><AppliedFilters /></UserDirectoryControls>);
  fireEvent.click(screen.getByRole('button', { name: 'Ещё фильтры' }));
  expect(screen.queryByRole('combobox', { name: 'Язык Telegram' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Выбрать русский снаружи' }));
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 350)); });
  expect(JSON.parse(screen.getByTestId('applied').textContent!)).toEqual({ language: 'ru' });
  fireEvent.click(screen.getByRole('button', { name: 'Сбросить всё снаружи' }));
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 350)); });
  expect(screen.getByTestId('applied').textContent).toBe('{}');
});
/** Внешнее обновление одного поля не уничтожает диапазон, введённый до окончания задержки. */
it('сохраняет текущий ввод диапазона при изменении языка в основных фильтрах', async () => {
  render(<UserDirectoryControls><AdvancedUsersFilter tokenId={null} hideLanguage /><ExternalFilters /><AppliedFilters /></UserDirectoryControls>);
  fireEvent.click(screen.getByRole('button', { name: 'Ещё фильтры' }));
  fireEvent.click(screen.getByRole('button', { name: 'Входящие сообщения' }));
  fireEvent.change(screen.getByLabelText('Входящие сообщения: от'), { target: { value: '3' } });
  fireEvent.keyDown(screen.getByLabelText('Входящие сообщения: от'), { key: 'Escape' });
  fireEvent.click(screen.getByRole('button', { name: 'Выбрать русский снаружи' }));
  await waitFor(() => expect(JSON.parse(screen.getByTestId('applied').textContent!)).toEqual({ messagesMin: '3', language: 'ru' }));
});

/** Сброс дополнительных диапазонов не снимает основной язык диалогов. */
it('сохраняет основной язык при сбросе только дополнительных фильтров', async () => {
  render(<UserDirectoryControls><AdvancedUsersFilter tokenId={null} hideLanguage /><ExternalFilters /><AppliedFilters /></UserDirectoryControls>);
  fireEvent.click(screen.getByRole('button', { name: 'Выбрать русский снаружи' }));
  fireEvent.click(screen.getByRole('button', { name: 'Ещё фильтры' }));
  fireEvent.click(screen.getByRole('button', { name: 'Входящие сообщения' }));
  fireEvent.change(screen.getByLabelText('Входящие сообщения: от'), { target: { value: '3' } });
  fireEvent.keyDown(screen.getByLabelText('Входящие сообщения: от'), { key: 'Escape' });
  await waitFor(() => expect(JSON.parse(screen.getByTestId('applied').textContent!)).toEqual({ language: 'ru', messagesMin: '3' }));
  fireEvent.click(screen.getByRole('button', { name: 'Сбросить дополнительные' }));
  expect(JSON.parse(screen.getByTestId('applied').textContent!)).toEqual({ language: 'ru' });
});
