/** @fileoverview Восстановленная прокрутка не теряется при нескольких этапах загрузки аналитики. */
import { renderHook,act } from '@testing-library/react';
import { expect,it,vi } from 'vitest';
import { useAnalyticsScrollPosition } from './use-analytics-scroll-position';
it('не перезаписывает сохранённую позицию при временном схлопывании после первого восстановления',()=>{
  let resize:()=>void=()=>{};
  const disconnect=vi.fn();
  vi.stubGlobal('ResizeObserver',class {constructor(callback:()=>void){resize=callback;}observe(){}disconnect(){disconnect();}});
  localStorage.setItem('analytics:scroll:12:9','1800');
  const root=document.createElement('div'),viewport=document.createElement('div');
  viewport.setAttribute('data-radix-scroll-area-viewport','');viewport.append(document.createElement('div'));root.append(viewport);
  const {unmount}=renderHook(()=>{const ref=useAnalyticsScrollPosition(12,9);Object.assign(ref,{current:root});return ref;});
  expect(viewport.scrollTop).toBe(1800);
  act(()=>{viewport.scrollTop=0;viewport.dispatchEvent(new Event('scroll'));resize();});
  expect(viewport.scrollTop).toBe(1800);
  expect(localStorage.getItem('analytics:scroll:12:9')).toBe('1800');
  act(()=>{viewport.dispatchEvent(new Event('wheel'));viewport.scrollTop=900;viewport.dispatchEvent(new Event('scroll'));});
  expect(localStorage.getItem('analytics:scroll:12:9')).toBe('900');
  unmount();vi.unstubAllGlobals();
});

it('отменяет восстановление при касании и взаимодействии с полосой прокрутки',()=>{
  let resize:()=>void=()=>{};
  vi.stubGlobal('ResizeObserver',class {constructor(callback:()=>void){resize=callback;}observe(){}disconnect(){}});
  for (const eventName of ['touchstart','pointerdown']) {
    localStorage.setItem('analytics:scroll:12:9','1800');
    const root=document.createElement('div'),viewport=document.createElement('div'),scrollbar=document.createElement('div');
    viewport.setAttribute('data-radix-scroll-area-viewport','');viewport.append(document.createElement('div'));root.append(viewport,scrollbar);
    const {unmount}=renderHook(()=>{const ref=useAnalyticsScrollPosition(12,9);Object.assign(ref,{current:root});return ref;});
    act(()=>{(eventName === 'touchstart' ? viewport : scrollbar).dispatchEvent(new Event(eventName,{bubbles:true}));viewport.scrollTop=900;viewport.dispatchEvent(new Event('scroll'));resize();});
    expect(viewport.scrollTop).toBe(900);
    expect(localStorage.getItem('analytics:scroll:12:9')).toBe('900');
    unmount();
  }
  vi.unstubAllGlobals();
});
