// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// API utility function
export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
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
    throw error;
  }
};

// Specific API functions
export const fetchProjects = () => apiCall('/api/projects');

export const addProject = (project) => apiCall('/api/projects', {
  method: 'POST',
  body: JSON.stringify(project),
});

export const updateProject = (id, updates) => apiCall(`/api/projects/${id}`, {
  method: 'PUT',
  body: JSON.stringify(updates),
});

export const deleteProject = (id) => apiCall(`/api/projects/${id}`, {
  method: 'DELETE',
});

export const fetchTasks = () => apiCall('/api/tasks');