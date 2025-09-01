import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      // Клонируем response для отладки
      const clonedRes = res.clone();
      const responseText = await clonedRes.text();
      console.log('Raw response text:', responseText);
      
      // Пытаемся распарсить JSON ответ с ошибкой
      const errorData = await res.json();
      console.log('Parsed error data:', errorData);
      
      // Создаем ошибку с сохранением всех свойств (включая requiresClientApi)
      const error = new Error(errorData.message || `${res.status}: ${res.statusText}`);
      // Добавляем все свойства из ответа к ошибке
      Object.assign(error, errorData);
      console.log('Final error object:', error);
      console.log('Error properties after assign:', Object.keys(error));
      throw error;
    } catch (parseError) {
      console.log('JSON parse error:', parseError);
      // Если не удалось распарсить JSON, используем statusText
      throw new Error(`${res.status}: ${res.statusText}`);
    }
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
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
