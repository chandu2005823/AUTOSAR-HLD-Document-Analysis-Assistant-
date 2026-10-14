import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useProjectStore } from '@/store/useProjectStore';
import { api } from '@/api/client';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import {
  Settings,
  User,
  Users,
  ShieldCheck,
  UserPlus,
  Edit,
  Server,
  Database,
  Loader2,
} from 'lucide-react';
import { User as UserType } from '@/types';

export const SettingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { activeProject } = useProjectStore();

  const [usersList, setUsersList] = useState<UserType[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Create User State
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'architect' | 'viewer'>('architect');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  // Update User State
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [updateRole, setUpdateRole] = useState<string>('architect');
  const [updateActive, setUpdateActive] = useState<boolean>(true);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin';

  const loadUsers = async () => {
    if (!isAdmin) return;
    setIsLoadingUsers(true);
    try {
      const data = await api.listUsers();
      setUsersList(data);
      if (data.length > 0 && selectedUserId === null) {
        setSelectedUserId(data[0].id);
        setUpdateRole(data[0].role);
        setUpdateActive(data[0].active ?? true);
      }
    } catch (err) {
      console.error(err);
      setUsersList([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [isAdmin]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) return;

    setIsCreatingUser(true);
    setCreateError(null);
    setCreateSuccess(null);

    try {
      await api.createUser({
        username: newUsername.trim(),
        password: newPassword.trim(),
        role: newRole,
      });
      setCreateSuccess(`User account '${newUsername}' created successfully!`);
      setNewUsername('');
      setNewPassword('');
      loadUsers();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    setIsUpdatingUser(true);
    setUpdateError(null);
    setUpdateSuccess(null);

    try {
      await api.updateUser(selectedUserId, {
        role: updateRole,
        active: updateActive,
      });
      setUpdateSuccess('User account updated successfully!');
      loadUsers();
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setIsUpdatingUser(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-blue-400" />
          Settings &amp; Administration
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          User profile parameters, enterprise authentication, and RBAC user provisioning.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card variant="elevated" className="p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <User className="w-4 h-4 text-blue-400" />
            Your Profile &amp; Credentials
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400">Account Username</span>
              <span className="font-bold text-slate-100">{user?.username}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400">System Role</span>
              <Badge variant={user?.role === 'admin' ? 'purple' : 'blue'} size="sm">
                {user?.role}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400">Active Workspace</span>
              <span className="font-semibold text-slate-200 truncate max-w-[140px]">
                {activeProject?.name || 'None'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400">Authentication</span>
              <Badge variant="emerald" size="sm">
                PBKDF2 SHA-256
              </Badge>
            </div>
          </div>
        </Card>

        {/* System & Architecture Info */}
        <Card className="lg:col-span-2 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-indigo-400" />
            Platform Architecture &amp; Engines
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
              <div className="font-semibold text-slate-200 flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-400" />
                Relational &amp; RBAC Storage
              </div>
              <p className="text-slate-400">
                SQLite 3 with ACID transactions for access tokens, projects, user roles, review statuses, and security audits.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
              <div className="font-semibold text-slate-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Vector Embedding Engine
              </div>
              <p className="text-slate-400">
                ChromaDB collection store with multi-chunk semantic indexing, cosine similarity, and grounded citations.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Admin User Management Section */}
      {isAdmin && (
        <div className="space-y-6 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              User Provisioning &amp; RBAC Directory (Admin)
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Registered Users Table */}
            <Card className="lg:col-span-2 p-0 overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Registered Accounts ({usersList.length})
                </span>
                {isLoadingUsers && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">System Role</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {usersList.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-semibold text-slate-100">{u.username}</td>
                        <td className="py-3 px-4">
                          <Badge variant={u.role === 'admin' ? 'purple' : 'blue'} size="sm">
                            {u.role}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          {u.active !== false ? (
                            <Badge variant="emerald" size="sm">Active</Badge>
                          ) : (
                            <Badge variant="rose" size="sm">Inactive</Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedUserId(u.id);
                              setUpdateRole(u.role);
                              setUpdateActive(u.active ?? true);
                            }}
                            className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                          >
                            Edit &rarr;
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Forms Column */}
            <div className="space-y-6">
              {/* Create User Form */}
              <Card variant="glass" className="p-5 space-y-4">
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-cyan-400" />
                  Create New User
                </h3>

                <form onSubmit={handleCreateUser} className="space-y-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Username</label>
                    <input
                      type="text"
                      required
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="Username..."
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 8 characters..."
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">System Role</label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                      <option value="architect">Architect</option>
                      <option value="viewer">Viewer</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>

                  {createError && (
                    <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                      {createError}
                    </div>
                  )}

                  {createSuccess && (
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                      {createSuccess}
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    className="w-full"
                    disabled={isCreatingUser || !newUsername.trim() || !newPassword.trim()}
                    isLoading={isCreatingUser}
                  >
                    Provision Account
                  </Button>
                </form>
              </Card>

              {/* Update User Form */}
              {selectedUserId && (
                <Card variant="glass" className="p-5 space-y-4">
                  <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Edit className="w-4 h-4 text-purple-400" />
                    Modify User #{selectedUserId}
                  </h3>

                  <form onSubmit={handleUpdateUser} className="space-y-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Target Account</label>
                      <select
                        value={selectedUserId}
                        onChange={(e) => {
                          const id = Number(e.target.value);
                          setSelectedUserId(id);
                          const target = usersList.find((u) => u.id === id);
                          if (target) {
                            setUpdateRole(target.role);
                            setUpdateActive(target.active ?? true);
                          }
                        }}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                      >
                        {usersList.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.username} ({u.role})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Change Role</label>
                      <select
                        value={updateRole}
                        onChange={(e) => setUpdateRole(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                      >
                        <option value="architect">Architect</option>
                        <option value="viewer">Viewer</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="userActiveCheck"
                        checked={updateActive}
                        onChange={(e) => setUpdateActive(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0"
                      />
                      <label htmlFor="userActiveCheck" className="text-xs text-slate-300">
                        Account Active
                      </label>
                    </div>

                    {updateError && (
                      <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                        {updateError}
                      </div>
                    )}

                    {updateSuccess && (
                      <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                        {updateSuccess}
                      </div>
                    )}

                    <Button
                      type="submit"
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      isLoading={isUpdatingUser}
                    >
                      Save Updates
                    </Button>
                  </form>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
