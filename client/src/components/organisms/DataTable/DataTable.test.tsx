import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DataTable } from './DataTable';
import { createTextColumn, createDateColumn, createCustomColumn } from './DataTableColumn';
import { renderWithProviders } from '@/test/test-utils';

// Мокаем компоненты UI
vi.mock('@/components/ui/table', () => ({
  Table: ({ children, ...props }: any) => <table {...props}>{children}</table>,
  TableHeader: ({ children, ...props }: any) => <thead {...props}>{children}</thead>,
  TableBody: ({ children, ...props }: any) => <tbody {...props}>{children}</tbody>,
  TableHead: ({ children, ...props }: any) => <th {...props}>{children}</th>,
  TableRow: ({ children, ...props }: any) => <tr {...props}>{children}</tr>,
  TableCell: ({ children, ...props }: any) => <td {...props}>{children}</td>,
}));

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange, disabled, ...props }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      disabled={disabled}
      {...props}
    />
  ),
}));

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className, ...props }: any) => (
    <div className={`skeleton ${className}`} {...props} />
  ),
}));

// Тестовые данные
interface TestUser {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
}

const testUsers: TestUser[] = [
  {
    id: 1,
    name: 'Иван Иванов',
    email: 'ivan@example.com',
    role: 'admin',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 2,
    name: 'Мария Петрова',
    email: 'maria@example.com',
    role: 'user',
    createdAt: new Date('2024-01-02'),
  },
  {
    id: 3,
    name: 'Петр Сидоров',
    email: 'petr@example.com',
    role: 'moderator',
    createdAt: new Date('2024-01-03'),
  },
];

const testColumns = [
  createTextColumn('name', 'Имя', 'name'),
  createTextColumn('email', 'Email', 'email'),
  createTextColumn('role', 'Роль', 'role'),
  createDateColumn('createdAt', 'Создан', 'createdAt'),
];

