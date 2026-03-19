/**
 * @fileoverview Тесты для хука useSidebarSheetDrag
 * Проверяет перетаскивание листов между проектами
 * @module components/editor/sidebar/tests/unit/hooks/use-sidebar-sheet-drag.test
 */

/// <reference types="vitest/globals" />

import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSidebarSheetDrag } from '../../../hooks/use-sidebar-sheet-drag';
import type { BotProject } from '@shared/schema';
import { apiRequest } from '@/queryClient';

/**
 * Создаёт тестовый QueryClient
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Обёртка для тестирования хуков с React Query
 */
const createWrapper = (queryClient: QueryClient) => {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

/**
 * Моковые данные проектов
 */
const mockProjects: BotProject[] = [
  {
    id: 1,
    name: 'Project 1',
    description: 'Test Project 1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ownerId: null,
    data: {
      sheets: [
        { id: 'sheet1', name: 'Sheet 1', nodes: [], connections: [] },
        { id: 'sheet2', name: 'Sheet 2', nodes: [], connections: [] },
      ],
      version: 2,
      activeSheetId: 'sheet1',
    },
    botToken: null,
    userDatabaseEnabled: null,
    lastExportedGoogleSheetId: null,
    lastExportedGoogleSheetUrl: null,
    lastExportedAt: null,
    lastExportedStructureSheetId: null,
    lastExportedStructureSheetUrl: null,
    lastExportedStructureAt: null,
  },
  {
    id: 2,
    name: 'Project 2',
    description: 'Test Project 2',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    ownerId: null,
    data: {
      sheets: [
        { id: 'sheet3', name: 'Sheet 3', nodes: [], connections: [] },
      ],
      version: 2,
      activeSheetId: 'sheet3',
    },
    botToken: null,
    userDatabaseEnabled: null,
    lastExportedGoogleSheetId: null,
    lastExportedGoogleSheetUrl: null,
    lastExportedAt: null,
    lastExportedStructureSheetId: null,
    lastExportedStructureSheetUrl: null,
    lastExportedStructureAt: null,
  },
];

/**
 * Моковая функция toast
 */
const mockToast = vi.fn();

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

vi.mock('@/queryClient', () => ({
  apiRequest: vi.fn(),
}));

describe('useSidebarSheetDrag', () => {
  let queryClient: QueryClient;
  let wrapper: ReturnType<typeof createWrapper>;
  let setDraggedSheet: ReturnType<typeof vi.fn>;
  let setDragOverSheet: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    wrapper = createWrapper(queryClient);
    setDraggedSheet = vi.fn();
    setDragOverSheet = vi.fn();
    mockToast.mockClear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('должен возвращать draggedSheet и функции управления', () => {
    const { result } = renderHook(() => useSidebarSheetDrag({
      setDraggedSheet,
      setDragOverSheet,
      sheetDragState: { draggedSheet: null, dragOverSheet: null },
      projects: mockProjects,
    }), { wrapper });

    expect(result.current.handleSheetDragStart).toBeDefined();
    expect(result.current.handleSheetDropOnProject).toBeDefined();
    expect(result.current.clearDraggedSheet).toBeDefined();
    expect(typeof result.current.handleSheetDragStart).toBe('function');
    expect(typeof result.current.handleSheetDropOnProject).toBe('function');
    expect(typeof result.current.clearDraggedSheet).toBe('function');
  });

  it('должен устанавливать draggedSheet при drag start', () => {
    const { result } = renderHook(() => useSidebarSheetDrag({
      setDraggedSheet,
      setDragOverSheet,
      sheetDragState: { draggedSheet: null, dragOverSheet: null },
      projects: mockProjects,
    }), { wrapper });

    const mockEvent = {
      stopPropagation: vi.fn(),
      dataTransfer: {
        effectAllowed: '',
        setData: vi.fn(),
      },
    } as unknown as React.DragEvent;

    act(() => {
      result.current.handleSheetDragStart(mockEvent, 'sheet1', 1);
    });

    expect(setDraggedSheet).toHaveBeenCalledWith({ sheetId: 'sheet1', projectId: 1 });
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(mockEvent.dataTransfer.effectAllowed).toBe('move');
    expect(mockEvent.dataTransfer.setData).toHaveBeenCalledWith('text/plain', 'sheet1');
  });

  it('должен очищать draggedSheet при clear', () => {
    const { result } = renderHook(() => useSidebarSheetDrag({
      setDraggedSheet,
      setDragOverSheet,
      sheetDragState: { draggedSheet: { sheetId: 'sheet1', projectId: 1 }, dragOverSheet: null },
      projects: mockProjects,
    }), { wrapper });

    act(() => {
      result.current.clearDraggedSheet();
    });

    expect(setDraggedSheet).toHaveBeenCalledWith(null);
  });

  it('должен перемещать лист между проектами', async () => {
    // Мок для apiRequest
    (apiRequest as any).mockResolvedValue(undefined);

    const { result } = renderHook(() => useSidebarSheetDrag({
      setDraggedSheet,
      setDragOverSheet,
      sheetDragState: { draggedSheet: { sheetId: 'sheet1', projectId: 1 }, dragOverSheet: null },
      projects: mockProjects,
    }), { wrapper });

    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as React.DragEvent;

    await act(async () => {
      await result.current.handleSheetDropOnProject(mockEvent, 2);
    });

    expect(setDragOverSheet).toHaveBeenCalledWith(null);
    expect(apiRequest).toHaveBeenCalledTimes(2);
    expect(apiRequest).toHaveBeenCalledWith(
      'PUT',
      '/api/projects/1',
      expect.objectContaining({ data: expect.any(Object) })
    );
    expect(apiRequest).toHaveBeenCalledWith(
      'PUT',
      '/api/projects/2',
      expect.objectContaining({ data: expect.any(Object) })
    );
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "✅ Лист перемещен",
      })
    );
  });

  it('должен отменять перемещение если целевой проект тот же', async () => {
    const { result } = renderHook(() => useSidebarSheetDrag({
      setDraggedSheet,
      setDragOverSheet,
      sheetDragState: { draggedSheet: { sheetId: 'sheet1', projectId: 1 }, dragOverSheet: null },
      projects: mockProjects,
    }), { wrapper });

    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as React.DragEvent;

    await act(async () => {
      await result.current.handleSheetDropOnProject(mockEvent, 1);
    });

    expect(setDraggedSheet).toHaveBeenCalledWith(null);
    expect(apiRequest).not.toHaveBeenCalled();
    expect(mockToast).not.toHaveBeenCalled();
  });

  it('должен показывать ошибку если проект не в новом формате', async () => {
    const projectsWithoutSheets: BotProject[] = [
      {
        ...mockProjects[0],
        data: { nodes: [], connections: [] },
      },
      mockProjects[1],
    ];

    const { result } = renderHook(() => useSidebarSheetDrag({
      setDraggedSheet,
      setDragOverSheet,
      sheetDragState: { draggedSheet: { sheetId: 'sheet1', projectId: 1 }, dragOverSheet: null },
      projects: projectsWithoutSheets,
    }), { wrapper });

    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as React.DragEvent;

    await act(async () => {
      await result.current.handleSheetDropOnProject(mockEvent, 2);
    });

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "❌ Ошибка",
        description: "Оба проекта должны быть в новом формате с листами",
        variant: "destructive",
      })
    );
  });

  it('должен обрабатывать ошибку если лист не найден', async () => {
    const { result } = renderHook(() => useSidebarSheetDrag({
      setDraggedSheet,
      setDragOverSheet,
      // Лист с ID который не существует в проекте
      sheetDragState: { draggedSheet: { sheetId: 'nonexistent', projectId: 1 }, dragOverSheet: null },
      projects: mockProjects,
    }), { wrapper });

    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as React.DragEvent;

    await act(async () => {
      await result.current.handleSheetDropOnProject(mockEvent, 2);
    });

    // Лист не найден, поэтому draggedSheet должен быть очищен
    expect(setDraggedSheet).toHaveBeenCalledWith(null);
    expect(apiRequest).not.toHaveBeenCalled();
  });

  it('должен возвращать null если draggedSheet не установлен', async () => {
    const { result } = renderHook(() => useSidebarSheetDrag({
      setDraggedSheet,
      setDragOverSheet,
      sheetDragState: { draggedSheet: null, dragOverSheet: null },
      projects: mockProjects,
    }), { wrapper });

    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as React.DragEvent;

    await act(async () => {
      await result.current.handleSheetDropOnProject(mockEvent, 2);
    });

    expect(apiRequest).not.toHaveBeenCalled();
    expect(mockToast).not.toHaveBeenCalled();
  });
});
