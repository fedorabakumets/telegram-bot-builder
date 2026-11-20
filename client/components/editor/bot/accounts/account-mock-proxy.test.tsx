/** @fileoverview Проверка локальной формы прокси для демонстрационного аккаунта. */

import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { expect, it, vi } from 'vitest';
import { AccountMockProxy } from './account-mock-proxy';
import type { MockAccountProxy } from './mock-account-types';

/**
 * Связывает форму с состоянием так же, как панель демонстрационного аккаунта.
 * @returns Управляемая форма прокси.
 */
function ProxyForm() {
  const [proxy, setProxy] = useState<MockAccountProxy>({ enabled: false, type: 'socks5', host: '', port: '', status: 'idle' });
  return <AccountMockProxy proxy={proxy} onChange={setProxy} />;
}

it('проверяет поля без сетевого запроса и сбрасывает результат после правки', () => {
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  const view = render(<ProxyForm />);

  try {
    expect(screen.queryByLabelText('Адрес')).toBeNull();
    fireEvent.click(screen.getByRole('switch', { name: 'Использовать прокси' }));
    const address = screen.getByLabelText('Адрес');
    const port = screen.getByLabelText('Порт');
    const verify = screen.getByRole('button', { name: 'Проверить параметры' });

    fireEvent.change(address, { target: { value: 'proxy.example.test' } });
    fireEvent.change(port, { target: { value: '65536' } });
    fireEvent.click(verify);
    expect(port.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByRole('status').textContent).toContain('65535');

    fireEvent.change(port, { target: { value: '1080' } });
    expect(screen.queryByRole('status')).toBeNull();
    fireEvent.click(verify);
    expect(screen.getByRole('status').textContent).toContain('Демо-проверка пройдена');
    expect(fetch).not.toHaveBeenCalled();
  } finally {
    view.unmount();
    vi.unstubAllGlobals();
  }
});
