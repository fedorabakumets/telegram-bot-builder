/** @fileoverview Проверки стартовой позиции и границ перемещения питомца. */
import { describe, expect, it } from 'vitest';
import { clampPetPosition, initialPetPosition } from './start-pet-position';

describe('Расположение питомца', () => {
  it.each([
    { width: 320, height: 686 },
    { width: 1440, height: 900 },
  ])('появляется справа от центра в верхней половине окна $width × $height', viewport => {
    const { x, y } = initialPetPosition(viewport);
    expect(x).toBeGreaterThan(viewport.width / 2);
    expect(x + 64).toBeLessThanOrEqual(viewport.width);
    expect(y).toBeGreaterThanOrEqual(0);
    expect(y + 64).toBeLessThan(viewport.height / 2);
  });

  it('удерживает область захвата внутри каждого края окна', () => {
    const viewport = { width: 320, height: 686 };
    expect(clampPetPosition({ x: -20, y: 900 }, viewport)).toEqual({ x: 0, y: 622 });
    expect(clampPetPosition({ x: 500, y: -20 }, viewport)).toEqual({ x: 256, y: 0 });
    expect(clampPetPosition({ x: 25, y: 110 }, viewport)).toEqual({ x: 25, y: 110 });
  });

  it('не создаёт отрицательных координат при окне меньше питомца', () => {
    expect(initialPetPosition({ width: 40, height: 32 })).toEqual({ x: 0, y: 0 });
  });
});
