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
    body: data ? JSON.stringify(data) : undefined,
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
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 минут кэш для всех данных
      gcTime: 10 * 60 * 1000, // 10 минут в garbage collection
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
