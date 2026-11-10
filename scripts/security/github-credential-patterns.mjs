/** @fileoverview Поиск встроенных GitHub-токенов без вывода их значений. */

/** Шаблон классических и детализированных токенов GitHub. */
export const githubCredentialPattern = '(gh[pousr]_[A-Za-z0-9_]{30,}|github_pat_[A-Za-z0-9_]{30,})';

/**
 * Возвращает номера строк с токенами, не возвращая сами секреты.
 * @param {string} source - Проверяемое содержимое файла.
 * @returns {number[]} Номера строк, начиная с единицы.
 */
export function credentialLines(source) {
  const pattern = new RegExp(githubCredentialPattern);
  return source.split(/\r?\n/).flatMap((line, index) => pattern.test(line) ? [index + 1] : []);
}
