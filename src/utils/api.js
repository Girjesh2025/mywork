const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Mock data for fallback when API is not available
const mockProjects = [
  {
    id: 1,
    name: "MyWork Dashboard",
    description: "A comprehensive project management dashboard",
    status: "active",
    priority: "high",
    created_at: "2024-10-01T10:00:00Z",
    updated_at: "2024-10-08T15:30:00Z",
    progress: 75
  },
  {
    id: 2,
    name: "E-commerce Platform",
    description: "Building a modern e-commerce solution",
    status: "planned",
    priority: "medium",
    created_at: "2024-10-05T09:00:00Z",
    updated_at: "2024-10-08T12:00:00Z",
    progress: 25
  },
  {
    id: 3,
    name: "Mobile App Development",
    description: "Cross-platform mobile application",
    status: "on_hold",
    priority: "low",
    created_at: "2024-09-20T14:00:00Z",
    updated_at: "2024-10-01T16:00:00Z",
    progress: 10
  }
];

export const apiCall = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };
  
  try {
    const response = await fetch(url, mergedOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    
    // Return mock data for projects endpoint when API fails
    if (endpoint === '/api/projects' && options.method !== 'POST') {
      console.log('Returning mock project data due to API failure');
      return mockProjects;
    }
    
    throw error;
  }
};

export const fetchProjects = () => apiCall('/api/projects');

export const addProject = (project) => apiCall('/api/projects', {
  method: 'POST',
  body: JSON.stringify(project),
});

export const updateProject = (id, updates) => apiCall(`/api/projects/${id}`, {
  method: 'PUT',
  body: JSON.stringify(updates),
});

export const deleteProject = (id) => apiCall(`/api/projects/${id}`, { method: 'DELETE' });

export const getTasks = () => apiCall('/api/tasks');
export const addTask = (task) => apiCall('/api/tasks', { method: 'POST', body: JSON.stringify(task) });
export const updateTask = (id, task) => apiCall(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify(task) });
export const deleteTask = (id) => apiCall(`/api/tasks/${id}`, { method: 'DELETE' });