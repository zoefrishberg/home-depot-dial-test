import { projectId, publicAnonKey } from '/utils/supabase/info';
import { DeviceInfo } from './deviceDetection';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-640b0dec`;

export async function apiCall(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error(`API call failed: ${endpoint}`, errorData);
    throw new Error(errorData.error || `API request failed: ${response.statusText}`);
  }
  
  return response.json();
}

// Session management
export async function createSession(variant?: string, deviceInfo?: DeviceInfo, urlParams?: Record<string, string>) {
  return apiCall('/session/create', {
    method: 'POST',
    body: JSON.stringify({ variant, deviceInfo, urlParams }),
  });
}

export async function recordPageCompletion(
  sessionId: string,
  pageName: string,
  pageData?: Record<string, unknown>
) {
  return apiCall(`/session/${sessionId}/page`, {
    method: 'POST',
    body: JSON.stringify({ pageName, pageData }),
  });
}

export async function saveDialData(
  sessionId: string,
  pageType: 'tutorial' | 'actual' | 'video',
  dataPoints: Array<{ timestamp: number; button: string | null; intensity: number }>
) {
  return apiCall(`/session/${sessionId}/dialdata`, {
    method: 'POST',
    body: JSON.stringify({ pageType, dataPoints }),
  });
}

export async function getSessionData(sessionId: string) {
  return apiCall(`/session/${sessionId}`, {
    method: 'GET',
  });
}

export async function saveFeedback(
  sessionId: string,
  feedback: Record<string, string | number | boolean | null>
) {
  return apiCall(`/session/${sessionId}/feedback`, {
    method: 'POST',
    body: JSON.stringify(feedback),
  });
}

// Analysis endpoints
export async function getAllSessions() {
  return apiCall('/sessions/all', {
    method: 'GET',
  });
}