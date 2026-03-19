/**
 * @fileoverview Тесты для хука useProjectTouch
 * Проверяют корректность touch-обработчиков для перетаскивания проектов
 */

/// <reference types="vitest/globals" />

import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useProjectTouch } from '../../../hooks/use-project-touch';
import { BotProject } from '@shared/schema';

const mockProject = {
  id: 1,
  name: 'Test Project',
  description: 'Test Description',
  ownerId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  data: {},
  botToken: null,
  userDatabaseEnabled: null,
  lastExportedGoogleSheetId: null,
  lastExportedGoogleSheetUrl: null,
  googleAccessToken: null,
  googleRefreshToken: null,
  lastExportedStructureAt: null,
  lastExportedAt: null,
  lastExportedStructureSheetId: null,
  lastExportedStructureSheetUrl: null,
} as unknown as BotProject;

describe('useProjectTouch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('должен возвращать обработчики touch событий', () => {
    const { result } = renderHook(() => useProjectTouch({ project: mockProject }));

    expect(result.current.handleTouchStart).toBeDefined();
    expect(result.current.handleTouchMove).toBeDefined();
    expect(result.current.handleTouchEnd).toBeDefined();
    expect(result.current.isDragging).toBe(false);
  });

  it('должен устанавливать isDragging в true при handleTouchStart', () => {
    const { result } = renderHook(() => useProjectTouch({ project: mockProject }));

    const mockEvent = {
      touches: [{ clientX: 100, clientY: 100 }],
    } as unknown as React.TouchEvent;

    result.current.handleTouchStart(mockEvent);

    expect(result.current.isDragging).toBe(true);
  });

  it('должен вызывать onDragStart при handleTouchStart', () => {
    const onDragStart = vi.fn();
    const { result } = renderHook(() =>
      useProjectTouch({ project: mockProject, onDragStart })
    );

    const mockEvent = {
      touches: [{ clientX: 100, clientY: 100 }],
    } as unknown as React.TouchEvent;

    result.current.handleTouchStart(mockEvent);

    expect(onDragStart).toHaveBeenCalled();
  });

  it('должен изменять transform элемента при handleTouchMove', () => {
    const { result } = renderHook(() => useProjectTouch({ project: mockProject }));

    const startEvent = {
      touches: [{ clientX: 100, clientY: 100 }],
    } as unknown as React.TouchEvent;

    result.current.handleTouchStart(startEvent);

    const mockElement = {
      style: {
        transform: '',
        opacity: '',
      },
    } as HTMLElement;

    const moveEvent = {
      touches: [{ clientX: 150, clientY: 150 }],
      currentTarget: mockElement,
    } as unknown as React.TouchEvent;

    result.current.handleTouchMove(moveEvent);

    expect(mockElement.style.transform).toContain('translate');
    expect(mockElement.style.opacity).toBe('0.5');
  });

  it('не должен выполнять handleTouchMove если не перетаскивается', () => {
    const { result } = renderHook(() => useProjectTouch({ project: mockProject }));

    const mockElement = {
      style: {
        transform: '',
        opacity: '',
      },
    } as HTMLElement;

    const moveEvent = {
      touches: [{ clientX: 150, clientY: 150 }],
      currentTarget: mockElement,
    } as unknown as React.TouchEvent;

    result.current.handleTouchMove(moveEvent);

    expect(mockElement.style.transform).toBe('');
  });

  it('должен сбрасывать стили при handleTouchEnd', () => {
    const { result } = renderHook(() => useProjectTouch({ project: mockProject }));

    const startEvent = {
      touches: [{ clientX: 100, clientY: 100 }],
    } as unknown as React.TouchEvent;

    result.current.handleTouchStart(startEvent);

    const mockElement = {
      style: {
        transform: 'translate(50px, 50px)',
        opacity: '0.5',
      },
    } as HTMLElement;

    const endEvent = {
      changedTouches: [{ clientX: 150, clientY: 150 }],
      currentTarget: mockElement,
    } as unknown as React.TouchEvent;

    result.current.handleTouchEnd(endEvent);

    expect(mockElement.style.transform).toBe('');
    expect(mockElement.style.opacity).toBe('');
  });

  it('должен вызывать onDragEnd при handleTouchEnd', () => {
    const onDragEnd = vi.fn();
    const { result } = renderHook(() =>
      useProjectTouch({ project: mockProject, onDragEnd })
    );

    const startEvent = {
      touches: [{ clientX: 100, clientY: 100 }],
    } as unknown as React.TouchEvent;

    result.current.handleTouchStart(startEvent);

    const endEvent = {
      changedTouches: [{ clientX: 150, clientY: 150 }],
      currentTarget: document.createElement('div'),
    } as unknown as React.TouchEvent;

    result.current.handleTouchEnd(endEvent);

    expect(onDragEnd).toHaveBeenCalled();
  });

  it('должен устанавливать isDragging в false при handleTouchEnd', () => {
    const { result } = renderHook(() => useProjectTouch({ project: mockProject }));

    const startEvent = {
      touches: [{ clientX: 100, clientY: 100 }],
    } as unknown as React.TouchEvent;

    result.current.handleTouchStart(startEvent);
    expect(result.current.isDragging).toBe(true);

    const endEvent = {
      changedTouches: [{ clientX: 150, clientY: 150 }],
      currentTarget: document.createElement('div'),
    } as unknown as React.TouchEvent;

    result.current.handleTouchEnd(endEvent);

    expect(result.current.isDragging).toBe(false);
  });
});
