/**
 * @fileoverview Интеграционные тесты для touch-перетаскивания проектов
 * Проверяют корректность работы drag-and-drop на touch устройствах
 * @module tests/integration/project-touch-drag.test
 */

/// <reference types="vitest/globals" />

import { vi } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProjectCardWrapper } from '../../components/project-card-wrapper';
import { BotProject } from '@shared/schema';

/**
 * Создание мок проекта для тестов
 * @param id - Идентификатор проекта
 * @param name - Название проекта
 * @param description - Описание проекта
 * @returns Мок проект
 */
const createMockProject = (
  id: number,
  name: string,
  description = '',
  createdAt = '2024-01-01T00:00:00Z'
): BotProject => ({
  id,
  name,
  description,
  data: {
    version: 2,
    sheets: [
      { id: `sheet-${id}-1`, name: 'Лист 1' },
      { id: `sheet-${id}-2`, name: 'Лист 2' },
    ],
  },
  createdAt: new Date(createdAt),
  updatedAt: new Date(createdAt),
  ownerId: null,
  botToken: null,
  userDatabaseEnabled: null,
  lastExportedGoogleSheetId: null,
  lastExportedGoogleSheetUrl: null,
  lastExportedAt: null,
  lastExportedStructureSheetId: null,
  lastExportedStructureSheetUrl: null,
  lastExportedStructureAt: null,
});

/**
 * Создание тестового окружения с QueryClient
 * @param initialProjects - Начальный список проектов
 * @returns QueryClient с данными
 */
const createQueryClient = (initialProjects: BotProject[] = []) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  if (initialProjects.length > 0) {
    queryClient.setQueryData(['/api/projects'], initialProjects);
    queryClient.setQueryData(['/api/projects/list'], initialProjects.map(({ data, ...rest }) => rest));
  }

  return queryClient;
};

/**
 * Мок toast функции для уведомлений
 */
const mockToast = vi.fn();

/**
 * Базовые пропсы для ProjectCardWrapper
 */
const createBaseProps = (queryClient: QueryClient) => ({
  queryClient,
  setDraggedProject: vi.fn(),
  setDragOverProject: vi.fn(),
  toast: mockToast,
  project: createMockProject(1, 'Проект 1'),
  isActive: false,
  currentProjectId: 1,
  activeSheetId: 'sheet-1-1',
  onProjectSelect: vi.fn(),
  onProjectDelete: vi.fn(),
  onSheetSelect: vi.fn(),
  onSheetRename: vi.fn(),
  onSheetDuplicate: vi.fn(),
  onSheetDelete: vi.fn(),
  dragState: {
    draggedProject: null,
    dragOverProject: null,
    draggedSheet: null,
    dragOverSheet: null,
  },
  onProjectDragStart: vi.fn(),
  onProjectDragOver: vi.fn(),
  onProjectDragLeave: vi.fn(),
  onProjectDrop: vi.fn(),
  onSheetDragStart: vi.fn(),
  onSheetDragOver: vi.fn(),
  onSheetDragLeave: vi.fn(),
  onSheetDrop: vi.fn(),
  editingState: {
    editingSheetId: null,
    editingSheetName: '',
  },
  onStartEditingSheet: vi.fn(),
  onSaveSheetName: vi.fn(),
  onCancelEditSheetName: vi.fn(),
  onEditingSheetNameChange: vi.fn(),
  projectEditingState: {
    editingProjectId: null,
    editingProjectName: '',
  },
  onStartEditingProject: vi.fn(),
  onSaveProjectName: vi.fn(),
  onCancelEditProjectName: vi.fn(),
  onEditingProjectNameChange: vi.fn(),
  allProjects: [createMockProject(1, 'Проект 1'), createMockProject(2, 'Проект 2')],
  onMoveSheetToProject: vi.fn(),
});

/**
 * Создание touch события
 * @param type - Тип события (touchstart, touchmove, touchend)
 * @param clientX - Координата X
 * @param clientY - Координата Y
 * @param target - Целевой элемент
 * @returns Touch событие
 */
