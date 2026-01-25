/**
 * @fileoverview Общие типы и интерфейсы для компонентов дизайн-системы
 * 
 * Этот файл содержит базовые типы, интерфейсы и утилиты, используемые
 * во всех компонентах дизайн-системы для обеспечения консистентности
 * и типобезопасности.
 * 
 * @author Telegram Bot Builder Team
 * @version 1.0.0
 */

import { type VariantProps } from "class-variance-authority";

/**
 * Базовые размеры компонентов в дизайн-системе
 * 
 * @example
 * ```tsx
 * // Использование в компоненте
 * interface MyComponentProps {
 *   size?: ComponentSize;
 * }
 * ```
 */
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/**
 * Семантические цвета для компонентов
 * 
 * @description
 * Используются для передачи смысловой нагрузки через цвет:
 * - `default` - обычное состояние
 * - `primary` - основные действия
 * - `secondary` - вторичные действия
 * - `success` - успешные операции
 * - `warning` - предупреждения
 * - `error` - ошибки и опасные действия
 * - `info` - информационные сообщения
 * - `muted` - приглушенный текст
 */
export type SemanticColor =
    | 'default'
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'error'
    | 'info'
    | 'muted';

/**
 * Варианты компонентов для различных контекстов использования
 * 
 * @description
 * Стандартные варианты оформления компонентов:
 * - `default` - стандартное оформление
 * - `outline` - контурное оформление
 * - `ghost` - минималистичное оформление
 * - `filled` - заполненное оформление
 */
export type ComponentVariant = 'default' | 'outline' | 'ghost' | 'filled';

/**
 * Состояния загрузки для компонентов
 * 
 * @description
 * Используется для отображения различных состояний асинхронных операций:
 * - `idle` - компонент в покое
 * - `loading` - выполняется операция
 * - `success` - операция завершена успешно
 * - `error` - произошла ошибка
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Базовый интерфейс для всех компонентов дизайн-системы
 * 
 * @template T - HTML элемент, который представляет компонент
 * 
 * @description
 * Содержит общие свойства, которые должны поддерживать все компоненты:
 * - стандартные HTML атрибуты
 * - кастомные CSS классы
 * - ref forwarding
 * - children (опционально)
 * 
 * @example
 * ```tsx
 * interface MyComponentProps extends BaseComponentProps<HTMLDivElement> {
 *   title: string;
 *   variant?: ComponentVariant;
 * }
 * 
 * const MyComponent = React.forwardRef<HTMLDivElement, MyComponentProps>(
 *   ({ className, children, title, variant = 'default', ...props }, ref) => {
 *     return (
 *       <div ref={ref} className={cn('base-styles', className)} {...props}>
 *         <h2>{title}</h2>
 *         {children}
 *       </div>
 *     );
 *   }
 * );
 * ```
 */
export interface BaseComponentProps<T = HTMLElement>
    extends React.HTMLAttributes<T> {
    /**
     * Дополнительные CSS классы для кастомизации стилей
     * 
     * @description
     * Объединяется с базовыми классами компонента через утилиту `cn()`.
     * Позволяет переопределять стили или добавлять новые.
     * 
     * @example
     * ```tsx
     * <Button className="mt-4 bg-custom-color">
     *   Custom Button
     * </Button>
     * ```
     */
    className?: string;

    /**
     * Дочерние элементы компонента
     * 
     * @description
     * Может содержать любые React элементы, строки, числа или null/undefined.
     * Некоторые компоненты могут ограничивать типы допустимых children.
     */
    children?: React.ReactNode;
}

/**
 * Интерфейс для компонентов с поддержкой иконок
 * 
 * @description
 * Используется в компонентах, которые могут отображать иконки
 * в различных позициях (слева, справа, внутри).
 * 
 * @example
 * ```tsx
 * interface ButtonProps extends BaseComponentProps, WithIcon {
 *   variant?: ComponentVariant;
 * }
 * 
 * <Button icon={<Icon name="fa-solid fa-plus" />}>
 *   Add Item
 * </Button>
 * ```
 */
export interface WithIcon {
    /**
     * Иконка для отображения в компоненте
     * 
     * @description
     * Может быть React элементом (обычно компонент Icon) или строкой
     * с именем Font Awesome иконки. Позиция иконки зависит от конкретного
     * компонента.
     */
    icon?: React.ReactNode;

    /**
     * Имя Font Awesome иконки
     * 
     * @description
     * Альтернатива prop `icon`. Используется для быстрого указания
     * Font Awesome иконки без создания компонента Icon.
     * 
     * @example "fa-solid fa-user", "fa-regular fa-heart"
     */
    iconName?: string;
}

/**
 * Интерфейс для компонентов с состоянием загрузки
 * 
 * @description
 * Добавляет поддержку отображения состояния загрузки с индикатором.
 * Компоненты с этим интерфейсом обычно блокируют взаимодействие
 * во время загрузки.
 * 
 * @example
 * ```tsx
 * interface ButtonProps extends BaseComponentProps, WithLoading {
 *   onClick?: () => Promise<void>;
 * }
 * 
 * <Button loading disabled>
 *   Saving...
 * </Button>
 * ```
 */
