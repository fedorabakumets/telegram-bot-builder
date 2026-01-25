/**
 * @fileoverview Главный экспорт всех компонентов дизайн-системы
 * 
 * Этот файл предоставляет единую точку входа для импорта всех компонентов,
 * типов и утилит дизайн-системы. Используйте его для удобного импорта
 * компонентов в вашем приложении.
 * 
 * @example
 * ```tsx
 * // Импорт компонентов
 * import { Button, Input, FormField, DataTable } from '@/components';
 * 
 * // Импорт типов
 * import type { ButtonProps, InputProps } from '@/components';
 * ```
 * 
 * @author Telegram Bot Builder Team
 * @version 1.0.0
 */

// =============================================================================
// АТОМАРНЫЕ КОМПОНЕНТЫ (ATOMS)
// =============================================================================

/**
 * Базовые неделимые компоненты дизайн-системы
 * 
 * Атомы представляют собой самые простые UI элементы, которые не могут
 * быть разбиты на более мелкие части. Они служат строительными блоками
 * для более сложных компонентов.
 */

// Button - универсальная кнопка с множеством вариантов
export { Button, buttonVariants } from './atoms/Button/Button';
export type { ButtonProps } from './atoms/Button/Button';

// Input - поле ввода с поддержкой иконок и валидации
export { Input, inputVariants } from './atoms/Input/Input';
export type { InputProps } from './atoms/Input/Input';

// Icon - универсальный компонент для иконок
export { Icon, iconVariants } from './atoms/Icon/Icon';
export type { IconProps } from './atoms/Icon/Icon';

// Label - метка для элементов форм
export { Label, labelVariants } from './atoms/Label/Label';
export type { LabelProps } from './atoms/Label/Label';

// Typography - типографические элементы
export { Typography, typographyVariants } from './atoms/Typography/Typography';
export type { TypographyProps } from './atoms/Typography/Typography';

// =============================================================================
// МОЛЕКУЛЯРНЫЕ КОМПОНЕНТЫ (MOLECULES)
// =============================================================================

/**
 * Составные компоненты из атомов
 * 
 * Молекулы объединяют несколько атомов для создания более функциональных
 * UI элементов. Они представляют собой простые группы элементов,
 * работающих вместе как единое целое.
 */

// FormField - универсальное поле формы с label и валидацией
export { FormField, formFieldVariants } from './molecules/FormField/FormField';
export type { FormFieldProps } from './molecules/FormField/FormField';

// SearchBox - поле поиска с автокомплитом
export { SearchBox, searchBoxVariants } from './molecules/SearchBox/SearchBox';
export type { SearchBoxProps } from './molecules/SearchBox/SearchBox';

// StatCard - карточка статистики с индикаторами изменений
export { StatCard, statCardVariants, changeVariants } from './molecules/StatCard/StatCard';
export type { StatCardProps } from './molecules/StatCard/StatCard';

// UserAvatar - аватар пользователя с статусом
export { UserAvatar, userAvatarVariants } from './molecules/UserAvatar/UserAvatar';
export type { UserAvatarProps } from './molecules/UserAvatar/UserAvatar';

// =============================================================================
// ОРГАНИЗМЕННЫЕ КОМПОНЕНТЫ (ORGANISMS)
// =============================================================================

/**
 * Сложные компоненты из молекул и атомов
 * 
 * Организмы представляют собой относительно сложные компоненты,
 * состоящие из групп молекул и/или атомов и/или других организмов.
 * Они формируют отдельные разделы интерфейса.
 */

// DataTable - универсальная таблица данных
export { DataTable, dataTableVariants } from './organisms/DataTable/DataTable';
export type { DataTableProps, ColumnDef } from './organisms/DataTable/DataTable';

// FormSection - секция формы с группировкой полей
export { FormSection, formSectionVariants } from './organisms/FormSection/FormSection';
export type { FormSectionProps } from './organisms/FormSection/FormSection';

// Navigation - навигационное меню
export { Navigation, navigationVariants } from './organisms/Navigation/Navigation';
export type { NavigationProps, NavigationItem } from './organisms/Navigation/Navigation';

// UserCard - карточка пользователя с действиями
export { UserCard, userCardVariants } from './organisms/UserCard/UserCard';
export type { UserCardProps } from './organisms/UserCard/UserCard';

// =============================================================================
// ШАБЛОНЫ (TEMPLATES)
// =============================================================================

/**
 * Макеты страниц
 * 
 * Шаблоны состоят в основном из групп организмов, объединенных вместе
 * для формирования страниц. Они определяют структуру контента,
 * но не содержат конкретных данных.
 */

// DashboardLayout - макет для административных страниц
export { DashboardLayout, dashboardLayoutVariants } from './templates/DashboardLayout/DashboardLayout';
export type { DashboardLayoutProps } from './templates/DashboardLayout/DashboardLayout';

// EditorLayout - макет для редактора ботов
export { EditorLayout, editorLayoutVariants } from './templates/EditorLayout/EditorLayout';
export type { EditorLayoutProps } from './templates/EditorLayout/EditorLayout';

