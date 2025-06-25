import { QueryClient } from "@tanstack/react-query";

// Create and export the query client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
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