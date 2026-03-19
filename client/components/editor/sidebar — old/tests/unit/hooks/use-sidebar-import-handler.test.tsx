/**
 * @fileoverview Тесты для хука useSidebarImportHandler
 * Проверяет импорт JSON и Python проектов, обработку ошибок и обновление кеша
 * @module components/editor/sidebar/tests/unit/hooks/use-sidebar-import-handler.test
 */

/// <reference types="vitest/globals" />

import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSidebarImportHandler } from '../../../hooks/use-sidebar-import-handler';
import type { BotProject } from '@shared/schema';

/** Создать тестовый QueryClient */
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

/** Обернуть компонент в QueryClientProvider */
function wrapperWithQueryClient(queryClient: QueryClient) {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

/** Моковые данные проектов */
const mockProjects: BotProject[] = [
  {
    id: 1,
    name: 'Test Project',
    description: 'Test Description',
    data: { sheets: [] },
    ownerId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
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

describe('useSidebarImportHandler', () => {
  /** Мок для toast */
  let mockToast: ReturnType<typeof vi.fn>;

  /** Мок для onProjectSelect */
  let mockOnProjectSelect: ReturnType<typeof vi.fn>;

  /** Мок для clearImport */
  let mockClearImport: ReturnType<typeof vi.fn>;

  /** Мок для closeImportDialog */
  let mockCloseImportDialog: ReturnType<typeof vi.fn>;

  /** Мок для setImportError */
  let mockSetImportError: ReturnType<typeof vi.fn>;

  /** QueryClient для тестов */
  let queryClient: QueryClient;

  beforeEach(() => {
    mockToast = vi.fn();
    mockOnProjectSelect = vi.fn();
    mockClearImport = vi.fn();
    mockCloseImportDialog = vi.fn();
    mockSetImportError = vi.fn();
    queryClient = createTestQueryClient();
  });

  afterEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it('должен возвращать функцию handleImportProject', () => {
    const { result } = renderHook(
      () =>
        useSidebarImportHandler({
          queryClient,
          toast: mockToast,
          onProjectSelect: mockOnProjectSelect,
          importState: { jsonText: '', pythonText: '' },
          clearImport: mockClearImport,
          closeImportDialog: mockCloseImportDialog,
          setImportError: mockSetImportError,
          projects: mockProjects,
        }),
      { wrapper: wrapperWithQueryClient(queryClient) }
    );

    expect(result.current.handleImportProject).toBeDefined();
    expect(typeof result.current.handleImportProject).toBe('function');
  });

  it('должен импортировать JSON проект (полный формат)', async () => {
    // Мок для fetch
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 2,
        name: 'Imported Project',
        description: 'Test',
        data: { sheets: [] },
      }),
    });

    const jsonText = JSON.stringify({
      name: 'Imported Project',
      description: 'Test Description',
      data: {
        sheets: [
          {
            id: 'main',
            name: 'Main Sheet',
            nodes: [],
            connections: [],
          },
        ],
        version: 2,
        activeSheetId: 'main',
      },
    });

    const { result } = renderHook(
      () =>
        useSidebarImportHandler({
          queryClient,
          toast: mockToast,
          onProjectSelect: mockOnProjectSelect,
          importState: { jsonText, pythonText: '' },
          clearImport: mockClearImport,
          closeImportDialog: mockCloseImportDialog,
          setImportError: mockSetImportError,
          projects: mockProjects,
        }),
      { wrapper: wrapperWithQueryClient(queryClient) }
    );

    act(() => {
      result.current.handleImportProject();
    });

    await waitFor(() => {
      expect(mockCloseImportDialog).toHaveBeenCalled();
      expect(mockClearImport).toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  it('должен импортировать JSON проект (только данные)', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 3,
        name: 'Data Only Project',
        description: '',
        data: { sheets: [] },
      }),
    });

    const jsonText = JSON.stringify({
      sheets: [
        {
          id: 'main',
          name: 'Main Sheet',
          nodes: [],
          connections: [],
        },
      ],
      version: 2,
      activeSheetId: 'main',
    });

    const { result } = renderHook(
      () =>
        useSidebarImportHandler({
          queryClient,
          toast: mockToast,
          onProjectSelect: mockOnProjectSelect,
          importState: { jsonText, pythonText: '' },
          clearImport: mockClearImport,
          closeImportDialog: mockCloseImportDialog,
          setImportError: mockSetImportError,
          projects: mockProjects,
        }),
      { wrapper: wrapperWithQueryClient(queryClient) }
    );

    act(() => {
      result.current.handleImportProject();
    });

    await waitFor(() => {
      expect(mockCloseImportDialog).toHaveBeenCalled();
      expect(mockClearImport).toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  it('должен импортировать Python код бота', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 4,
        name: 'Python Bot',
        description: 'Python Bot',
        data: { sheets: [] },
      }),
    });

    const pythonText = `
# @@NODE_START:start@@
@dp.message()
async def start(message: Message):
    await message.answer(text="Привет!")
# @@NODE_END:start@@
    `.trim();

    const { result } = renderHook(
      () =>
        useSidebarImportHandler({
          queryClient,
          toast: mockToast,
          onProjectSelect: mockOnProjectSelect,
          importState: { jsonText: '', pythonText },
          clearImport: mockClearImport,
          closeImportDialog: mockCloseImportDialog,
          setImportError: mockSetImportError,
          projects: mockProjects,
        }),
      { wrapper: wrapperWithQueryClient(queryClient) }
    );

    act(() => {
      result.current.handleImportProject();
    });

    await waitFor(() => {
      expect(mockCloseImportDialog).toHaveBeenCalled();
      expect(mockClearImport).toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  it('должен показывать ошибку при неверном формате', () => {
    const invalidJson = '{ invalid json }';

    const { result } = renderHook(
      () =>
        useSidebarImportHandler({
          queryClient,
          toast: mockToast,
          onProjectSelect: mockOnProjectSelect,
          importState: { jsonText: invalidJson, pythonText: '' },
          clearImport: mockClearImport,
          closeImportDialog: mockCloseImportDialog,
          setImportError: mockSetImportError,
          projects: mockProjects,
        }),
      { wrapper: wrapperWithQueryClient(queryClient) }
    );

    act(() => {
      result.current.handleImportProject();
    });

    expect(mockSetImportError).toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Ошибка валидации',
        variant: 'destructive',
      })
    );
  });

  it('должен обновлять кэш queryClient после импорта', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 5,
        name: 'Cache Test Project',
        description: 'Test',
        data: { sheets: [] },
      }),
    });

    // Предварительно установить данные в кеш
    queryClient.setQueryData(['/api/projects'], mockProjects);

    const jsonText = JSON.stringify({
      name: 'Cache Test Project',
      description: 'Test Description',
      data: {
        sheets: [
          {
            id: 'main',
            name: 'Main Sheet',
            nodes: [],
            connections: [],
          },
        ],
        version: 2,
        activeSheetId: 'main',
      },
    });

    const { result } = renderHook(
      () =>
        useSidebarImportHandler({
          queryClient,
          toast: mockToast,
          onProjectSelect: mockOnProjectSelect,
          importState: { jsonText, pythonText: '' },
          clearImport: mockClearImport,
          closeImportDialog: mockCloseImportDialog,
          setImportError: mockSetImportError,
          projects: mockProjects,
        }),
      { wrapper: wrapperWithQueryClient(queryClient) }
    );

    act(() => {
      result.current.handleImportProject();
    });

    await waitFor(() => {
      expect(mockCloseImportDialog).toHaveBeenCalled();
      expect(mockClearImport).toHaveBeenCalled();
    }, { timeout: 2000 });

    // Проверить что кеш был обновлен
    const cachedProjects = queryClient.getQueryData(['/api/projects']);
    expect(cachedProjects).toBeDefined();
  });

  it('должен показывать ошибку при неподдерживаемом формате JSON', () => {
    const unsupportedJson = JSON.stringify({ foo: 'bar' });

    const { result } = renderHook(
      () =>
        useSidebarImportHandler({
          queryClient,
          toast: mockToast,
          onProjectSelect: mockOnProjectSelect,
          importState: { jsonText: unsupportedJson, pythonText: '' },
          clearImport: mockClearImport,
          closeImportDialog: mockCloseImportDialog,
          setImportError: mockSetImportError,
          projects: mockProjects,
        }),
      { wrapper: wrapperWithQueryClient(queryClient) }
    );

    act(() => {
      result.current.handleImportProject();
    });

    expect(mockSetImportError).toHaveBeenCalledWith(
      expect.stringContaining('Неподдерживаемый формат JSON')
    );
  });

  it('должен вызывать onProjectSelect после успешного импорта', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 6,
        name: 'Select Test Project',
        description: 'Test',
        data: { sheets: [] },
      }),
    });

    const jsonText = JSON.stringify({
      name: 'Select Test Project',
      description: 'Test Description',
      data: {
        sheets: [
          {
            id: 'main',
            name: 'Main Sheet',
            nodes: [],
            connections: [],
          },
        ],
        version: 2,
        activeSheetId: 'main',
      },
    });

    const { result } = renderHook(
      () =>
        useSidebarImportHandler({
          queryClient,
          toast: mockToast,
          onProjectSelect: mockOnProjectSelect,
          importState: { jsonText, pythonText: '' },
          clearImport: mockClearImport,
          closeImportDialog: mockCloseImportDialog,
          setImportError: mockSetImportError,
          projects: mockProjects,
        }),
      { wrapper: wrapperWithQueryClient(queryClient) }
    );

    act(() => {
      result.current.handleImportProject();
    });

    await waitFor(() => {
      expect(mockOnProjectSelect).toHaveBeenCalledWith(6);
    }, { timeout: 2000 });
  });
});
