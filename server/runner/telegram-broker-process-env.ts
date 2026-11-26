/** @fileoverview Минимальное окружение владельца сессий без полномочий запуска потребительских ботов. */

/**
 * Передаёт только системные пути, Redis и настройки брокера, исключая секреты API и раннера.
 * @param env - Окружение управляющего процесса исполнителя.
 * @returns Изолированное окружение Python-брокера.
 */
export function telegramBrokerProcessEnv(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const technical = new Set(['PATH', 'PATHEXT', 'SYSTEMROOT', 'WINDIR', 'COMSPEC', 'HOME', 'USERPROFILE',
    'TEMP', 'TMP', 'TMPDIR', 'LANG', 'LC_ALL', 'PYTHONIOENCODING', 'PYTHONUTF8']);
  const result: NodeJS.ProcessEnv = {};
  for (const [key, value] of Object.entries(env)) {
    if (technical.has(key.toUpperCase()) || key === 'REDIS_URL' || key.startsWith('TELETHON_BROKER_')) result[key] = value;
  }
  return { ...result, TELETHON_BROKER_STDIN_CONTROL: '1', PYTHONUNBUFFERED: '1' };
}
