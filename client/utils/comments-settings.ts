/**
 * Глобальный переключатель генерации комментариев в коде бота.
 * Синхронизируется с localStorage через BotControl.
 */

let _commentsEnabled = true;

export function areCommentsEnabled(): boolean {
  return _commentsEnabled;
}

export function setCommentsEnabled(enabled: boolean): void {
  _commentsEnabled = enabled;
}
