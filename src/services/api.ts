const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string) {
    const data = await this.request<{ user: any; token: string }>('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async logout() {
    await this.request('/logout', { method: 'POST' });
    this.setToken(null);
  }

  async getCurrentUser() {
    return this.request<any>('/user');
  }

  // Dashboard
  async getDashboardStats() {
    return this.request('/dashboard/stats');
  }

  async getRevenueData(year?: number) {
    const params = year ? `?year=${year}` : '';
    return this.request(`/dashboard/revenue${params}`);
  }

  async getTopProjects() {
    return this.request('/dashboard/top-projects');
  }

  async getRecentActivities() {
    return this.request('/dashboard/recent-activities');
  }

  // Projects
  async getProjects(params?: { status?: string; search?: string; page?: number }) {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', params.page.toString());
    const queryString = query.toString();
    return this.request(`/projects${queryString ? `?${queryString}` : ''}`);
  }

  async getProject(id: string) {
    return this.request(`/projects/${id}`);
  }

  async createProject(data: any) {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProject(id: string, data: any) {
    return this.request(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id: string) {
    return this.request(`/projects/${id}`, { method: 'DELETE' });
  }

  async approveProject(id: string) {
    return this.request(`/projects/${id}/approve`, { method: 'POST' });
  }

  async rejectProject(id: string, reason: string) {
    return this.request(`/projects/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejection_reason: reason }),
    });
  }

  async uploadProjectAttachment(projectId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const token = this.token;
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/attachments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || 'Upload failed');
    }

    return response.json();
  }

  async deleteProjectAttachment(projectId: string, attachmentId: string) {
    return this.request(`/projects/${projectId}/attachments/${attachmentId}`, {
      method: 'DELETE',
    });
  }

  getAttachmentDownloadUrl(projectId: string, attachmentId: string) {
    return `${API_BASE_URL}/projects/${projectId}/attachments/${attachmentId}/download`;
  }

  async getEssentialDocuments(params?: { search?: string }) {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    const queryString = query.toString();
    return this.request(`/essential-documents${queryString ? `?${queryString}` : ''}`);
  }

  async uploadEssentialDocument(title: string, file: File, description?: string) {
    const formData = new FormData();
    formData.append('title', title);
    if (description) formData.append('description', description);
    formData.append('file', file);

    const token = this.token;
    const response = await fetch(`${API_BASE_URL}/essential-documents`, {
      method: 'POST',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        Accept: 'application/json',
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || 'Upload failed');
    }

    return response.json();
  }

  getEssentialDocumentDownloadUrl(id: string) {
    return `${API_BASE_URL}/essential-documents/${id}/download`;
  }

  // Clients
  async getClients(params?: { search?: string; status?: string; type?: string; page?: number }) {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    if (params?.type) query.append('type', params.type);
    if (params?.page) query.append('page', params.page.toString());
    const queryString = query.toString();
    return this.request(`/clients${queryString ? `?${queryString}` : ''}`);
  }

  async getClientStats() {
    return this.request('/clients/stats');
  }

  async getClient(id: string) {
    return this.request(`/clients/${id}`);
  }

  async createClient(data: any) {
    return this.request('/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateClient(id: string, data: any) {
    return this.request(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getClientHistory(id: string) {
    return this.request(`/clients/${id}/history`);
  }

  async getClientActivities(id: string) {
    return this.request(`/clients/${id}/activities`);
  }

  // SPH
  async getSphList(params?: { status?: string; page?: number; search?: string; start_date?: string; end_date?: string }) {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    if (params?.start_date) query.append('start_date', params.start_date);
    if (params?.end_date) query.append('end_date', params.end_date);
    if (params?.page) query.append('page', params.page.toString());
    const queryString = query.toString();
    return this.request(`/sph${queryString ? `?${queryString}` : ''}`);
  }

  async getSph(id: string) {
    return this.request(`/sph/${id}`);
  }

  async createSph(data: any) {
    return this.request('/sph', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async generateSph(id: string) {
    return this.request(`/sph/${id}/generate`, { method: 'POST' });
  }

  async approveSph(id: string) {
    return this.request(`/sph/${id}/approve`, { method: 'POST' });
  }

  async rejectSph(id: string, reason: string) {
    return this.request(`/sph/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejection_reason: reason }),
    });
  }

  async clientDecisionSph(id: string, decision: 'accepted' | 'rejected') {
    return this.request(`/sph/${id}/client-decision`, {
      method: 'POST',
      body: JSON.stringify({ decision }),
    });
  }

  // Surat Audiensi
  async getAudiensiStats() {
    return this.request('/audiensi/stats');
  }

  async getAudiensiList(params?: { search?: string; page?: number; status?: string }) {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', params.page.toString());
    const queryString = query.toString();
    return this.request(`/audiensi${queryString ? `?${queryString}` : ''}`);
  }

  async getAudiensi(id: string) {
    return this.request(`/audiensi/${id}`);
  }

  async createAudiensi(data: any) {
    return this.request('/audiensi', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async approveAudiensi(id: string) {
    return this.request(`/audiensi/${id}/approve`, { method: 'POST' });
  }

  async rejectAudiensi(id: string, reason: string) {
    return this.request(`/audiensi/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejection_reason: reason }),
    });
  }

  async clientDecisionAudiensi(id: string, decision: 'accepted' | 'rejected') {
    return this.request(`/audiensi/${id}/client-decision`, {
      method: 'POST',
      body: JSON.stringify({ decision }),
    });
  }

  async generateAudiensi(id: string) {
    return this.request(`/audiensi/${id}/generate`, { method: 'POST' });
  }

  async getAudiensiTemplates() {
    return this.request('/audiensi-templates');
  }

  async createAudiensiTemplate(data: any) {
    return this.request('/audiensi-templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAudiensiTemplate(id: string, data: any) {
    return this.request(`/audiensi-templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAudiensiTemplate(id: string) {
    return this.request(`/audiensi-templates/${id}`, {
      method: 'DELETE',
    });
  }

  // Activities
  async getActivities(params?: { type?: string; project_id?: string; page?: number }) {
    const query = new URLSearchParams();
    if (params?.type) query.append('type', params.type);
    if (params?.project_id) query.append('project_id', params.project_id);
    if (params?.page) query.append('page', params.page.toString());
    const queryString = query.toString();
    return this.request<any>(`/activities${queryString ? `?${queryString}` : ''}`);
  }

  async createActivity(data: any, files?: File[]) {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        if (Array.isArray(data[key])) {
          formData.append(key, JSON.stringify(data[key]));
        } else {
          formData.append(key, data[key]);
        }
      }
    });
    if (files && files.length > 0) {
      files.forEach((file, index) => {
        formData.append(`attachments[${index}]`, file);
      });
    }

    const token = this.token;
    const response = await fetch(`${API_BASE_URL}/activities`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  async likeActivity(id: string) {
    return this.request<any>(`/activities/${id}/like`, { method: 'POST' });
  }

  async commentActivity(id: string, comment: string) {
    return this.request<any>(`/activities/${id}/comment`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
  }

  async setOffline() {
    return this.request('/activities/offline', { 
      method: 'POST',
      keepalive: true
    } as RequestInit);
  }

  async getOnlineUsers() {
    return this.request<any>('/activities/online-users');
  }

  async getUpcomingDeadlines() {
    return this.request<any>('/activities/deadlines');
  }

  async getUsersForMention() {
    return this.request<any>('/activities/users');
  }

  // Calendar
  async getCalendarEvents(params?: { start?: string; end?: string; user_id?: string }) {
    const query = new URLSearchParams();
    if (params?.start) query.append('start', params.start);
    if (params?.end) query.append('end', params.end);
    if (params?.user_id) query.append('user_id', params.user_id);
    const queryString = query.toString();
    return this.request(`/calendar/events${queryString ? `?${queryString}` : ''}`);
  }

  async createCalendarEvent(data: any) {
    return this.request('/calendar/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteCalendarEvent(id: string) {
    return this.request(`/calendar/events/${id}`, {
      method: 'DELETE',
    });
  }

  // Marketing Plan
  async getMarketingPlanColumns() {
    return this.request('/marketing-plan/columns');
  }

  async createMarketingTask(data: any) {
    return this.request('/marketing-plan/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMarketingTask(id: string, data: any) {
    return this.request(`/marketing-plan/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async moveMarketingTask(id: string, status: string) {
    return this.request(`/marketing-plan/tasks/${id}/move`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async deleteMarketingTask(id: string) {
    return this.request(`/marketing-plan/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  async getMarketingTaskComments(id: string) {
    return this.request(`/marketing-plan/tasks/${id}/comments`);
  }

  async addMarketingTaskComment(id: string, comment: string) {
    return this.request(`/marketing-plan/tasks/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
  }

  async getMarketingTaskHistory(id: string) {
    return this.request(`/marketing-plan/tasks/${id}/history`);
  }

  // Notifications
  async getNotifications(params?: { 
    page?: number; 
    type?: string; 
    project_id?: number; 
    date?: string; 
    search?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.type) queryParams.append('type', params.type);
    if (params?.project_id) queryParams.append('project_id', params.project_id.toString());
    if (params?.date) queryParams.append('date', params.date);
    if (params?.search) queryParams.append('search', params.search);
    
    const queryString = queryParams.toString();
    return this.request(`/notifications${queryString ? `?${queryString}` : ''}`);
  }

  async getNotificationCount() {
    return this.request('/notifications/count');
  }

  async getNotificationProjects() {
    return this.request('/notifications/projects');
  }

  async markNotificationAsRead(id: string) {
    return this.request(`/notifications/${id}/read`, { method: 'PUT' });
  }

  async markAllNotificationsAsRead() {
    return this.request('/notifications/read-all', { method: 'PUT' });
  }

  async deleteAllNotifications() {
    return this.request('/notifications/all', { method: 'DELETE' });
  }

  async deleteNotification(id: string) {
    return this.request(`/notifications/${id}`, { method: 'DELETE' });
  }

  // User & Settings
  async getProfile() {
    return this.request('/users/profile');
  }

  async updateProfile(data: any) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getUsers() {
    return this.request('/users');
  }

  // Permissions
  async getPermissions() {
    return this.request('/permissions');
  }

  async updatePermission(id: string, isEnabled: boolean) {
    return this.request(`/permissions/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ is_enabled: isEnabled }),
    });
  }

  // Activity Logs
  async getActivityLogs(params?: { module?: string; status?: string; action_type?: string; action_types?: string[]; search?: string; date_from?: string; date_to?: string; user_id?: string; page?: number }) {
    const query = new URLSearchParams();
    if (params?.module) query.append('module', params.module);
    if (params?.status) query.append('status', params.status);
    if (params?.action_type) query.append('action_type', params.action_type);
    if (params?.action_types && params.action_types.length > 0) {
      params.action_types.forEach(type => query.append('action_types[]', type));
    }
    if (params?.search) query.append('search', params.search);
    if (params?.date_from) query.append('date_from', params.date_from);
    if (params?.date_to) query.append('date_to', params.date_to);
    if (params?.user_id) query.append('user_id', params.user_id);
    if (params?.page) query.append('page', params.page.toString());
    const queryString = query.toString();
    return this.request(`/activity-logs${queryString ? `?${queryString}` : ''}`);
  }
}

export const api = new ApiService();