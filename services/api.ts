const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000/api';

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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout

    const url = `${API_BASE_URL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorData: any;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
        }
        
        // Create error with more details
        const error = new Error(errorData.message || errorData.error || 'Request failed');
        (error as any).response = { data: errorData, status: response.status };
        throw error;
      }

      return response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      throw error;
    }
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

  async forgotPassword(email: string) {
    return this.request<{ message: string }>('/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(data: any) {
    return this.request<{ message: string }>('/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async resendVerification(email: string) {
    return this.request<{ message: string }>('/email/resend', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async validateInviteCode(code: string) {
    return this.request<{ valid: boolean; message: string }>('/validate-invite-code', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  async registerWithInvite(data: any) {
    return this.request<{ user: any; message: string; requires_verification?: boolean; token?: string }>('/register-invite', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Dashboard
  async getDashboardStats(startMonth?: number, startYear?: number, endMonth?: number, endYear?: number) {
    const params = new URLSearchParams();
    if (startMonth) params.append('start_month', startMonth.toString());
    if (startYear) params.append('start_year', startYear.toString());
    if (endMonth) params.append('end_month', endMonth.toString());
    if (endYear) params.append('end_year', endYear.toString());
    const queryString = params.toString();
    return this.request(`/dashboard/stats${queryString ? '?' + queryString : ''}`);
  }

  async getRevenueData(startMonth?: number, startYear?: number, endMonth?: number, endYear?: number) {
    const params = new URLSearchParams();
    if (startMonth) params.append('start_month', startMonth.toString());
    if (startYear) params.append('start_year', startYear.toString());
    if (endMonth) params.append('end_month', endMonth.toString());
    if (endYear) params.append('end_year', endYear.toString());
    const queryString = params.toString();
    return this.request(`/dashboard/revenue${queryString ? '?' + queryString : ''}`);
  }

  async getTopProjects() {
    return this.request('/dashboard/top-projects');
  }

  async getRecentActivities() {
    return this.request('/dashboard/recent-activities');
  }

  // Projects
  async getProjects(params?: { status?: string; search?: string; page?: number; year?: number }) {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.year) query.append('year', params.year.toString());
    const queryString = query.toString();
    return this.request(`/projects${queryString ? `?${queryString}` : ''}`);
  }

  async getMonitoringStats(year?: number) {
    const params = year ? `?year=${year}` : '';
    return this.request(`/projects/monitoring/stats${params}`);
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

  async addProjectAttachmentLink(projectId: string, payload: { label?: string | null; url: string }) {
    return this.request(`/projects/${projectId}/attachments`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async deleteProjectAttachment(projectId: string, attachmentId: string) {
    return this.request(`/projects/${projectId}/attachments/${attachmentId}`, {
      method: 'DELETE',
    });
  }

  getAttachmentDownloadUrl(projectId: string, attachmentId: string) {
    return `${API_BASE_URL}/projects/${projectId}/attachments/${attachmentId}/download`;
  }

  async downloadProjectAttachment(projectId: string, attachmentId: string): Promise<Blob> {
    const token = this.token;
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/attachments/${attachmentId}/download`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Download failed' }));
      throw new Error(error.message || 'Download failed');
    }

    return response.blob();
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
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
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

  async downloadEssentialDocument(id: string): Promise<Blob> {
    const token = this.token;
    const response = await fetch(`${API_BASE_URL}/essential-documents/${id}/download`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/pdf',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Download failed' }));
      throw new Error(error.message || 'Download failed');
    }

    return response.blob();
  }

  async deleteEssentialDocument(id: string) {
    return this.request(`/essential-documents/${id}`, { method: 'DELETE' });
  }

  async getProjectComments(projectId: string) {
    return this.request(`/projects/${projectId}/comments`);
  }

  async addProjectComment(projectId: string, comment: string) {
    return this.request(`/projects/${projectId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
  }

  // Clients
  async getClients(params?: { search?: string; status?: string; page?: number; type?: string }) {
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

  async updateClientWithLogo(id: string, data: FormData) {
    const token = this.token;
    // We use POST with _method=PUT because PHP/Laravel struggles with multipart/form-data in PUT requests
    const response = await fetch(`${API_BASE_URL}/clients/${id}`, {
      method: 'POST', 
      headers: {
        'Authorization': `Bearer ${token}`,
        // Content-Type is set automatically by browser with boundary for FormData
      },
      body: data,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  async getClientHistory(id: string) {
    return this.request(`/clients/${id}/history`);
  }

  async getClientActivities(id: string) {
    return this.request(`/clients/${id}/activities`);
  }

  // SPH
  async getSphList(params?: { status?: string; page?: number }) {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
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

  async previewSph(data: any) {
    const token = this.token;
    const response = await fetch(`${API_BASE_URL}/sph/preview`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/pdf',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || 'Preview failed');
    }

    return response.blob();
  }

  async generateSph(id: string) {
    return this.request(`/sph/${id}/generate`, { method: 'POST' });
  }

  async approveSph(id: string, signature?: File, useExisting?: boolean) {
    if (signature || useExisting) {
      const formData = new FormData();
      if (signature) formData.append('signature', signature);
      if (useExisting) formData.append('use_existing_signature', '1');
      
      const token = this.token;
      const response = await fetch(`${API_BASE_URL}/sph/${id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Approval failed' }));
        throw new Error(errorData.message || 'Approval failed');
      }
      return response.json();
    }
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

  // Audiensi
    async getAudiensiStats() {
    return this.request('/audiensi/stats');
  }

  async getAudiensiList(params?: { search?: string; status?: string; page?: number }) {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
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

  async generateAudiensi(id: string) {
    return this.request(`/audiensi/${id}/generate`, { method: 'POST' });
  }

  async clientDecisionAudiensi(id: string, decision: 'accepted' | 'rejected') {
    return this.request(`/audiensi/${id}/client-decision`, {
      method: 'POST',
      body: JSON.stringify({ decision }),
    });
  }

  async approveAudiensi(id: string, signature?: File, useExisting?: boolean) {
    if (signature || useExisting) {
      const formData = new FormData();
      if (signature) formData.append('signature', signature);
      if (useExisting) formData.append('use_existing_signature', '1');

      const token = this.token;
      const response = await fetch(`${API_BASE_URL}/audiensi/${id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Approval failed' }));
        throw new Error(errorData.message || 'Approval failed');
      }
      return response.json();
    }
    return this.request(`/audiensi/${id}/approve`, { method: 'POST' });
  }

  async rejectAudiensi(id: string, reason: string) {
    return this.request(`/audiensi/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejection_reason: reason }),
    });
  }

  async getAudiensiTemplates() {
    return this.request('/audiensi-templates');
  }

  async deleteAudiensiTemplate(id: string) {
    return this.request(`/audiensi-templates/${id}`, {
      method: 'DELETE',
    });
  }

  async storeAudiensiTemplate(data: any) {
    return this.request('/audiensi-templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createAudiensiTemplate(data: any) {
    return this.storeAudiensiTemplate(data);
  }

  // Activities
  async offline() {
    return this.request('/activities/offline', { method: 'POST' });
  }

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
          if (key === 'mentions' || key === 'tags') {
            data[key].forEach((v: any) => formData.append(`${key}[]`, String(v)));
          } else {
            formData.append(key, JSON.stringify(data[key]));
          }
        } else if (typeof data[key] === 'boolean') {
          formData.append(key, data[key] ? '1' : '0');
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
        'Accept': 'application/json',
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  async updateActivity(id: string, data: any) {
    return this.request(`/activities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteActivity(id: string) {
    return this.request(`/activities/${id}`, { method: 'DELETE' });
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
  async getCalendarEvents(params?: { start?: string; end?: string; user_id?: string; month?: number; year?: number }) {
    const query = new URLSearchParams();
    if (params?.start) query.append('start', params.start);
    if (params?.end) query.append('end', params.end);
    if (params?.user_id) query.append('user_id', params.user_id.toString());
    if (params?.month) query.append('month', params.month.toString());
    if (params?.year) query.append('year', params.year.toString());
    const queryString = query.toString();
    return this.request(`/calendar/events${queryString ? `?${queryString}` : ''}`);
  }

  async createCalendarEvent(data: any) {
    return this.request('/calendar/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCalendarEvent(id: number, data: any) {
    return this.request(`/calendar/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCalendarEvent(id: number) {
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

  async deleteMarketingTask(id: string | number) {
    return this.request(`/marketing-plan/tasks/${id}`, { method: 'DELETE' });
  }

  async getMarketingTaskComments(id: string | number) {
    return this.request(`/marketing-plan/tasks/${id}/comments`);
  }

  async addMarketingTaskComment(id: string | number, comment: string) {
    return this.request(`/marketing-plan/tasks/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
  }

  async getMarketingTaskHistory(id: string | number) {
    return this.request(`/marketing-plan/tasks/${id}/history`);
  }

  async getMarketingTaskAttachments(id: string | number) {
    return this.request(`/marketing-plan/tasks/${id}/attachments`);
  }

  async addMarketingTaskAttachment(id: string | number, payload: { label?: string | null; url: string }) {
    return this.request(`/marketing-plan/tasks/${id}/attachments`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async deleteMarketingTaskAttachment(taskId: string | number, attachmentId: string | number) {
    return this.request(`/marketing-plan/tasks/${taskId}/attachments/${attachmentId}`, {
      method: 'DELETE',
    });
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
    return this.request<any>(`/notifications${queryString ? `?${queryString}` : ''}`);
  }

  async getNotificationCount() {
    return this.request<{ unread_count: number }>('/notifications/count');
  }

  async getNotificationProjects() {
    return this.request<any>('/notifications/projects');
  }

  async markNotificationAsRead(id: string | number) {
    return this.request(`/notifications/${id}/read`, { method: 'PUT' });
  }

  async markAllNotificationsAsRead() {
    return this.request('/notifications/read-all', { method: 'PUT' });
  }

  async deleteAllNotifications() {
    return this.request('/notifications/all', { method: 'DELETE' });
  }

  async deleteNotification(id: string | number) {
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

  async updatePassword(currentPassword: string, newPassword: string) {
    return this.request('/users/password', {
      method: 'PUT',
      body: JSON.stringify({ 
        current_password: currentPassword, 
        new_password: newPassword 
      }),
    });
  }

  // Tutorials
  async getUserTutorials() {
    return this.request<string[]>('/user-tutorials');
  }

  async saveUserTutorial(tutorialId: string) {
    return this.request('/user-tutorials', {
      method: 'POST',
      body: JSON.stringify({ tutorial_id: tutorialId }),
    });
  }

  async updatePreferences(data: any) {
    return this.request('/users/preferences', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // User Management (Admin only)
  async getUsers(params?: { page?: number; search?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.search) query.append('search', params.search);
    const queryString = query.toString();
    return this.request(`/users${queryString ? `?${queryString}` : ''}`);
  }

  async createUser(data: any) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: string, data: any) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string) {
    return this.request(`/users/${id}`, { method: 'DELETE' });
  }
  

  

  // Activity Logs
  async getActivityLogs(params?: { 
    module?: string; 
    status?: string; 
    action_type?: string; 
    action_types?: string[]; 
    search?: string; 
    date_from?: string; 
    date_to?: string; 
    user_id?: string; 
    page?: number;
    per_page?: number;
  }) {
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
    if (params?.per_page) query.append('per_page', params.per_page.toString());
    const queryString = query.toString();
    return this.request(`/activity-logs${queryString ? `?${queryString}` : ''}`);
  }

  async listInviteCodes(params?: { page?: number }) {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    const queryString = query.toString();
    return this.request(`/invite-codes${queryString ? `?${queryString}` : ''}`);
  }

  async generateInviteCode() {
    return this.request('/invite-codes/generate', { method: 'POST' });
  }
}

export const api = new ApiService();