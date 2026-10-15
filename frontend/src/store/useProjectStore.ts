import { create } from 'zustand';
import { Project, DocumentItem } from '@/types';
import { api } from '@/api/client';

interface ProjectState {
  projects: Project[];
  activeProject: Project | null;
  documents: DocumentItem[];
  activeDocument: DocumentItem | null;
  isLoadingProjects: boolean;
  isLoadingDocuments: boolean;
  error: string | null;

  setProjects: (projects: Project[]) => void;
  setActiveProject: (project: Project | null) => void;
  setActiveDocument: (doc: DocumentItem | null) => void;
  loadProjects: () => Promise<void>;
  loadDocuments: (projectId?: number) => Promise<void>;
  selectProjectById: (projectId: number) => void;
  selectDocumentById: (documentId: string) => void;
  clearState: () => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  activeProject: null,
  documents: [],
  activeDocument: null,
  isLoadingProjects: false,
  isLoadingDocuments: false,
  error: null,

  setProjects: (projects: Project[]) => set({ projects }),

  setActiveProject: (project: Project | null) => {
    if (project) {
      localStorage.setItem('autoarch_active_project', String(project.id));
    } else {
      localStorage.removeItem('autoarch_active_project');
    }
    set({ activeProject: project, activeDocument: null, documents: [] });
    if (project) {
      get().loadDocuments(project.id);
    }
  },

  setActiveDocument: (doc: DocumentItem | null) => {
    if (doc) {
      localStorage.setItem('autoarch_active_document', doc.document_id);
    } else {
      localStorage.removeItem('autoarch_active_document');
    }
    set({ activeDocument: doc });
  },

  loadProjects: async () => {
    set({ isLoadingProjects: true, error: null });
    try {
      const projects = await api.listProjects();
      set({ projects, isLoadingProjects: false });

      // Restore previously selected project or default to the first one
      const savedProjectId = localStorage.getItem('autoarch_active_project');
      let targetProject = projects.find((p) => String(p.id) === savedProjectId);
      if (!targetProject && projects.length > 0) {
        targetProject = projects[0];
      }

      if (targetProject) {
        get().setActiveProject(targetProject);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load projects';
      set({ error: msg, isLoadingProjects: false });
    }
  },

  loadDocuments: async (projectId?: number) => {
    const pid = projectId ?? get().activeProject?.id;
    if (!pid) return;

    set({ isLoadingDocuments: true });
    try {
      const documents = await api.listDocuments(pid);
      set({ documents, isLoadingDocuments: false });

      // Restore previously selected document or default to the latest one
      const savedDocId = localStorage.getItem('autoarch_active_document');
      let targetDoc = documents.find((d) => d.document_id === savedDocId);
      if (!targetDoc && documents.length > 0) {
        targetDoc = documents[0];
      }

      if (targetDoc) {
        get().setActiveDocument(targetDoc);
      } else {
        set({ activeDocument: null });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load documents';
      set({ error: msg, isLoadingDocuments: false });
    }
  },

  selectProjectById: (projectId: number) => {
    const project = get().projects.find((p) => p.id === projectId);
    if (project) {
      get().setActiveProject(project);
    }
  },

  selectDocumentById: (documentId: string) => {
    const doc = get().documents.find((d) => d.document_id === documentId);
    if (doc) {
      get().setActiveDocument(doc);
    }
  },

  clearState: () => {
    set({
      projects: [],
      activeProject: null,
      documents: [],
      activeDocument: null,
      error: null,
    });
  },
}));