// AuthLayout - макет для страниц авторизации
export { AuthLayout, authLayoutVariants } from './templates/AuthLayout/AuthLayout';
export type { AuthLayoutProps } from './templates/AuthLayout/AuthLayout';

// =============================================================================
// ТИПЫ И УТИЛИТЫ
// =============================================================================

/**
 * Общие типы и интерфейсы
 * 
 * Экспорт всех типов, интерфейсов и утилит, используемых
 * в компонентах дизайн-системы.
 */

// Базовые типы компонентов
export type {
  ComponentSize,
  SemanticColor,
  ComponentVariant,
  LoadingState,
  BaseComponentProps,
  WithIcon,
  WithLoading,
  WithValidation,
  WithInteraction,
  ExtractVariants,
  EventHandler,
  AsyncEventHandler,
  PaginationConfig,
  SortConfig,
  FilterConfig,
  ResponsiveValue,
  ThemeTypes,
} from './types/component-types';

// =============================================================================
// ДИЗАЙН-СИСТЕМА
// =============================================================================

/**
 * Дизайн-токены и утилиты
 * 
 * Экспорт токенов дизайн-системы, тем и утилит для работы с ними.
 */

// Дизайн-токены
export { colors } from '../design-system/tokens/colors';
export { typography } from '../design-system/tokens/typography';
export { spacing } from '../design-system/tokens/spacing';
export { shadows } from '../design-system/tokens/shadows';

// Темы
export { lightTheme } from '../design-system/themes/light';
export { darkTheme } from '../design-system/themes/dark';

// Утилиты
export { cn } from '../lib/utils';

// =============================================================================
// ПРОВАЙДЕРЫ И ХУКИ
// =============================================================================

/**
 * Контекстные провайдеры и хуки
 * 
 * Компоненты и хуки для управления глобальным состоянием
 * дизайн-системы (темы, настройки и т.д.).
 */

// Провайдер тем
export { ThemeProvider } from './theme-provider';
export { useTheme } from './theme-provider';

// =============================================================================
// КОНСТАНТЫ И КОНФИГУРАЦИЯ
// =============================================================================

/**
 * Константы дизайн-системы
 * 
 * Общие константы, используемые в компонентах.
 */

/**
 * Версия дизайн-системы
 * 
 * @description
 * Семантическая версия текущей версии дизайн-системы.
 * Используется для отслеживания изменений и совместимости.
 */
export const DESIGN_SYSTEM_VERSION = '1.0.0';

/**
 * Префикс для CSS классов дизайн-системы
 * 
 * @description
 * Используется для избежания конфликтов с другими CSS фреймворками.
 * Все классы компонентов должны начинаться с этого префикса.
 */
export const CSS_PREFIX = 'ds-';

/**
 * Поддерживаемые размеры экранов
 * 
 * @description
 * Брейкпоинты для адаптивного дизайна, соответствующие
 * настройкам Tailwind CSS.
 */
export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

/**
 * Анимационные переходы по умолчанию
 * 
 * @description
 * Стандартные значения для CSS transitions, обеспечивающие
 * консистентность анимаций во всех компонентах.
 */
export const TRANSITIONS = {
  fast: '150ms ease-in-out',
  normal: '200ms ease-in-out',
  slow: '300ms ease-in-out',
} as const;

/**
 * Z-index значения для слоев
 * 
 * @description
 * Стандартизированные z-index значения для правильного
 * наложения элементов интерфейса.
 */
export const Z_INDEX = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modal: 1040,
  popover: 1050,
  tooltip: 1060,
  toast: 1070,
} as const;

// =============================================================================
// ЭКСПОРТ ПО УМОЛЧАНИЮ
// =============================================================================

/**
 * Объект с основными компонентами для удобного импорта
 * 
 * @description
 * Предоставляет альтернативный способ импорта компонентов
 * через деструктуризацию объекта по умолчанию.
 * 
 * @example
 * ```tsx
 * import Components from '@/components';
 * 
 * const { Button, Input, FormField } = Components;
 * ```
 */
const Components = {
  // Atoms
  Button,
  Input,
  Icon,
  Label,
  Typography,
  
  // Molecules
  FormField,
  SearchBox,
  StatCard,
  UserAvatar,
  
  // Organisms
  DataTable,
  FormSection,
  Navigation,
  UserCard,
  
  // Templates
  DashboardLayout,
  EditorLayout,
  AuthLayout,
  
  // Providers
  ThemeProvider,
  
  // Utils
  cn,
} as const;

export default Components;

/**
 * Типы для TypeScript автодополнения
 * 
 * @description
 * Дополнительные типы для улучшения опыта разработки
 * с TypeScript автодополнением и проверкой типов.
 */

/**
 * Тип для всех доступных компонентов
 */
export type ComponentName = keyof typeof Components;

/**
 * Тип для всех вариантов размеров
 */
export type AllSizes = ComponentSize;

/**
 * Тип для всех семантических цветов
 */
export type AllColors = SemanticColor;

/**
 * Тип для всех вариантов компонентов
 */
export type AllVariants = ComponentVariant;