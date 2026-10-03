/**
 * @fileoverview Куллинг карточек холста: вне экрана не попадают в текстуру зума
 */

/** Атрибут скрытия. React его не ставит, повторный style не сбрасывает куллинг */
export const CANVAS_CULLED_ATTR = 'data-canvas-culled';

/** Размер узла в координатах холста */
export interface CullNodeSize {
  /** Ширина */
  width: number;
  /** Высота */
  height: number;
}

/** Запись элемента, видимость которого переключаем точечно */
interface Tracked {
  /** Элемент, который прячем */
  el: HTMLElement;
  /** Уже скрыт */
  culled: boolean;
  /** Кэш ширины портала в координатах холста */
  w: number;
  /** Кэш высоты портала в координатах холста */
  h: number;
}

const nodes = new Map<string, Tracked>();
const portals: Tracked[] = [];
let sig = '';
let childCount = -1;
let hovered: HTMLElement | null = null;

/**
 * Запоминает карточку под курсором, чтобы не прятать её во время жеста.
 * @param content - Слой `[data-canvas-content]`
 */
function bindHover(content: HTMLElement): void {
  if (content.dataset.cullHoverBound) return;
  content.dataset.cullHoverBound = '1';
  content.addEventListener('pointerover', (event) => {
    const target = event.target as Element | null;
    hovered = target?.closest('[data-canvas-node-wrap], [data-canvas-portal]') as HTMLElement | null;
  });
  content.addEventListener('pointerout', (event) => {
    const next = event.relatedTarget as Node | null;
    if (!next || !content.contains(next)) hovered = null;
  });
}

/**
 * Собирает карту узлов и порталов один раз на смену набора, не на каждый кадр.
 * @param content - Слой узлов
 */
function rebuild(content: HTMLElement): void {
  nodes.clear();
  portals.length = 0;
  content.querySelectorAll<HTMLElement>('[data-canvas-node-wrap]').forEach((el) => {
    const id = el.dataset.canvasNodeWrap;
    if (!id) return;
    nodes.set(id, { el, culled: el.hasAttribute(CANVAS_CULLED_ATTR), w: 0, h: 0 });
  });
  content.querySelectorAll<HTMLElement>('[data-canvas-portal]').forEach((el) => {
    portals.push({ el, culled: el.hasAttribute(CANVAS_CULLED_ATTR), w: 0, h: 0 });
  });
  childCount = content.childElementCount;
}

/**
 * Меняет скрытие только если видимость реально сменилась.
 * @param entry - Запись карты
 * @param hide - Скрыть элемент
 */
function applyCull(entry: Tracked, hide: boolean): void {
  if (entry.culled === hide) return;
  entry.culled = hide;
  if (hide) entry.el.setAttribute(CANVAS_CULLED_ATTR, '');
  else entry.el.removeAttribute(CANVAS_CULLED_ATTR);
}

/**
 * Прячет узлы вне экрана с запасом в один экран.
 * Нет размера — не скрываем. Выделенные и узел под курсором остаются.
 * @param root - Корень холста редактора
 * @param pan - Смещение камеры, px экрана
 * @param zoom - Масштаб в процентах
 * @param sizes - Последние ненулевые размеры узлов
 * @param keepIds - Идентификаторы, которые нельзя скрывать
 * @param signature - Отпечаток набора узлов, чтобы не сканировать DOM каждый кадр
 */
export function cullCanvasNodes(
  root: HTMLElement,
  pan: { x: number; y: number },
  zoom: number,
  sizes: Map<string, CullNodeSize>,
  keepIds: ReadonlySet<string>,
  signature: string,
): void {
  const content = root.querySelector<HTMLElement>('[data-canvas-content]');
  if (!content) return;
  bindHover(content);
  const first = nodes.values().next().value as Tracked | undefined;
  const stale = !!first && !first.el.isConnected;
  if (signature !== sig || content.childElementCount !== childCount || stale) {
    sig = signature;
    rebuild(content);
  }
  const scale = zoom / 100;
  if (scale <= 0) return;
  const viewW = root.clientWidth / scale;
  const viewH = root.clientHeight / scale;
  const originX = -pan.x / scale;
  const originY = -pan.y / scale;
  const minX = originX - viewW;
  const minY = originY - viewH;
  const maxX = originX + viewW * 2;
  const maxY = originY + viewH * 2;

  nodes.forEach((entry, id) => {
    if (keepIds.has(id) || entry.el === hovered) {
      applyCull(entry, false);
      return;
    }
    const size = sizes.get(id);
    if (!size || size.width < 1 || size.height < 1) {
      applyCull(entry, false);
      return;
    }
    const x = parseFloat(entry.el.style.left) || 0;
    const y = parseFloat(entry.el.style.top) || 0;
    const outside = x + size.width < minX || x > maxX || y + size.height < minY || y > maxY;
    applyCull(entry, outside);
  });

  for (const entry of portals) {
    if (entry.el === hovered) {
      applyCull(entry, false);
      continue;
    }
    if ((entry.w < 1 || entry.h < 1) && !entry.culled) {
      entry.w = entry.el.offsetWidth;
      entry.h = entry.el.offsetHeight;
    }
    if (entry.w < 1 || entry.h < 1) continue;
    const x = parseFloat(entry.el.style.left) || 0;
    const y = parseFloat(entry.el.style.top) || 0;
    const outside = x + entry.w < minX || x > maxX || y + entry.h < minY || y > maxY;
    applyCull(entry, outside);
  }
}
