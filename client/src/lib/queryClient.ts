import { QueryClient } from "@tanstack/react-query";

// User ID management
const STORAGE_KEY = 'guest_user_id';
const SESSION_KEY = 'guest_session_active';

function getCurrentUserId(): string {
  // First check session storage for temporary persistence
  let userId = sessionStorage.getItem(STORAGE_KEY);

  if (!userId) {
    // Then check localStorage for permanent persistence
    userId = localStorage.getItem(STORAGE_KEY);
  }

  if (!userId) {
    // Generate new user ID with more entropy
    userId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    // Store in both storages
    localStorage.setItem(STORAGE_KEY, userId);
    sessionStorage.setItem(STORAGE_KEY, userId);
    sessionStorage.setItem(SESSION_KEY, 'true');
    console.log('Generated new user ID:', userId);
  } else {
    console.log('Using existing user ID:', userId);
    // Ensure it's in both storages
    localStorage.setItem(STORAGE_KEY, userId);
    sessionStorage.setItem(STORAGE_KEY, userId);
  }

  return userId;
}

// Initialize user ID immediately when module loads
const CURRENT_USER_ID = getCurrentUserId();

// Export the current user ID for consistent usage
export function getCurrentUserId(): string {
  return CURRENT_USER_ID;
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
  const userId = getCurrentUserId();
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