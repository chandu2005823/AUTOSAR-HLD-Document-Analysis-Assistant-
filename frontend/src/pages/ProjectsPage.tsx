import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useProjectStore } from '@/store/useProjectStore';
import { api } from '@/api/client';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import {
  FolderKanban,
  Plus,
  Users,
  UserPlus,
  Building,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { ProjectMember } from '@/types';

export const ProjectsPage: React.FC = () => {
  const { user } = useAuthStore();
  const {
    projects,
    activeProject,
    loadProjects,
    selectProjectById,
  } = useProjectStore();

  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  // Create Project state
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [projectSuccess, setProjectSuccess] = useState<string | null>(null);

  // Add Member state
  const [newMemberUsername, setNewMemberUsername] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'admin' | 'architect' | 'viewer'>('architect');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [memberSuccess, setMemberSuccess] = useState<string | null>(null);

  const loadMembers = async (projectId: number) => {
    setIsLoadingMembers(true);
    try {
      const data = await api.listProjectMembers(projectId);
      setMembers(data);
    } catch (err) {
      console.error(err);
      setMembers([]);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  useEffect(() => {
    if (activeProject) {
      loadMembers(activeProject.id);
    }
  }, [activeProject]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setIsCreatingProject(true);
    setProjectError(null);
    setProjectSuccess(null);

    try {
      const project = await api.createProject(newProjectName.trim());
      setProjectSuccess(`Project '${project.name}' created successfully!`);
      setNewProjectName('');
      await loadProjects();
      selectProjectById(project.id);
    } catch (err) {
      setProjectError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !newMemberUsername.trim()) return;

    setIsAddingMember(true);
    setMemberError(null);
    setMemberSuccess(null);

    try {
      await api.addProjectMember(activeProject.id, newMemberUsername.trim(), newMemberRole);
      setMemberSuccess(`Added ${newMemberUsername} as ${newMemberRole}!`);
      setNewMemberUsername('');
      loadMembers(activeProject.id);
    } catch (err) {
      setMemberError(err instanceof Error ? err.message : 'Failed to add member');
    } finally {
      setIsAddingMember(false);
    }
  };

  const isAdminOrArchitect =
    user?.role === 'admin' ||
    activeProject?.role === 'admin' ||
    activeProject?.role === 'architect';

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <FolderKanban className="w-6 h-6 text-blue-400" />
          Project &amp; Workspace Management
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Isolate AUTOSAR specifications into role-governed workspaces with fine-grained access control.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Projects List & Creator */}
        <div className="lg:col-span-2 space-y-6">
          {/* Projects List Card */}
          <Card className="p-0 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-400" />
                Available Projects ({projects.length})
              </h2>
            </div>

            <div className="divide-y divide-slate-800/60">
              {projects.map((p) => {
                const isActive = activeProject?.id === p.id;
                return (
                  <div
                    key={p.id}
                    className={`p-4 flex items-center justify-between transition-colors ${
                      isActive ? 'bg-blue-950/25' : 'hover:bg-slate-850/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-slate-800 text-blue-400">
                        <FolderKanban className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                          <span>{p.name}</span>
                          {isActive && (
                            <Badge variant="blue" size="sm">
                              Active
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Your Project Role: <strong className="text-slate-300">{p.role}</strong>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant={isActive ? 'secondary' : 'primary'}
                      size="sm"
                      onClick={() => selectProjectById(p.id)}
                      disabled={isActive}
                    >
                      {isActive ? 'Current' : 'Select'}
                    </Button>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Create Project Form (Admins / Architects) */}
          {isAdminOrArchitect && (
            <Card variant="elevated" className="p-6">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
                <Plus className="w-4 h-4 text-blue-400" />
                Create New Project Workspace
              </h2>

              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Project Workspace Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="e.g. AUTOSAR_Adaptive_Radar_ECU"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {projectError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{projectError}</span>
                  </div>
                )}

                {projectSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{projectSuccess}</span>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isCreatingProject || !newProjectName.trim()}
                    isLoading={isCreatingProject}
                  >
                    Initialize Workspace
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>

        {/* Right Column: Project Members & Member Addition */}
        <div className="space-y-6">
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                Project Members
              </h2>
              {activeProject && (
                <span className="text-xs text-slate-400">{activeProject.name}</span>
              )}
            </div>

            {isLoadingMembers ? (
              <div className="py-6 text-center">
                <Loader2 className="w-5 h-5 animate-spin text-blue-400 mx-auto mb-2" />
                <p className="text-xs text-slate-400">Loading members...</p>
              </div>
            ) : members.length > 0 ? (
              <div className="space-y-2">
                {members.map((m) => (
                  <div
                    key={m.user_id}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-slate-200">{m.username}</span>
                    <Badge variant={m.role === 'admin' ? 'purple' : m.role === 'architect' ? 'blue' : 'slate'} size="sm">
                      {m.role}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 text-center py-4">
                No members found in this workspace.
              </div>
            )}
          </Card>

          {/* Add Member Form (Admins) */}
          {(user?.role === 'admin' || activeProject?.role === 'admin') && (
            <Card variant="glass" className="p-5 space-y-4">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-cyan-400" />
                Add Member to Workspace
              </h3>

              <form onSubmit={handleAddMember} className="space-y-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={newMemberUsername}
                    onChange={(e) => setNewMemberUsername(e.target.value)}
                    placeholder="Existing system username..."
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Assigned Role</label>
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="architect">Architect (Read/Write)</option>
                    <option value="viewer">Viewer (Read Only)</option>
                    <option value="admin">Admin (Full Control)</option>
                  </select>
                </div>

                {memberError && (
                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                    {memberError}
                  </div>
                )}

                {memberSuccess && (
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                    {memberSuccess}
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="w-full"
                  disabled={isAddingMember || !newMemberUsername.trim()}
                  isLoading={isAddingMember}
                >
                  Grant Project Access
                </Button>
              </form>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
