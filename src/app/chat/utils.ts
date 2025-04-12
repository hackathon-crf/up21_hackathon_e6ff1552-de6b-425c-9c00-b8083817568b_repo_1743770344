// Utility functions for chat

// Generate a unique ID with optional prefix
export function generateId(prefix: string = ''): string {
  return `${prefix}${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Extract API key from localStorage based on provider
export function getApiKey(provider: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(`${provider.toLowerCase()}_api_key`);
}

// Format timestamp
export function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Format source date
export function formatSourceDate(dateString?: string): string {
  if (!dateString) return "";
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric'
  });
}