// API utility functions for backend integration

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Generic API request function
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Documents API
export const documentsApi = {
  // Upload a document
  async uploadDocument(formData: FormData) {
    const response = await fetch(`${API_BASE_URL}/documents/upload`, {
      method: 'POST',
      body: formData, // Don't set Content-Type for FormData
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Upload failed');
    }
    
    return await response.json();
  },

  // Get document details
  async getDocument(documentId: number) {
    return apiRequest(`/documents/${documentId}`);
  },

  // List documents
  async listDocuments(params: {
    is_college_wide?: boolean;
    department_id?: number;
    document_type?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    return apiRequest(`/documents?${queryParams}`);
  },

  // Search documents
  async searchDocuments(params: {
    query: string;
    is_college_wide?: boolean;
    department_name?: string;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    return apiRequest(`/documents/search?${queryParams}`);
  },

  // List events
  async listEvents(params: {
    is_college_wide?: boolean;
    department_id?: number;
    upcoming_only?: boolean;
    limit?: number;
    offset?: number;
  } = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    return apiRequest(`/documents/events?${queryParams}`);
  }
};

// Notifications API
export const notificationsApi = {
  // Get user notifications
  async getUserNotifications(userId: number, params: {
    unread_only?: boolean;
    limit?: number;
    offset?: number;
  } = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    return apiRequest(`/notifications/${userId}?${queryParams}`);
  },

  // Mark notification as read
  async markAsRead(notificationId: number, userId: number) {
    return apiRequest(`/notifications/${notificationId}/read?user_id=${userId}`, {
      method: 'PATCH',
    });
  },

  // Mark all notifications as read
  async markAllAsRead(userId: number) {
    return apiRequest(`/notifications/users/${userId}/read-all`, {
      method: 'PATCH',
    });
  },

  // Get notification stats
  async getNotificationStats(userId: number) {
    return apiRequest(`/notifications/${userId}/stats`);
  }
};

// Departments API
export const departmentsApi = {
  // List departments
  async listDepartments(activeOnly: boolean = true) {
    return apiRequest(`/departments?active_only=${activeOnly}`);
  },

  // Get department details
  async getDepartment(departmentId: number) {
    return apiRequest(`/departments/${departmentId}`);
  },

  // Get department users
  async getDepartmentUsers(departmentId: number, params: {
    role?: string;
    active_only?: boolean;
    limit?: number;
    offset?: number;
  } = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    return apiRequest(`/departments/${departmentId}/users?${queryParams}`);
  },

  // Get department events
  async getDepartmentEvents(departmentId: number, params: {
    upcoming_only?: boolean;
    limit?: number;
    offset?: number;
  } = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    return apiRequest(`/departments/${departmentId}/events?${queryParams}`);
  },

  // Get department documents
  async getDepartmentDocuments(departmentId: number, params: {
    limit?: number;
    offset?: number;
  } = {}) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    return apiRequest(`/departments/${departmentId}/documents?${queryParams}`);
  }
};

// System API
export const systemApi = {
  // Get system statistics
  async getStats() {
    return apiRequest('/stats');
  },

  // Health check
  async healthCheck() {
    return apiRequest('/', { 
      method: 'GET',
      headers: {} 
    });
  }
};

// Error handling utility
export class ApiError extends Error {
  constructor(message: string, public status?: number, public details?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

// File download utility
export function getDownloadUrl(filePath: string): string {
  return `${API_BASE_URL}/documents/download/${filePath}`;
}

// Upload progress tracking
export async function uploadWithProgress(
  formData: FormData,
  onProgress?: (progress: number) => void
): Promise<any> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = (event.loaded / event.total) * 100;
        onProgress(progress);
      }
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch (error) {
          reject(new Error('Invalid JSON response'));
        }
      } else {
        try {
          const errorData = JSON.parse(xhr.responseText);
          reject(new ApiError(errorData.detail || 'Upload failed', xhr.status, errorData));
        } catch (error) {
          reject(new ApiError(`HTTP error! status: ${xhr.status}`, xhr.status));
        }
      }
    });
    
    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });
    
    xhr.open('POST', `${API_BASE_URL}/documents/upload`);
    xhr.send(formData);
  });
}