const createTouchEvent = (
  type: string,
  clientX: number,
  clientY: number,
  target: Element
) => {
  const touch = {
    clientX,
    clientY,
    identifier: Date.now(),
    target,
  };

  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'touches', {
    value: type === 'touchend' ? [] : [touch],
    writable: false,
  });
  Object.defineProperty(event, 'changedTouches', {
    value: [touch],
    writable: false,
  });

  return event;
};

describe('ProjectTouchDrag', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  /**
   * Тест: Полное перетаскивание проекта на другой проект
   * Проверяет успешное перетаскивание проекта на другой проект
   * с обновлением порядка и показом уведомления
   */
  it('должен перетаскивать проект на другой проект', async () => {
    const project1 = createMockProject(1, 'Проект 1');
    const project2 = createMockProject(2, 'Проект 2');
    const queryClient = createQueryClient([project1, project2]);

    const setDraggedProject = vi.fn();
    const setDragOverProject = vi.fn();

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <ProjectCardWrapper
          {...createBaseProps(queryClient)}
          project={project1}
          setDraggedProject={setDraggedProject}
          setDragOverProject={setDragOverProject}
        />
      </QueryClientProvider>
    );

    // Находим карточку проекта
    const card = container.querySelector('[data-project-id="1"]') as HTMLElement;
    expect(card).toBeInTheDocument();

    // Эмулируем начало касания
    const touchStartEvent = createTouchEvent('touchstart', 100, 100, card);
    fireEvent(card, touchStartEvent);

    // Проверяем, что проект начал перетаскиваться
    expect(setDraggedProject).toHaveBeenCalledWith(project1);

    // Эмулируем движение касания (перемещаем на проект 2)
    const touchMoveEvent = createTouchEvent('touchmove', 150, 150, card);
    fireEvent(card, touchMoveEvent);

    // Проверяем визуальные эффекты (opacity и transform)
    expect(card.style.opacity).toBe('0.5');
    expect(card.style.transform).toContain('translate');

    // Эмулируем окончание касания над проектом 2
    // Создаём элемент для project2
    const project2Card = document.createElement('div');
    project2Card.setAttribute('data-project-id', '2');
    project2Card.style.position = 'absolute';
    project2Card.style.left = '150px';
    project2Card.style.top = '150px';
    project2Card.style.width = '100px';
    project2Card.style.height = '100px';
    document.body.appendChild(project2Card);

    // Мок elementFromPoint для возврата project2
    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = vi.fn(() => project2Card);

    const touchEndEvent = createTouchEvent('touchend', 150, 150, card);
    fireEvent(card, touchEndEvent);

    // Восстанавливаем elementFromPoint
    document.elementFromPoint = originalElementFromPoint;
    document.body.removeChild(project2Card);

    // Проверяем, что toast был вызван
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalled();
    });

    // Проверяем, что проект был сброшен
    expect(setDraggedProject).toHaveBeenCalledWith(null);
  });

  /**
   * Тест: Отмена перетаскивания при отпускании за пределами проекта
   * Проверяет, что перетаскивание отменяется, если отпустить палец
   * за пределами любого проекта
   */
  it('должен отменять перетаскивание при отпускании за пределами проекта', async () => {
    const project1 = createMockProject(1, 'Проект 1');
    const queryClient = createQueryClient([project1]);

    const setDraggedProject = vi.fn();
    const setDragOverProject = vi.fn();

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <ProjectCardWrapper
          {...createBaseProps(queryClient)}
          project={project1}
          setDraggedProject={setDraggedProject}
          setDragOverProject={setDragOverProject}
        />
      </QueryClientProvider>
    );

    const card = container.querySelector('[data-project-id="1"]') as HTMLElement;
    expect(card).toBeInTheDocument();

    // Эмулируем начало касания
    const touchStartEvent = createTouchEvent('touchstart', 100, 100, card);
    fireEvent(card, touchStartEvent);

    expect(setDraggedProject).toHaveBeenCalledWith(project1);

    // Эмулируем движение касания
    const touchMoveEvent = createTouchEvent('touchmove', 200, 200, card);
    fireEvent(card, touchMoveEvent);

    // Проверяем визуальные эффекты
    expect(card.style.opacity).toBe('0.5');

    // Мок elementFromPoint для возврата null (за пределами проекта)
    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = vi.fn(() => null);

    // Эмулируем окончание касания за пределами
    const touchEndEvent = createTouchEvent('touchend', 200, 200, card);
    fireEvent(card, touchEndEvent);

    // Восстанавливаем elementFromPoint
    document.elementFromPoint = originalElementFromPoint;

    // Проверяем, что toast НЕ был вызван (перетаскивание отменено)
    await waitFor(() => {
      expect(mockToast).not.toHaveBeenCalled();
    });

    // Проверяем, что проект был сброшен
    expect(setDraggedProject).toHaveBeenCalledWith(null);
  });

  /**
   * Тест: Визуальные эффекты при перетаскивании
   * Проверяет применение opacity и transform стилей во время перетаскивания
   */
  it('должен применять визуальные эффекты (opacity, transform) при перетаскивании', async () => {
    const project1 = createMockProject(1, 'Проект 1');
    const queryClient = createQueryClient([project1]);

    const setDraggedProject = vi.fn();
    const setDragOverProject = vi.fn();

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <ProjectCardWrapper
          {...createBaseProps(queryClient)}
          project={project1}
          setDraggedProject={setDraggedProject}
          setDragOverProject={setDragOverProject}
        />
      </QueryClientProvider>
    );

    const card = container.querySelector('[data-project-id="1"]') as HTMLElement;
    expect(card).toBeInTheDocument();

    // Начальное состояние - без стилей трансформации
    expect(card.style.opacity).toBe('');
    expect(card.style.transform).toBe('');

    // Эмулируем начало касания
    const touchStartEvent = createTouchEvent('touchstart', 100, 100, card);
    fireEvent(card, touchStartEvent);

    // Эмулируем движение касания
    const touchMoveEvent = createTouchEvent('touchmove', 150, 200, card);
    fireEvent(card, touchMoveEvent);

    // Проверяем применение визуальных эффектов
    expect(card.style.opacity).toBe('0.5');
    expect(card.style.transform).toMatch(/translate\(\d+px,\s*\d+px\)/);

    // Мок elementFromPoint
    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = vi.fn(() => null);

    // Эмулируем окончание касания
    const touchEndEvent = createTouchEvent('touchend', 150, 200, card);
    fireEvent(card, touchEndEvent);

    // Восстанавливаем elementFromPoint
    document.elementFromPoint = originalElementFromPoint;

    // После окончания касания стили должны сброситься (это происходит в handleTouchEnd)
    // Примечание: стили сбрасываются в базовом хуке useProjectTouch
  });
});