export interface WithLoading {
    /**
     * Состояние загрузки компонента
     * 
     * @description
     * Когда `true`, компонент отображает индикатор загрузки
     * и обычно становится неактивным для взаимодействия.
     * 
     * @default false
     */
    loading?: boolean;

    /**
     * Текст для отображения во время загрузки
     * 
     * @description
     * Опциональный текст, который заменяет обычное содержимое
     * компонента во время загрузки.
     * 
     * @example "Сохранение...", "Загрузка данных..."
     */
    loadingText?: string;
}

/**
 * Интерфейс для компонентов с поддержкой валидации
 * 
 * @description
 * Используется в компонентах форм для отображения состояний
 * валидации и соответствующих сообщений.
 * 
 * @example
 * ```tsx
 * interface InputProps extends BaseComponentProps, WithValidation {
 *   value?: string;
 *   onChange?: (value: string) => void;
 * }
 * 
 * <Input 
 *   error="Это поле обязательно"
 *   placeholder="Email"
 * />
 * ```
 */
export interface WithValidation {
    /**
     * Сообщение об ошибке валидации
     * 
     * @description
     * Когда указано, компонент отображается в состоянии ошибки
     * с соответствующими стилями и сообщением.
     */
    error?: string;

    /**
     * Сообщение об успешной валидации
     * 
     * @description
     * Когда указано, компонент отображается в успешном состоянии
     * с соответствующими стилями и сообщением.
     */
    success?: string;

    /**
     * Обязательность поля
     * 
     * @description
     * Указывает, что поле является обязательным для заполнения.
     * Обычно отображается визуальным индикатором (звездочка).
     * 
     * @default false
     */
    required?: boolean;
}

/**
 * Интерфейс для интерактивных компонентов
 * 
 * @description
 * Используется для компонентов, которые могут быть отключены
 * или находиться в режиме только для чтения.
 * 
 * @example
 * ```tsx
 * interface ButtonProps extends BaseComponentProps, WithInteraction {
 *   onClick?: () => void;
 * }
 * 
 * <Button disabled>
 *   Disabled Button
 * </Button>
 * ```
 */
export interface WithInteraction {
    /**
     * Отключение компонента
     * 
     * @description
     * Когда `true`, компонент становится неактивным для взаимодействия
     * и отображается с соответствующими стилями.
     * 
     * @default false
     */
    disabled?: boolean;

    /**
     * Режим только для чтения
     * 
     * @description
     * Когда `true`, компонент отображает данные, но не позволяет
     * их изменять. Отличается от `disabled` тем, что остается
     * доступным для навигации и копирования.
     * 
     * @default false
     */
    readonly?: boolean;
}

/**
 * Утилитарный тип для извлечения вариантов из cva функции
 * 
 * @template T - Функция cva
 * 
 * @description
 * Используется для автоматического извлечения типов вариантов
 * из функций class-variance-authority для типобезопасности.
 * 
 * @example
 * ```tsx
 * const buttonVariants = cva("base-class", {
 *   variants: {
 *     size: { sm: "small", lg: "large" },
 *     variant: { primary: "primary", secondary: "secondary" }
 *   }
 * });
 * 
 * interface ButtonProps extends ExtractVariants<typeof buttonVariants> {
 *   children: React.ReactNode;
 * }
 * ```
 */
export type ExtractVariants<T> = T extends (...args: any[]) => any
    ? VariantProps<T>
    : never;

/**
 * Тип для обработчиков событий с дополнительными данными
 * 
 * @template T - Тип данных события
 * @template E - Тип HTML события (опционально)
 * 
 * @description
 * Используется для типизации обработчиков событий, которые
 * передают дополнительные данные помимо стандартного события.
 * 
 * @example
 * ```tsx
 * interface SelectProps {
 *   onSelectionChange?: EventHandler<string>;
 *   onMultipleSelectionChange?: EventHandler<string[]>;
 * }
 * 
 * const handleChange: EventHandler<string> = (value, event) => {
 *   console.log('Selected:', value);
 *   console.log('Event:', event);
 * };
 * ```
 */
export type EventHandler<T, E extends Event = Event> = (
    data: T,
    event?: E
) => void;

/**
 * Тип для асинхронных обработчиков событий
 * 
 * @template T - Тип данных события
 * @template E - Тип HTML события (опционально)
 * 
 * @description
 * Используется для обработчиков, которые выполняют асинхронные операции.
 * Позволяет компонентам отображать состояние загрузки во время выполнения.
 * 
 * @example
 * ```tsx
 * interface FormProps {
 *   onSubmit?: AsyncEventHandler<FormData>;
 * }
 * 
 * const handleSubmit: AsyncEventHandler<FormData> = async (data) => {
 *   await api.saveForm(data);
 * };
 * ```
 */
export type AsyncEventHandler<T, E extends Event = Event> = (
    data: T,
    event?: E
) => Promise<void>;

