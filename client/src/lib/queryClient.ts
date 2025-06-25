
// ユーザーID管理
export function getCurrentUserId(): string {
  let userId = localStorage.getItem('user-id');
  if (!userId) {
    userId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('user-id', userId);
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
}

// React Query設定
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const endpoint = queryKey[0] as string;
        return await apiRequest("GET", endpoint);
      },
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
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
