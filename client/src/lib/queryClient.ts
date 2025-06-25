import { QueryClient } from "@tanstack/react-query";

// ユーザーID生成・取得関数
export function getCurrentUserId(): string {
  const storageKey = 'fridgekeeper_user_id';
  let userId = localStorage.getItem(storageKey);

  if (!userId) {
    userId = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem(storageKey, userId);
    console.log('Generated new user ID:', userId);
  } else {
    console.log('Using existing user ID:', userId);
  }

  return userId;
}

// API リクエスト関数
export async function apiRequest(method: string, endpoint: string, data?: any) {
  const userId = getCurrentUserId();
  console.log(`Making ${method} request to ${endpoint} with user ID:`, userId);

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-User-ID': userId,
    },
    credentials: 'include',
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(endpoint, config);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API Error: ${method} ${endpoint} - ${response.status}`, errorText);
    throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log(`API Success: ${method} ${endpoint}`, result);
  return result;
}

// React Query設定
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 完全なデフォルトqueryFn
      queryFn: async ({ queryKey }) => {
        const endpoint = queryKey[0] as string;
        return await apiRequest("GET", endpoint);
      },
      staleTime: 5 * 60 * 1000, // 5分
      gcTime: 10 * 60 * 1000, // 10分
      retry: (failureCount, error: any) => {
        if (error?.message?.includes('404') || error?.message?.includes('401')) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 2,
    },
  },
});