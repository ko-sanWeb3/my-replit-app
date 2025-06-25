import { QueryClient } from "@tanstack/react-query";

// Create and export the query client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey, signal }) => {
        // Get or generate user ID
        let userId = localStorage.getItem('userId');
        if (!userId || userId === 'undefined') {
          userId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          localStorage.setItem('userId', userId);
          console.log('Generated new user ID:', userId);
        }

        const url = queryKey[0] as string;
        console.log(`Fetching ${url} with user ID:`, userId);

        const response = await fetch(url, { 
          signal,
          credentials: "include",
          headers: {
            'X-User-ID': userId,
          },
        });
        if (!response.ok) {
          if (response.status >= 500) {
            throw new Error(`Server error: ${response.status}`);
          }
          throw new Error(`Request failed: ${response.status}`);
        }
        return response.json();
      },
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors, but retry on 5xx
        if (error instanceof Error && error.message.includes('Request failed: 4')) {
          return false;
        }
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      mutationFn: async ({ url, method = 'POST', data }) => {
        // Get or generate user ID
        let userId = localStorage.getItem('userId');
        if (!userId || userId === 'undefined') {
          userId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          localStorage.setItem('userId', userId);
          console.log('Generated new user ID for mutation:', userId);
        }

        console.log(`${method} ${url} with user ID:`, userId);

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'X-User-ID': userId,
          },
          credentials: "include",
          body: data ? JSON.stringify(data) : undefined,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`${method} ${url} failed: ${response.status} ${errorText}`);
        }

        return response.json();
      },
    },
  },
});

// User ID management
export function getUserId(): string {
  let userId = localStorage.getItem('userId');
  if (!userId) {
    userId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('userId', userId);
  }
  return userId;
}

// Custom fetch wrapper that adds authentication and user ID
export async function apiRequest(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  body?: any,
) {
  const userId = getUserId();

  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-User-ID": userId,
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(path, options);

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || errorJson.error || "Unknown error";
    } catch {
      errorMessage = errorText || `HTTP ${response.status}`;
    }
    throw new Error(errorMessage);
  }

  return response;
}