
import { QueryClient } from "@tanstack/react-query";

// User ID management - 完全に固定化
const STORAGE_KEY = 'food_app_user_id';
let CACHED_USER_ID: string | null = null;

function getCurrentUserId(): string {
  // キャッシュされたユーザーIDがあればそれを使用
  if (CACHED_USER_ID) {
    return CACHED_USER_ID;
  }

  // localStorageから取得を試行
  let userId = localStorage.getItem(STORAGE_KEY);
  
  if (!userId || userId === 'undefined' || userId === 'null' || userId.trim() === '') {
    // 新しいユーザーIDを生成（より安定したID）
    userId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(STORAGE_KEY, userId);
    console.log('🆕 Generated new user ID:', userId);
  } else {
    console.log('✅ Using existing user ID:', userId);
  }

  // キャッシュに保存
  CACHED_USER_ID = userId;
  return userId;
}

// Export the current user ID
export { getCurrentUserId };

// Reset user ID (for debugging only)
export function resetUserId(): string {
  const userId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  localStorage.setItem(STORAGE_KEY, userId);
  CACHED_USER_ID = userId;
  console.log('🔄 Reset to new user ID:', userId);
  return userId;
}

// Enhanced API request helper
export async function apiRequest(method: string, endpoint: string, data?: any) {
  const userId = getCurrentUserId();
  console.log(`📡 ${method} ${endpoint} [User: ${userId}]`);

  try {
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
      console.error(`❌ API Error: ${method} ${endpoint} - ${response.status}`, errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`✅ API Success: ${method} ${endpoint}`, result);
    return result;
  } catch (error) {
    console.error(`💥 API Request Failed: ${method} ${endpoint}`, error);
    throw error;
  }
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const endpoint = queryKey[0] as string;
        return apiRequest("GET", endpoint);
      },
      staleTime: 1000 * 60 * 2, // 2分
      gcTime: 1000 * 60 * 10,   // 10分
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 2,
    },
  },
});
