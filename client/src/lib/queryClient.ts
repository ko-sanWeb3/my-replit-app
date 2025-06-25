
import { QueryClient } from "@tanstack/react-query";

// 安定したユーザーID管理
export function getCurrentUserId(): string {
  const storageKey = 'fridge-keeper-user-id';
  let userId = localStorage.getItem(storageKey);
  
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(storageKey, userId);
    console.log('🆔 Generated new stable user ID:', userId);
  } else {
    console.log('🆔 Using existing stable user ID:', userId);
  }
  return userId;
}

// 統一API リクエスト関数
export async function apiRequest(method: string, endpoint: string, data?: any) {
  const userId = getCurrentUserId();
  console.log(`🌐 ${method} ${endpoint} [User: ${userId}]`);
  
  const response = await fetch(endpoint, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-User-ID': userId,
    },
    credentials: 'include',
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ ${method} ${endpoint} failed:`, response.status, errorText);
    throw new Error(`${method} ${endpoint} failed: ${response.status}`);
  }

  const result = await response.json();
  console.log(`✅ ${method} ${endpoint} success`, result);
  return result;
}

// React Query設定
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const endpoint = queryKey[0] as string;
        return await apiRequest("GET", endpoint);
      },
      staleTime: 1000 * 60 * 5, // 5分
      gcTime: 1000 * 60 * 10,   // 10分
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
    mutations: {
      retry: 1,
    },
  },
});
