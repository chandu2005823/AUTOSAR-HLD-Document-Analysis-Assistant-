import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../store/useAuthStore';
import { useProjectStore } from '../store/useProjectStore';

describe('useAuthStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  it('initializes with default unauthenticated state', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.token).toBe(null);
    expect(state.user).toBe(null);
  });

  it('updates token and persists to localStorage on setToken', () => {
    useAuthStore.getState().setToken('test_jwt_token');
    const state = useAuthStore.getState();
    expect(state.token).toBe('test_jwt_token');
    expect(state.isAuthenticated).toBe(true);
    expect(localStorage.getItem('autoarch_token')).toBe('test_jwt_token');
  });

  it('clears state and removes localStorage items on logout', () => {
    useAuthStore.getState().setToken('test_token');
    useAuthStore.getState().logout();
    const state = useAuthStore.getState();
    expect(state.token).toBe(null);
    expect(state.isAuthenticated).toBe(false);
    expect(localStorage.getItem('autoarch_token')).toBe(null);
  });
});

describe('useProjectStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useProjectStore.getState().clearState();
  });

  it('manages active project selection', () => {
    const mockProject = {
      id: 42,
      name: 'AUTOSAR Test Project',
      role: 'admin' as const,
    };

    useProjectStore.getState().setActiveProject(mockProject);
    const state = useProjectStore.getState();
    expect(state.activeProject?.id).toBe(42);
    expect(state.activeProject?.name).toBe('AUTOSAR Test Project');
    expect(localStorage.getItem('autoarch_active_project')).toBe('42');
  });

  it('manages active document selection', () => {
    const mockDoc = {
      document_id: 'doc_123',
      project_id: 42,
      filename: 'AUTOSAR_SRS.pdf',
      version: 1,
      pages: 12,
      chunks: 48,
      traceability_count: 30,
      relationship_count: 15,
    };

    useProjectStore.getState().setActiveDocument(mockDoc);
    const state = useProjectStore.getState();
    expect(state.activeDocument?.document_id).toBe('doc_123');
    expect(localStorage.getItem('autoarch_active_document')).toBe('doc_123');
  });
});