/**
 * Конфигурация для компонентов с пагинацией
 * 
 * @description
 * Стандартный интерфейс для компонентов, поддерживающих пагинацию
 * данных (таблицы, списки, карусели).
 * 
 * @example
 * ```tsx
 * interface DataTableProps {
 *   data: any[];
 *   pagination?: PaginationConfig;
 * }
 * 
 * <DataTable 
 *   data={items}
 *   pagination={{
 *     page: 1,
 *     pageSize: 10,
 *     total: 100,
 *     onPageChange: (page) => setCurrentPage(page)
 *   }}
 * />
 * ```
 */
export interface PaginationConfig {
    /**
     * Текущая страница (начинается с 1)
     */
    page: number;

    /**
     * Количество элементов на странице
     */
    pageSize: number;

    /**
     * Общее количество элементов
     */
    total: number;

    /**
     * Обработчик изменения страницы
     */
    onPageChange: (page: number) => void;

    /**
     * Обработчик изменения размера страницы
     */
    onPageSizeChange?: (pageSize: number) => void;

    /**
     * Показывать ли информацию о количестве элементов
     * 
     * @default true
     */
    showTotal?: boolean;

    /**
     * Показывать ли селектор размера страницы
     * 
     * @default false
     */
    showSizeChanger?: boolean;
}

/**
 * Конфигурация для сортировки данных
 * 
 * @template T - Тип объекта данных
 * 
 * @description
 * Используется в компонентах для настройки сортировки данных
 * по различным полям.
 * 
 * @example
 * ```tsx
 * interface User {
 *   name: string;
 *   email: string;
 *   createdAt: Date;
 * }
 * 
 * interface UserTableProps {
 *   users: User[];
 *   sorting?: SortConfig<User>;
 * }
 * 
 * <UserTable 
 *   users={users}
 *   sorting={{
 *     field: 'name',
 *     direction: 'asc',
 *     onSort: (field, direction) => handleSort(field, direction)
 *   }}
 * />
 * ```
 */
export interface SortConfig<T = any> {
    /**
     * Поле для сортировки
     */
    field: keyof T;

    /**
     * Направление сортировки
     */
    direction: 'asc' | 'desc';

    /**
     * Обработчик изменения сортировки
     */
    onSort: (field: keyof T, direction: 'asc' | 'desc') => void;
}

/**
 * Конфигурация для фильтрации данных
 * 
 * @template T - Тип объекта данных
 * 
 * @description
 * Используется для настройки фильтрации данных в компонентах
 * списков и таблиц.
 * 
 * @example
 * ```tsx
 * interface ProductFilters {
 *   category?: string;
 *   priceRange?: [number, number];
 *   inStock?: boolean;
 * }
 * 
 * <ProductList 
 *   products={products}
 *   filters={{
 *     values: filters,
 *     onChange: setFilters,
 *     onReset: () => setFilters({})
 *   }}
 * />
 * ```
 */
export interface FilterConfig<T = Record<string, any>> {
    /**
     * Текущие значения фильтров
     */
    values: Partial<T>;

    /**
     * Обработчик изменения фильтров
     */
    onChange: (filters: Partial<T>) => void;

    /**
     * Обработчик сброса фильтров
     */
    onReset?: () => void;

    /**
     * Показывать ли кнопку сброса фильтров
     * 
     * @default true
     */
    showReset?: boolean;
}

/**
 * Тип для определения брейкпоинтов адаптивности
 * 
 * @description
 * Используется для создания адаптивных компонентов, которые
 * изменяют свое поведение в зависимости от размера экрана.
 * 
 * @example
 * ```tsx
 * interface ResponsiveGridProps {
 *   columns: ResponsiveValue<number>;
 * }
 * 
 * <ResponsiveGrid 
 *   columns={{
 *     base: 1,
 *     md: 2,
 *     lg: 3,
 *     xl: 4
 *   }}
 * />
 * ```
 */
export type ResponsiveValue<T> = T | {
    base?: T;
    sm?: T;
    md?: T;
    lg?: T;
    xl?: T;
    '2xl'?: T;
};

/**
 * Утилитарные типы для работы с темами
 */
export namespace ThemeTypes {
    /**
     * Доступные темы в системе
     */
    export type Theme = 'light' | 'dark' | 'system';

    /**
     * Конфигурация темы
     */
    export interface ThemeConfig {
        /**
         * Текущая тема
         */
        theme: Theme;

        /**
         * Функция для изменения темы
         */
        setTheme: (theme: Theme) => void;

        /**
         * Системная тема (определяется автоматически)
         */
        systemTheme?: 'light' | 'dark';

        /**
         * Разрешенные темы
         */
        themes?: Theme[];
    }
}

/**
 * Экспорт всех типов для удобного импорта
 * 
 * @example
/**
 * Все типы уже экспортированы выше в соответствующих разделах
 * Этот комментарий служит для документации доступных экспортов
 * 
 * @example
 * ```tsx
 * import type { 
 *   BaseComponentProps, 
 *   ComponentSize, 
 *   SemanticColor 
 * } from '@/components/types/component-types';
 * ```
 */