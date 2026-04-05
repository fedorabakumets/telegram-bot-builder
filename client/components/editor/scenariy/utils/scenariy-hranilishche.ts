/**
 * @fileoverview Вся логика работы с localStorage для хранения ID сценариев пользователя
 * @module client/components/editor/scenariy/utils/scenariy-hranilishche
 */

const KLYUCH_MOIKH_STSENARIEV = 'myTemplateIds';
const KLYUCH_VYBRANOGO_STSENARIYA = 'selectedTemplate';

/**
 * Читает список ID сценариев из localStorage
 * @returns множество числовых ID сценариев
 */
export function poluchitIdMoikhStsenariev(): Set<number> {
  const raw = localStorage.getItem(KLYUCH_MOIKH_STSENARIEV) ?? '';
  const ids = raw.split(',').filter(Boolean).map(Number).filter(Number.isFinite);
  return new Set(ids);
}

/**
 * Добавляет ID сценария в список "моих" в localStorage
 * @param id - числовой идентификатор сценария
 */
export function dobavitIdStsenariya(id: number): void {
  const ids = poluchitIdMoikhStsenariev();
  ids.add(id);
  localStorage.setItem(KLYUCH_MOIKH_STSENARIEV, Array.from(ids).join(','));
}

/**
 * Удаляет список ID сценариев гостя из localStorage
 * Вызывается при авторизации пользователя
 */
export function ochistItIdStsenarievGostya(): void {
  localStorage.removeItem(KLYUCH_MOIKH_STSENARIEV);
}

/**
 * Сохраняет выбранный сценарий в localStorage для передачи в редактор
 * @param template - объект сценария для сохранения
 */
export function sokhranitVybrannyyStsenary(template: object): void {
  localStorage.setItem(KLYUCH_VYBRANOGO_STSENARIYA, JSON.stringify(template));
}

/**
 * Возвращает строку с ID сценариев для передачи в API-запрос
 * Используется только для гостей (неавторизованных пользователей)
 * @returns строка вида "1,2,3" или пустая строка
 */
export function poluchitIdsParamDlyaGostya(): string {
  const raw = localStorage.getItem(KLYUCH_MOIKH_STSENARIEV);
  if (!raw || raw.length === 0) return '';
  return raw;
}
