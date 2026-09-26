const apiOrigin = import.meta.env.PROD
  ? ''
  : (import.meta.env.VITE_API_BASE_URL || '');

const request = async (path, options = {}) => {
  const response = await fetch(`${apiOrigin}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const text = await response.text();
  let payload = null;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = text; }
  if (!response.ok) {
    const message = payload?.error || payload?.message || `Request failed (${response.status})`;
    throw new Error(message);
  }
  return payload;
};

const list = (resource) => request(`/api/${resource}`);
const create = (resource, data) => request(`/api/${resource}`, { method: 'POST', body: JSON.stringify(data) });
const update = (resource, id, data) => request(`/api/${resource}/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
const remove = (resource, id) => request(`/api/${resource}/${id}`, { method: 'DELETE' });

export const getMe = () => request('/api/me');
export const getDashboard = () => request('/api/dashboard');
export const getProfile = () => request('/api/profile');
export const updateProfile = (data) => request('/api/profile', { method: 'PATCH', body: JSON.stringify(data) });

export const getSkills = () => list('skills');
export const createSkill = (data) => create('skills', data);
export const updateSkill = (id, data) => update('skills', id, data);
export const deleteSkill = (id) => remove('skills', id);

export const getProjects = () => list('projects');
export const createProject = (data) => create('projects', data);
export const updateProject = (id, data) => update('projects', id, data);
export const deleteProject = (id) => remove('projects', id);

export const getApplications = () => list('applications');
export const createApplication = (data) => create('applications', data);
export const updateApplication = (id, data) => update('applications', id, data);
export const deleteApplication = (id) => remove('applications', id);

export const getInterviewTopics = () => list('interview-topics');
export const createInterviewTopic = (data) => create('interview-topics', data);
export const updateInterviewTopic = (id, data) => update('interview-topics', id, data);
export const deleteInterviewTopic = (id) => remove('interview-topics', id);

export const getRoadmaps = () => list('roadmaps');
export const createRoadmap = (data) => create('roadmaps', data);
export const updateRoadmap = (id, data) => update('roadmaps', id, data);
export const deleteRoadmap = (id) => remove('roadmaps', id);

export const getNotifications = () => list('notifications');
export const updateNotification = (id, data) => update('notifications', id, data);
export const deleteNotification = (id) => remove('notifications', id);
