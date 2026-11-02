/** @fileoverview Переключение периода не схлопывает длинную страницу во время загрузки. */
import { renderHook,act } from '@testing-library/react';
import { expect,it } from 'vitest';
import { useAnalyticsPeriodPosition } from './use-analytics-period-position';
it('удерживает высоту при отсутствии снимка и восстанавливает прокрутку после загрузки',()=>{
  const root=document.createElement('div'),viewport=document.createElement('div'),content=document.createElement('div');
  viewport.setAttribute('data-radix-scroll-area-viewport','');root.append(viewport);viewport.append(content);
  viewport.scrollTop=1800;
  content.getBoundingClientRect=()=>({height:5000} as DOMRect);
  const ref={current:root};
  const {result,rerender}=renderHook(({snapshot})=>useAnalyticsPeriodPosition(ref,snapshot,false),{initialProps:{snapshot:{} as unknown}});
  Object.assign(result.current.content,{current:content});
  act(()=>result.current.preserve());
  expect(content.style.minHeight).toBe('5000px');
  rerender({snapshot:undefined});
  expect(content.style.minHeight).toBe('5000px');
  viewport.scrollTop=0;
  rerender({snapshot:{}});
  expect(viewport.scrollTop).toBe(1800);
  expect(content.style.minHeight).toBe('');
});
