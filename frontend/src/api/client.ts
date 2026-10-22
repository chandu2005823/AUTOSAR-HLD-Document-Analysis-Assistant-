import {
  AuthResponse,
  User,
  Project,
  ProjectMember,
  DocumentItem,
  DocumentVersion,
  QAResponse,
  TraceabilityRecord,
  RelationshipRecord,
  RelationshipGraphResponse,
  ComparisonResult,
  ReviewItem,
  AuditLogEntry,
} from '@/types';

const configuredApiBase = import.meta.env.VITE_API_BASE_URL?.trim();
const API_BASE = (configuredApiBase || '/api').replace(/\/+$/, '');

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('autoarch_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `Request failed (${response.status})`;
      try {
        const errorData = await response.json();
        if (errorData?.error?.message) {
          errorMessage = errorData.error.message;
        } else if (errorData?.detail?.message) {
          errorMessage = errorData.detail.message;
        } else if (typeof errorData?.detail === 'string') {
          errorMessage = errorData.detail;
        }
      } catch {
        // Fallback to response statusText
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    // For 204 or empty responses
    if (response.status === 204) {
      return {} as T;
    }

    return response.json() as Promise<T>;
  }

  // Auth
  async login(username: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/token', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  // Users (Admin only)
  async listUsers(): Promise<User[]> {
    return this.request<User[]>('/users');
  }

  async createUser(data: { username: string; password: string; role: string }): Promise<User> {
    return this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(userId: number, data: { role?: string; active?: boolean }): Promise<User> {
    return this.request<User>(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Projects
  async listProjects(): Promise<Project[]> {
    return this.request<Project[]>('/projects');
  }

  async getProject(projectId: number): Promise<Project> {
    return this.request<Project>(`/projects/${projectId}`);
  }

  async createProject(name: string): Promise<Project> {
    return this.request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async listProjectMembers(projectId: number): Promise<ProjectMember[]> {
    return this.request<ProjectMember[]>(`/projects/${projectId}/members`);
  }

  async addProjectMember(
    projectId: number,
    username: string,
    role: string
  ): Promise<{ status: string }> {
    return this.request<{ status: string }>(`/projects/${projectId}/members`, {
      method: 'POST',
      body: JSON.stringify({ username, role }),
    });
  }

  // Documents
  async listDocuments(projectId: number): Promise<DocumentItem[]> {
    return this.request<DocumentItem[]>(`/projects/${projectId}/documents`);
  }

  async getDocument(projectId: number, documentId: string): Promise<DocumentItem> {
    return this.request<DocumentItem>(`/projects/${projectId}/documents/${documentId}`);
  }

  async uploadDocument(projectId: number, file: File): Promise<DocumentItem> {
    const formData = new FormData();
    formData.append('file', file);
    return this.request<DocumentItem>(`/projects/${projectId}/documents`, {
      method: 'POST',
      body: formData,
    });
  }

  async getDocumentVersions(projectId: number, documentId: string): Promise<DocumentVersion[]> {
    return this.request<DocumentVersion[]>(`/projects/${projectId}/documents/${documentId}/versions`);
  }

  async getDocumentEvidence(
    projectId: number,
    documentId: string,
    entity: string,
    page?: number | string
  ): Promise<{ document_id: string; entity: string; page?: number | string; context: string }> {
    const params = new URLSearchParams({ entity });
    if (page !== undefined && page !== null) {
      params.append('page', String(page));
    }
    return this.request<{ document_id: string; entity: string; page?: number | string; context: string }>(
      `/projects/${projectId}/documents/${documentId}/evidence?${params.toString()}`
    );
  }

  // Grounded Q&A
  async askQuestion(projectId: number, question: string): Promise<QAResponse> {
    return this.request<QAResponse>(`/projects/${projectId}/query`, {
      method: 'POST',
      body: JSON.stringify({ question }),
    });
  }

  // Traceability
  async listTraceability(
    projectId: number,
    params?: { document_id?: string; entity_type?: string; search?: string }
  ): Promise<TraceabilityRecord[]> {
    const searchParams = new URLSearchParams();
    if (params?.document_id) searchParams.append('document_id', params.document_id);
    if (params?.entity_type && params.entity_type !== 'All') {
      searchParams.append('entity_type', params.entity_type);
    }
    if (params?.search) searchParams.append('search', params.search);

    const query = searchParams.toString();
    return this.request<TraceabilityRecord[]>(
      `/projects/${projectId}/traceability${query ? `?${query}` : ''}`
    );
  }

  // Relationships & Graph
  async listRelationships(
    projectId: number,
    params?: { document_id?: string; source?: string; relationship?: string; target?: string }
  ): Promise<RelationshipRecord[]> {
    const searchParams = new URLSearchParams();
    if (params?.document_id) searchParams.append('document_id', params.document_id);
    if (params?.source) searchParams.append('source', params.source);
    if (params?.relationship) searchParams.append('relationship', params.relationship);
    if (params?.target) searchParams.append('target', params.target);

    const query = searchParams.toString();
    return this.request<RelationshipRecord[]>(
      `/projects/${projectId}/relationships${query ? `?${query}` : ''}`
    );
  }

  async getRelationshipGraph(
    projectId: number,
    documentId?: string
  ): Promise<RelationshipGraphResponse> {
    const query = documentId ? `?document_id=${encodeURIComponent(documentId)}` : '';
    return this.request<RelationshipGraphResponse>(
      `/projects/${projectId}/relationships/graph${query}`
    );
  }

  // Comparison
  async compareDocuments(
    projectId: number,
    baselineDocumentId: string,
    currentDocumentId: string
  ): Promise<ComparisonResult> {
    return this.request<ComparisonResult>(`/projects/${projectId}/compare`, {
      method: 'POST',
      body: JSON.stringify({
        baseline_document_id: baselineDocumentId,
        current_document_id: currentDocumentId,
      }),
    });
  }

  async compareFiles(
    projectId: number,
    baselineFile: File,
    currentFile: File
  ): Promise<ComparisonResult> {
    const formData = new FormData();
    formData.append('baseline_file', baselineFile);
    formData.append('current_file', currentFile);
    return this.request<ComparisonResult>(`/projects/${projectId}/compare/files`, {
      method: 'POST',
      body: formData,
    });
  }

  // Reviews
  async listReviews(projectId: number, limit = 50): Promise<ReviewItem[]> {
    return this.request<ReviewItem[]>(`/projects/${projectId}/reviews?limit=${limit}`);
  }

  async updateReviewStatus(
    projectId: number,
    reviewId: string,
    status: 'approved' | 'needs_review'
  ): Promise<ReviewItem> {
    return this.request<ReviewItem>(`/projects/${projectId}/reviews/${reviewId}`, {
      method: 'PATCH',
      body: JSON.stringify({ review_status: status }),
    });
  }

  // Audit Logs
  async listAuditLogs(projectId: number, limit = 50): Promise<AuditLogEntry[]> {
    return this.request<AuditLogEntry[]>(`/projects/${projectId}/audit?limit=${limit}`);
  }

  // Exports
  async downloadExport(
    projectId: number,
    artifact: 'traceability' | 'relationships' | 'comparison',
    format: 'json' | 'csv' = 'json',
    baselineDocId?: string,
    currentDocId?: string
  ): Promise<Blob> {
    const token = this.getToken();
    const params = new URLSearchParams({ format });
    if (baselineDocId) params.append('baseline_document_id', baselineDocId);
    if (currentDocId) params.append('current_document_id', currentDocId);

    const response = await fetch(
      `${API_BASE}/projects/${projectId}/exports/${artifact}?${params.toString()}`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    );

    if (!response.ok) {
      throw new Error(`Export download failed (${response.status})`);
    }

    return response.blob();
  }
}

export const api = new ApiClient();