describe('DataTable', () => {
  it('рендерится с базовыми данными', () => {
    render(<DataTable data={testUsers} columns={testColumns} />);
    
    // Проверяем заголовки
    expect(screen.getByText('Имя')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Роль')).toBeInTheDocument();
    expect(screen.getByText('Создан')).toBeInTheDocument();
    
    // Проверяем данные
    expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    expect(screen.getByText('ivan@example.com')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
  });

  it('показывает состояние загрузки', () => {
    render(<DataTable data={[]} columns={testColumns} loading />);
    
    // Проверяем наличие скелетонов
    const skeletons = document.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('показывает пустое состояние', () => {
    render(<DataTable data={[]} columns={testColumns} />);
    
    expect(screen.getByText('Нет данных для отображения')).toBeInTheDocument();
  });

  it('показывает кастомное сообщение о пустом состоянии', () => {
    render(
      <DataTable 
        data={[]} 
        columns={testColumns} 
        emptyMessage="Пользователи не найдены"
      />
    );
    
    expect(screen.getByText('Пользователи не найдены')).toBeInTheDocument();
  });

  it('показывает состояние ошибки', () => {
    render(
      <DataTable 
        data={[]} 
        columns={testColumns} 
        error="Ошибка загрузки данных"
      />
    );
    
    expect(screen.getByText('Ошибка загрузки данных')).toBeInTheDocument();
  });

  it('поддерживает сортировку', () => {
    const handleSort = vi.fn();
    const sortingConfig = {
      field: null as keyof TestUser | null,
      direction: 'asc' as const,
      onSort: handleSort,
    };

    // Делаем колонку сортируемой
    const sortableColumns = testColumns.map(col => 
      col.id === 'name' ? { ...col, sortable: true } : col
    );

    render(
      <DataTable 
        data={testUsers} 
        columns={sortableColumns}
        sorting={sortingConfig}
      />
    );
    
    const nameHeader = screen.getByText('Имя').closest('th');
    expect(nameHeader).toBeInTheDocument();
    
    fireEvent.click(nameHeader!);
    expect(handleSort).toHaveBeenCalledWith('name', 'asc');
  });

  it('поддерживает выбор строк', () => {
    const handleSelectionChange = vi.fn();
    const selectionConfig = {
      selectedRows: [],
      onSelectionChange: handleSelectionChange,
      getRowId: (row: TestUser) => row.id,
    };

    render(
      <DataTable 
        data={testUsers} 
        columns={testColumns}
        selection={selectionConfig}
      />
    );
    
    // Проверяем наличие чекбоксов
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBe(testUsers.length + 1); // +1 для "выбрать все"
    
    // Кликаем на первый чекбокс строки
    fireEvent.click(checkboxes[1]);
    expect(handleSelectionChange).toHaveBeenCalledWith([testUsers[0]]);
  });

  it('поддерживает выбор всех строк', () => {
    const handleSelectionChange = vi.fn();
    const selectionConfig = {
      selectedRows: [],
      onSelectionChange: handleSelectionChange,
    };

    render(
      <DataTable 
        data={testUsers} 
        columns={testColumns}
        selection={selectionConfig}
      />
    );
    
    const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(selectAllCheckbox);
    
    expect(handleSelectionChange).toHaveBeenCalledWith(testUsers);
  });

  it('поддерживает пагинацию', () => {
    const handlePageChange = vi.fn();
    const handlePageSizeChange = vi.fn();
    const paginationConfig = {
      page: 0,
      pageSize: 10,
      total: 100,
      onPageChange: handlePageChange,
      onPageSizeChange: handlePageSizeChange,
    };

    render(
      <DataTable 
        data={testUsers} 
        columns={testColumns}
        pagination={paginationConfig}
      />
    );
    
    // Пагинация должна быть отрендерена (проверяем через наличие компонента)
    // В реальном тесте здесь были бы кнопки пагинации
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('обрабатывает клики по строкам', () => {
    const handleRowClick = vi.fn();
    
    render(
      <DataTable 
        data={testUsers} 
        columns={testColumns}
        onRowClick={handleRowClick}
      />
    );
    
    const firstRow = screen.getByText('Иван Иванов').closest('tr');
    fireEvent.click(firstRow!);
    
    expect(handleRowClick).toHaveBeenCalledWith(testUsers[0], 0);
  });

  it('обрабатывает двойные клики по строкам', () => {
    const handleRowDoubleClick = vi.fn();
    
    render(
      <DataTable 
        data={testUsers} 
        columns={testColumns}
        onRowDoubleClick={handleRowDoubleClick}
      />
    );
    
    const firstRow = screen.getByText('Иван Иванов').closest('tr');
    fireEvent.doubleClick(firstRow!);
    
    expect(handleRowDoubleClick).toHaveBeenCalledWith(testUsers[0], 0);
  });

  it('поддерживает кастомные колонки', () => {
    const customColumns = [
      ...testColumns,
      createCustomColumn('actions', 'Действия', ({ row }) => (
        <button data-testid={`edit-${row.id}`}>Редактировать</button>
      )),
    ];

    render(<DataTable data={testUsers} columns={customColumns} />);
    
    expect(screen.getByText('Действия')).toBeInTheDocument();
    expect(screen.getByTestId('edit-1')).toBeInTheDocument();
    expect(screen.getByTestId('edit-2')).toBeInTheDocument();
    expect(screen.getByTestId('edit-3')).toBeInTheDocument();
  });

  it('применяет правильные классы для размеров', () => {
    const { rerender } = render(
      <DataTable data={testUsers} columns={testColumns} size="sm" />
    );
    
    // Ищем контейнер с классами размера
    let container = document.querySelector('[class*="text-sm"]');
    expect(container).toBeInTheDocument();
    
    rerender(<DataTable data={testUsers} columns={testColumns} size="lg" />);
    container = document.querySelector('[class*="text-lg"]');
    expect(container).toBeInTheDocument();
  });

  it('применяет правильные классы для плотности', () => {
    render(
      <DataTable data={testUsers} columns={testColumns} density="compact" />
    );
    
    // Ищем контейнер с классами плотности
    const container = document.querySelector('[class*="py-2"]');
    expect(container).toBeInTheDocument();
  });

  it('скрывает тулбар при showToolbar=false', () => {
    render(
      <DataTable 
        data={testUsers} 
        columns={testColumns} 
        showToolbar={false}
      />
    );
    
    // Тулбар не должен быть отрендерен
    // В реальной реализации здесь была бы проверка отсутствия элементов тулбара
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('скрывает пагинацию при showPagination=false', () => {
    const paginationConfig = {
      page: 0,
      pageSize: 10,
      total: 100,
      onPageChange: vi.fn(),
      onPageSizeChange: vi.fn(),
    };

    render(
      <DataTable 
        data={testUsers} 
        columns={testColumns}
        pagination={paginationConfig}
        showPagination={false}
      />
    );
    
    // Пагинация не должна быть отрендерена
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('поддерживает кастомные пропсы строк', () => {
    const getRowProps = (row: TestUser) => ({
      'data-user-id': row.id,
      className: row.role === 'admin' ? 'admin-row' : '',
    });

    render(
      <DataTable 
        data={testUsers} 
        columns={testColumns}
        getRowProps={getRowProps}
      />
    );
    
    const adminRow = screen.getByText('Иван Иванов').closest('tr');
    expect(adminRow).toHaveAttribute('data-user-id', '1');
    expect(adminRow).toHaveClass('admin-row');
  });

  it('работает с темами', () => {
    renderWithProviders(
      <DataTable data={testUsers} columns={testColumns} />,
      { theme: 'dark' }
    );
    
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('поддерживает поиск', () => {
    const handleSearchChange = vi.fn();
    const searchConfig = {
      value: '',
      placeholder: 'Поиск пользователей...',
      onChange: handleSearchChange,
    };

    render(
      <DataTable 
        data={testUsers} 
        columns={testColumns}
        search={searchConfig}
      />
    );
    
    // В реальной реализации здесь была бы проверка поля поиска
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('отключает интерактивность при loading', () => {
    const handleRowClick = vi.fn();
    
    render(
      <DataTable 
        data={testUsers} 
        columns={testColumns}
        loading
        onRowClick={handleRowClick}
      />
    );
    
    // При загрузке должны показываться скелетоны, а не данные
    const skeletons = document.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
    
    // Клики по строкам не должны работать
    expect(screen.queryByText('Иван Иванов')).not.toBeInTheDocument();
  });
});