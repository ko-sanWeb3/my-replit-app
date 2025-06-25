import { QueryClient } from "@tanstack/react-query";

// Generate or get user ID with better persistence
function getUserId(): string {
  try {
    let userId = localStorage.getItem('user-id');
    if (!userId || userId === 'undefined' || userId === 'null') {
      userId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('user-id', userId);
      console.log('Generated new user ID:', userId);
    } else {
      console.log('Using existing user ID:', userId);
    }
    return userId;
  } catch (error) {
    console.error('Error accessing localStorage:', error);
    return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Reset user ID (for debugging)
export function resetUserId(): string {
  const userId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('user-id', userId);
  console.log('Reset to new user ID:', userId);
  return userId;
}

// API request helper with user ID and better error handling
export async function apiRequest(method: string, endpoint: string, data?: any) {
  const userId = getUserId();
  console.log(`Making ${method} request to ${endpoint} with user ID:`, userId);

  try {
    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': userId,
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      console.error(`API Error: ${method} ${endpoint} - ${response.status} ${response.statusText}`);
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`API Success: ${method} ${endpoint}`, result);
    return result;
  } catch (error) {
    console.error(`API Request Failed: ${method} ${endpoint}`, error);
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
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error) => {
        console.error(`Query failed (attempt ${failureCount}):`, error);
        return failureCount < 3;
      },
      onError: (error) => {
        console.error('Query error:', error);
      },
    },
    mutations: {
      onError: (error) => {
        console.error('Mutation error:', error);
      },
    },
  },
});