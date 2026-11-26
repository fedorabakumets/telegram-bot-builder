/** @fileoverview Расположение питомца на стартовом экране и границы его перемещения. */

interface PetPosition {
  /** Расстояние от левого края окна в пикселях. */
  x: number;
  /** Расстояние от верхнего края окна в пикселях. */
  y: number;
}

interface PetViewport {
  /** Ширина видимой области в пикселях. */
  width: number;
  /** Высота видимой области в пикселях. */
  height: number;
}

/** Сторона области захвата питомца в пикселях. */
const PET_SIZE = 64;

/**
 * Оставляет всю область захвата питомца внутри окна.
 * @param position - Желаемая позиция левого верхнего угла.
 * @param viewport - Текущий размер окна.
 * @returns Координаты внутри доступной области.
 */
export function clampPetPosition(position: PetPosition, viewport: PetViewport): PetPosition {
  return {
    x: Math.max(0, Math.min(position.x, viewport.width - PET_SIZE)),
    y: Math.max(0, Math.min(position.y, viewport.height - PET_SIZE)),
  };
}

/**
 * Размещает питомца справа от приветствия, выше плиток выбора.
 * @param viewport - Начальный размер окна.
 * @returns Позиция с учётом максимальной ширины панели и мобильных полей.
 */
export function initialPetPosition(viewport: PetViewport): PetPosition {
  const panelWidth = Math.min(704, viewport.width - 32);
  const headerInset = 16;
  return clampPetPosition({
    x: (viewport.width + panelWidth) / 2 - PET_SIZE - headerInset,
    y: Math.max(24, viewport.height / 2 - 228),
  }, viewport);
}
