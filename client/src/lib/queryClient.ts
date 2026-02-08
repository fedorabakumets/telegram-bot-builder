import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorData;
    try {
      // Пытаемся распарсить JSON ответ с ошибкой
      errorData = await res.json();
    } catch (parseError) {
      // Если не удалось распарсить JSON, используем statusText
      throw new Error(`${res.status}: ${res.statusText}`);
    }
    
    // Создаем ошибку с сохранением всех свойств (включая requiresClientApi)
    const error = new Error(errorData.message || `${res.status}: ${res.statusText}`);
    // Добавляем все свойства из ответа к ошибке
    Object.assign(error, errorData);
    throw error;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<any> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : null,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return await res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const queryFn = getQueryFn({ on401: "throw" });
        return queryFn({ queryKey } as any);
      },
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: (query) => {
        // Шаблоны и проекты имеют короче время жизни кеша для динамичности
        const key = query.queryKey[0];
        if (typeof key === 'string' && (key.includes('/api/templates') || key.includes('/api/projects'))) {
          return 1 * 60 * 1000; // 1 минута для шаблонов и проектов
        }
        return 10 * 60 * 1000; // 10 минут для остального
      },
      gcTime: 30 * 60 * 1000, // 30 минут в garbage collection
      retry: (failureCount, error: any) => {
        if (error?.message?.includes('503') || error?.message?.includes('загружается')) {
          return failureCount < 5;
        }
        return failureCount < 1;
      },
      retryDelay: (attemptIndex, error: any) => {
        if (error?.message?.includes('503') || error?.message?.includes('загружается')) {
          return Math.min(1000 * Math.pow(1.5, attemptIndex), 3000);
        }
        return Math.min(1000 * Math.pow(2, attemptIndex), 30000);
      },
    },
    mutations: {
      retry: false,
    },
  },
});
