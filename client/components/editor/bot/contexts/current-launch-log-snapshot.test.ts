/**
 * @fileoverview Регрессионные проверки удаления старых запусков из живого кеша логов.
 */
import { describe, expect, it } from 'vitest';
import { replaceCurrentLaunchSnapshot } from './current-launch-log-snapshot';

/**
 * Создаёт строку с заданным временем события.
 * @param id - Идентификатор строки
 * @param time - Время в миллисекундах
 * @returns Строка тестового потока
 */
function line(id: string, time: number) {
  return { id, timestamp: new Date(time) };
}

describe('replaceCurrentLaunchSnapshot', () => {
  it('удаляет прошлый запуск и сохраняет событие, поступившее во время запроса', () => {
    const current = [line('old', 100), line('current', 300), line('incoming', 501)];
    expect(replaceCurrentLaunchSnapshot(current, [line('current', 300)], 500).map(row => row.id))
      .toEqual(['current', 'incoming']);
  });

  it('пустой новый запуск очищает старый кеш без потери новых событий', () => {
    expect(replaceCurrentLaunchSnapshot([line('old', 100), line('incoming', 500)], [], 500))
      .toEqual([line('incoming', 500)]);
    expect(replaceCurrentLaunchSnapshot([line('old', 100)], [], 500)).toEqual([]);
  });

  it('не дублирует уже сохранённое событие и возвращает строки по времени', () => {
    expect(replaceCurrentLaunchSnapshot([line('same', 600)], [line('same', 600), line('first', 550)], 500))
      .toEqual([line('first', 550), line('same', 600)]);
  });
});
