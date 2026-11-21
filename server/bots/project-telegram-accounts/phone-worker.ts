/** @fileoverview Изолированный процесс авторизации аккаунта через существующий скрипт Telethon. */
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { appPath } from '../../utils/app-root';

/** Ответ процесса авторизации. Секрет передаётся только серверному хранилищу. */
export interface ProjectPhoneReply {
  /** Шаг выполнен успешно. */
  ok: boolean;
  /** Код ошибки процесса. */
  error?: string;
  /** Требуется пароль второго фактора. */
  needs_2fa?: boolean;
  /** Авторизованная строка сессии. */
  session_string?: string;
  /** Идентификатор Telegram. */
  telegram_user_id?: string;
  /** Отображаемое имя пользователя. */
  telegram_name?: string;
  /** Имя пользователя в Telegram. */
  telegram_username?: string;
}

/**
 * Запускает выделенный процесс, не передавая секреты в аргументах командной строки.
 * @returns Интерфейс установки шага и завершения процесса.
 */
export function createProjectPhoneWorker() {
  const executable = process.env.PYTHON_PATH || (process.platform === 'win32' ? 'python' : 'python3');
  const child = spawn(executable, ['-X', 'utf8', '-u', appPath('server', 'bots', 'userbotAuth.py')], {
    stdio: ['pipe', 'pipe', 'ignore'], windowsHide: true,
  });
  const lines = createInterface({ input: child.stdout });
  let pending: ((reply: ProjectPhoneReply) => void) | undefined;
  let ended = false;

  /** Завершает ожидающий шаг и закрывает выделенный процесс. */
  const close = () => {
    if (ended) return;
    ended = true;
    pending?.({ ok: false, error: 'process_exit' });
    lines.close();
    child.kill();
  };
  child.once('close', close);
  child.once('error', close);
  child.stdin.on('error', close);
  lines.on('line', line => {
    try { pending?.(JSON.parse(line) as ProjectPhoneReply); }
    catch { close(); }
  });

  /**
   * Передаёт ровно одну команду и ограничивает время ожидания ответа.
   * @param action - Имя операции авторизации.
   * @param data - Данные текущего шага.
   * @returns Ответ Telethon или безопасный код ошибки.
   */
  const request = (action: string, data: Record<string, unknown>): Promise<ProjectPhoneReply> => {
    if (ended || pending) return Promise.resolve({ ok: false, error: 'process_exit' });
    return new Promise(resolve => {
      const timer = setTimeout(() => {
        pending?.({ ok: false, error: 'timeout' });
        close();
      }, 35_000);
      timer.unref();
      pending = reply => {
        clearTimeout(timer);
        pending = undefined;
        resolve(reply);
      };
      child.stdin.write(`${JSON.stringify({ action, data })}\n`);
    });
  };
  return { close, request };
}