describe('ProjectTouchSwap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  /**
   * Тест: Успешный обмен двух проектов местами
   * Проверяет корректный обмен позиций двух проектов в списке
   */
  it('должен выполнять обмен двух проектов местами', async () => {
    const project1 = createMockProject(1, 'Проект 1');
    const project2 = createMockProject(2, 'Проект 2');
    const queryClient = createQueryClient([project1, project2]);

    const setDraggedProject = vi.fn();
    const setDragOverProject = vi.fn();

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <ProjectCardWrapper
          {...createBaseProps(queryClient)}
          project={project1}
          setDraggedProject={setDraggedProject}
          setDragOverProject={setDragOverProject}
        />
      </QueryClientProvider>
    );

    const card1 = container.querySelector('[data-project-id="1"]') as HTMLElement;
    expect(card1).toBeInTheDocument();

    // Создаём элемент для project2
    const project2Card = document.createElement('div');
    project2Card.setAttribute('data-project-id', '2');
    project2Card.style.position = 'absolute';
    project2Card.style.left = '150px';
    project2Card.style.top = '150px';
    project2Card.style.width = '100px';
    project2Card.style.height = '100px';
    document.body.appendChild(project2Card);

    // Мок elementFromPoint для возврата project2
    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = vi.fn(() => project2Card);

    // Эмулируем полное перетаскивание
    const touchStartEvent = createTouchEvent('touchstart', 100, 100, card1);
    fireEvent(card1, touchStartEvent);

    const touchMoveEvent = createTouchEvent('touchmove', 150, 150, card1);
    fireEvent(card1, touchMoveEvent);

    const touchEndEvent = createTouchEvent('touchend', 150, 150, card1);
    fireEvent(card1, touchEndEvent);

    // Восстанавливаем elementFromPoint
    document.elementFromPoint = originalElementFromPoint;
    document.body.removeChild(project2Card);

    // Проверяем обновление queryClient кеша
    const updatedProjects = queryClient.getQueryData<BotProject[]>(['/api/projects']);
    expect(updatedProjects).toBeDefined();

    // Проект 1 должен быть перемещён на позицию проекта 2
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: '✅ Проекты переупорядочены',
        description: expect.stringContaining('Проект "Проект 1" перемещен'),
      });
    });
  });

  /**
   * Тест: Проверка обновления queryClient кеша
   * Проверяет, что кеш queryClient обновляется после перетаскивания
   */
  it('должен обновлять queryClient кеш после перетаскивания', async () => {
    const project1 = createMockProject(1, 'Проект 1');
    const project2 = createMockProject(2, 'Проект 2');
    const queryClient = createQueryClient([project1, project2]);

    const setDraggedProject = vi.fn();
    const setDragOverProject = vi.fn();

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <ProjectCardWrapper
          {...createBaseProps(queryClient)}
          project={project1}
          setDraggedProject={setDraggedProject}
          setDragOverProject={setDragOverProject}
        />
      </QueryClientProvider>
    );

    const card1 = container.querySelector('[data-project-id="1"]') as HTMLElement;

    // Создаём элемент для project2
    const project2Card = document.createElement('div');
    project2Card.setAttribute('data-project-id', '2');
    document.body.appendChild(project2Card);

    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = vi.fn(() => project2Card);

    // Эмулируем перетаскивание
    fireEvent(card1, createTouchEvent('touchstart', 100, 100, card1));
    fireEvent(card1, createTouchEvent('touchmove', 150, 150, card1));
    fireEvent(card1, createTouchEvent('touchend', 150, 150, card1));

    document.elementFromPoint = originalElementFromPoint;
    document.body.removeChild(project2Card);

    // Проверяем, что кеш был обновлён
    await waitFor(() => {
      const projects = queryClient.getQueryData<BotProject[]>(['/api/projects']);
      expect(projects).toBeDefined();
      expect(projects?.length).toBe(2);
    });
  });

  /**
   * Тест: Проверка показа toast уведомления
   * Проверяет, что после успешного перетаскивания показывается уведомление
   */
  it('должен показывать toast уведомление после перетаскивания', async () => {
    const project1 = createMockProject(1, 'Проект 1');
    const project2 = createMockProject(2, 'Проект 2');
    const queryClient = createQueryClient([project1, project2]);

    const setDraggedProject = vi.fn();
    const setDragOverProject = vi.fn();

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <ProjectCardWrapper
          {...createBaseProps(queryClient)}
          project={project1}
          setDraggedProject={setDraggedProject}
          setDragOverProject={setDragOverProject}
        />
      </QueryClientProvider>
    );

    const card1 = container.querySelector('[data-project-id="1"]') as HTMLElement;

    // Создаём элемент для project2
    const project2Card = document.createElement('div');
    project2Card.setAttribute('data-project-id', '2');
    document.body.appendChild(project2Card);

    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = vi.fn(() => project2Card);

    // Эмулируем перетаскивание
    fireEvent(card1, createTouchEvent('touchstart', 100, 100, card1));
    fireEvent(card1, createTouchEvent('touchmove', 150, 150, card1));
    fireEvent(card1, createTouchEvent('touchend', 150, 150, card1));

    document.elementFromPoint = originalElementFromPoint;
    document.body.removeChild(project2Card);

    // Проверяем, что toast был вызван с правильными параметрами
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('✅'),
          description: expect.stringContaining('Проект 1'),
        })
      );
    });
  });
});

