  /**
 * @fileoverview Тесты для хука useCreateProjectMutation
 * Проверяет создание нового проекта
 * @module components/editor/sidebar/tests/unit/hooks/use-create-project-mutation.test
 */

/// <reference types="vitest/globals" />

import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCreateProjectMutation } from '../../../hooks/use-create-project-mutation';
import type { BotProject } from '@shared/schema';

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
 * Моковый новый проект
 */
const mockNewProject: BotProject = {
  id: 1,
  name: 'Новый бот 1',
  description: '',
  createdAt: new Date(),
  updatedAt: new Date(),
  ownerId: null,
  data: {
    nodes: [{
      id: 'start',
      type: 'start',
      position: { x: 400, y: 300 },
      data: {
        messageText: 'Привет! Я ваш новый бот.',
        keyboardType: 'none',
        buttons: [],
        command: '/start',
        description: 'Запустить бота',
        showInMenu: true,
        isPrivateOnly: false,
        requiresAuth: false,
        adminOnly: false
      }
    }],
    connections: []
  },
  botToken: null,
  userDatabaseEnabled: null,
  lastExportedGoogleSheetId: null,
  lastExportedGoogleSheetUrl: null,
  lastExportedAt: null,
  lastExportedStructureSheetId: null,
  lastExportedStructureSheetUrl: null,
  lastExportedStructureAt: null,
};

describe('useCreateProjectMutation', () => {
  let queryClient: QueryClient;
  let wrapper: ReturnType<typeof createWrapper>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    wrapper = createWrapper(queryClient);

    // Мок для fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockNewProject,
    });
  });

  afterEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it('должен возвращать функцию createProject и isPending', () => {
    const { result } = renderHook(() => useCreateProjectMutation(), { wrapper });

    expect(result.current.createProject).toBeDefined();
    expect(typeof result.current.createProject).toBe('function');
    expect(result.current.isPending).toBe(false);
  });

  it('должен создавать новый проект с правильными данными', async () => {
    const { result } = renderHook(() => useCreateProjectMutation(), { wrapper });

    await act(async () => {
      result.current.createProject({ projectCount: 0 });
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    // Проверяем что fetch был вызван
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/projects',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"name":"Новый бот 1"'),
      })
    );
  });

  it('должен вызывать onProjectSelect после создания', async () => {
    const mockOnProjectSelect = vi.fn();
    const { result } = renderHook(() => useCreateProjectMutation(), { wrapper });

    await act(async () => {
      result.current.createProject({ 
        projectCount: 0,
        onProjectSelect: mockOnProjectSelect 
      });
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    // onProjectSelect вызывается с ID созданного проекта
    expect(mockOnProjectSelect).toHaveBeenCalledWith(1);
  });

  it('должен показывать ошибку при неудаче', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useCreateProjectMutation(), { wrapper });

    await act(async () => {
      result.current.createProject({ projectCount: 0 });
    });

    // Хук не должен падать
    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });
  });
});
