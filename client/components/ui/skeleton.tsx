import { cn } from "@/lib/utils";

/**
 * Компонент скелетона
 *
 * @component
 * @description Временный элемент-заполнитель, который используется во время загрузки контента.
 *
 * @param {string} className - Дополнительные CSS-классы
 * @param {object} props - Прочие свойства, передаваемые в компонент
 *
 * @example
 * <Skeleton className="h-10 w-full" />
 *
 * @returns {JSX.Element} Скелетон
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

/**
 * Скелетон для редактора
 *
 * @component
 * @description Предустановленный скелетон для интерфейса редактора.
 *
 * @example
 * <EditorSkeleton />
 *
 * @returns {JSX.Element} Скелетон редактора
 */
function EditorSkeleton() {
  return (
    <div className="flex h-screen">
      {/* Боковая панель */}
      <div className="w-64 border-r bg-background p-4 space-y-4">
        <Skeleton className="h-8 w-full" />
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>

      {/* Основная область */}
      <div className="flex-1 flex flex-col">
        {/* Заголовок */}
        <div className="border-b h-16 flex items-center px-6 space-x-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>

        {/* Холст */}
        <div className="flex-1 flex">
          <div className="flex-1 p-6">
            <div className="grid grid-cols-3 gap-6">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>

          {/* Панель свойств */}
          <div className="w-80 border-l p-4 space-y-4">
            <Skeleton className="h-8 w-full" />
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Скелетон для проектов
 *
 * @component
 * @description Предустановленный скелетон для страницы проектов.
 *
 * @example
 * <ProjectsSkeleton />
 *
 * @returns {JSX.Element} Скелетон проектов
 */
function ProjectsSkeleton() {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="flex space-x-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex space-x-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Скелетон для шаблонов
 *
 * @component
 * @description Предустановленный скелетон для страницы шаблонов.
 *
 * @example
 * <TemplatesSkeleton />
 *
 * @returns {JSX.Element} Скелетон шаблонов
 */
function TemplatesSkeleton() {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <Skeleton className="h-8 w-40 mb-4" />
        <div className="flex space-x-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-3">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { Skeleton, EditorSkeleton, ProjectsSkeleton, TemplatesSkeleton };