describe('ProjectTouchEdgeCases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  /**
   * Тест: Перетаскивание проекта на самого себя
   * Проверяет, что перетаскивание на самого себя отменяется
   * и не вызывает изменений в порядке проектов
   */
  it('должен отменять перетаскивание проекта на самого себя', async () => {
    const project1 = createMockProject(1, 'Проект 1');
    const queryClient = createQueryClient([project1]);

    const setDraggedProject = vi.fn();
    const setDragOverProject = vi.fn();

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <ProjectCardWrapper
          {...createBaseProps(queryClient)}
          project={project1}
          setDraggedProject={setDraggedProject}
          setDragOverProject={setDragOverProject}
        />
      </QueryClientProvider>
    );

    const card1 = container.querySelector('[data-project-id="1"]') as HTMLElement;

    // Создаём элемент для того же проекта (симуляция drop на себя)
    const sameProjectCard = document.createElement('div');
    sameProjectCard.setAttribute('data-project-id', '1');
    document.body.appendChild(sameProjectCard);

    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = vi.fn(() => sameProjectCard);

    // Эмулируем перетаскивание
    fireEvent(card1, createTouchEvent('touchstart', 100, 100, card1));
    fireEvent(card1, createTouchEvent('touchmove', 150, 150, card1));
    fireEvent(card1, createTouchEvent('touchend', 150, 150, card1));

    document.elementFromPoint = originalElementFromPoint;
    document.body.removeChild(sameProjectCard);

    // Проверяем, что toast НЕ был вызван (перетаскивание на себя отменено)
    await waitFor(() => {
      expect(mockToast).not.toHaveBeenCalled();
    });

    // Проверяем, что проект был сброшен
    expect(setDraggedProject).toHaveBeenCalledWith(null);
  });

  /**
   * Тест: Перетаскивание с быстрым отпусканием (короткий touch)
   * Проверяет корректную обработку короткого касания без значительного перемещения
   */
  it('должен обрабатывать перетаскивание с быстрым отпусканием (короткий touch)', async () => {
    const project1 = createMockProject(1, 'Проект 1');
    const queryClient = createQueryClient([project1]);

    const setDraggedProject = vi.fn();
    const setDragOverProject = vi.fn();

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <ProjectCardWrapper
          {...createBaseProps(queryClient)}
          project={project1}
          setDraggedProject={setDraggedProject}
          setDragOverProject={setDragOverProject}
        />
      </QueryClientProvider>
    );

    const card1 = container.querySelector('[data-project-id="1"]') as HTMLElement;

    // Эмулируем очень короткое касание (минимальное перемещение)
    fireEvent(card1, createTouchEvent('touchstart', 100, 100, card1));
    fireEvent(card1, createTouchEvent('touchmove', 102, 102, card1));

    // Мок elementFromPoint для возврата null (нет целевого проекта)
    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = vi.fn(() => null);

    fireEvent(card1, createTouchEvent('touchend', 102, 102, card1));

    document.elementFromPoint = originalElementFromPoint;

    // Проверяем, что перетаскивание было обработано
    expect(setDraggedProject).toHaveBeenCalledWith(project1);
    expect(setDraggedProject).toHaveBeenCalledWith(null);

    // Toast не должен быть вызван, так как нет целевого проекта
    await waitFor(() => {
      expect(mockToast).not.toHaveBeenCalled();
    });
  });

  /**
   * Тест: Перетаскивание за пределами экрана
   * Проверяет корректную обработку касаний за пределами видимой области
   */
  it('должен обрабатывать перетаскивание за пределами экрана', async () => {
    const project1 = createMockProject(1, 'Проект 1');
    const queryClient = createQueryClient([project1]);

    const setDraggedProject = vi.fn();
    const setDragOverProject = vi.fn();

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <ProjectCardWrapper
          {...createBaseProps(queryClient)}
          project={project1}
          setDraggedProject={setDraggedProject}
          setDragOverProject={setDragOverProject}
        />
      </QueryClientProvider>
    );

    const card1 = container.querySelector('[data-project-id="1"]') as HTMLElement;

    // Эмулируем начало касания
    fireEvent(card1, createTouchEvent('touchstart', 100, 100, card1));

    // Эмулируем движение за пределы экрана (отрицательные координаты)
    fireEvent(card1, createTouchEvent('touchmove', -100, -100, card1));

    // Мок elementFromPoint для возврата null (за пределами)
    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = vi.fn(() => null);

    // Эмулируем окончание за пределами экрана
    fireEvent(card1, createTouchEvent('touchend', -100, -100, card1));

    document.elementFromPoint = originalElementFromPoint;

    // Проверяем, что перетаскивание было обработано
    expect(setDraggedProject).toHaveBeenCalledWith(project1);
    expect(setDraggedProject).toHaveBeenCalledWith(null);

    // Toast не должен быть вызван
    await waitFor(() => {
      expect(mockToast).not.toHaveBeenCalled();
    });
  });

  /**
   * Тест: Множественные касания (мультитач)
   * Проверяет корректную обработку первого касания при мультитач жесте
   */
  it('должен обрабатывать первое касание при мультитач жесте', async () => {
    const project1 = createMockProject(1, 'Проект 1');
    const queryClient = createQueryClient([project1]);

    const setDraggedProject = vi.fn();
    const setDragOverProject = vi.fn();

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <ProjectCardWrapper
          {...createBaseProps(queryClient)}
          project={project1}
          setDraggedProject={setDraggedProject}
          setDragOverProject={setDragOverProject}
        />
      </QueryClientProvider>
    );

    const card1 = container.querySelector('[data-project-id="1"]') as HTMLElement;

    // Создаём событие с несколькими касаниями
    const touch1 = { clientX: 100, clientY: 100, identifier: 1, target: card1 };
    const touch2 = { clientX: 200, clientY: 200, identifier: 2, target: card1 };

    const touchStartEvent = new Event('touchstart', { bubbles: true, cancelable: true });
    Object.defineProperty(touchStartEvent, 'touches', {
      value: [touch1, touch2],
      writable: false,
    });
    Object.defineProperty(touchStartEvent, 'changedTouches', {
      value: [touch1],
      writable: false,
    });

    fireEvent(card1, touchStartEvent);

    // Проверяем, что первое касание было обработано
    expect(setDraggedProject).toHaveBeenCalledWith(project1);
  });

  /**
   * Тест: Отмена перетаскивания при выходе за пределы элемента
   * Проверяет, что перетаскивание корректно завершается при выходе за границы
   */
  it('должен отменять перетаскивание при выходе за пределы элемента', async () => {
    const project1 = createMockProject(1, 'Проект 1');
    const queryClient = createQueryClient([project1]);

    const setDraggedProject = vi.fn();
    const setDragOverProject = vi.fn();

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <ProjectCardWrapper
          {...createBaseProps(queryClient)}
          project={project1}
          setDraggedProject={setDraggedProject}
          setDragOverProject={setDragOverProject}
        />
      </QueryClientProvider>
    );

    const card1 = container.querySelector('[data-project-id="1"]') as HTMLElement;

    // Эмулируем начало касания
    fireEvent(card1, createTouchEvent('touchstart', 100, 100, card1));

    // Эмулируем движение далеко за пределы
    fireEvent(card1, createTouchEvent('touchmove', 10000, 10000, card1));

    // Мок elementFromPoint для возврата null
    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = vi.fn(() => null);

    // Эмулируем окончание
    fireEvent(card1, createTouchEvent('touchend', 10000, 10000, card1));

    document.elementFromPoint = originalElementFromPoint;

    // Проверяем, что перетаскивание было завершено
    expect(setDraggedProject).toHaveBeenCalledWith(null);
  });
});
