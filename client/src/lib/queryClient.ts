
import { QueryClient } from "@tanstack/react-query";

// User ID management - 完全固定化
const STORAGE_KEY = 'food_app_user_id';
const SESSION_KEY = 'food_app_session';

// グローバルユーザーID変数（一度設定したら変更しない）
let GLOBAL_USER_ID: string | null = null;

function getCurrentUserId(): string {
  // すでにグローバル変数に設定されていればそれを使用
  if (GLOBAL_USER_ID) {
    console.log('✅ Using cached user ID:', GLOBAL_USER_ID);
    return GLOBAL_USER_ID;
  }

  // localStorageから取得
  let userId = localStorage.getItem(STORAGE_KEY);
  
  // sessionStorageからも取得を試行
  if (!userId || userId === 'undefined' || userId === 'null') {
    userId = sessionStorage.getItem(STORAGE_KEY);
  }
  
  if (!userId || userId === 'undefined' || userId === 'null' || userId.trim() === '') {
    // 新しいユーザーIDを生成
    userId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    console.log('🆕 Generated new user ID:', userId);
  } else {
    console.log('✅ Using existing user ID:', userId);
  }

  // すべてのストレージに保存
  localStorage.setItem(STORAGE_KEY, userId);
  sessionStorage.setItem(STORAGE_KEY, userId);
  sessionStorage.setItem(SESSION_KEY, 'active');
  
  // グローバル変数に固定
  GLOBAL_USER_ID = userId;
  
  return userId;
}

// Export the current user ID
export { getCurrentUserId };

// Reset user ID (for debugging only)
export function resetUserId(): string {
  const userId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  localStorage.setItem(STORAGE_KEY, userId);
  sessionStorage.setItem(STORAGE_KEY, userId);
  GLOBAL_USER_ID = userId;
  console.log('🔄 Reset to new user ID:', userId);
  return userId;
}

// Enhanced API request helper
export async function apiRequest(method: string, endpoint: string, data?: any) {
  const userId = getCurrentUserId();
  console.log(`Making ${method} request to ${endpoint} with user ID:`, userId);

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
    console.log(`API Success: ${method} ${endpoint}`, result);
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
        const userId = getCurrentUserId();
        console.log(`🔗 React Query request: ${endpoint} with user ID:`, userId);
        
        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            'Content-Type': 'application/json',
            'X-User-ID': userId,
          },
          credentials: 'include',
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Query Error: ${endpoint} - ${response.status}`, errorText);
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log(`✅ Query Success: ${endpoint}`, result);
        return result;
      },
      staleTime: 1000 * 60 * 5, // 5分
      gcTime: 1000 * 60 * 15,   // 15分
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      mutationFn: async ({ endpoint, method = 'POST', data }) => {
        const userId = getCurrentUserId();
        console.log(`🔗 React Query mutation: ${method} ${endpoint} with user ID:`, userId);
        
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
          console.error(`❌ Mutation Error: ${method} ${endpoint} - ${response.status}`, errorText);
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log(`✅ Mutation Success: ${method} ${endpoint}`, result);
        return result;
      },
      retry: 2,
    },
  },
});
