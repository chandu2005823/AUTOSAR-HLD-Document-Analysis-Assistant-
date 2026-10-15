import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Lock, User as UserIcon, ShieldAlert, Sparkles, HelpCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('adminpassword123');
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const { login, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const success = await login(username, password);
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl mb-4">
            <img
              src="/image.png"
              alt="AutoArch-AI"
              className="w-12 h-12 object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent tracking-tight">
            AutoArch-AI
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            AUTOSAR High-Level Design Intelligence &amp; Verification
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#101827]/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-md">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
            >
              Sign In to Platform
            </Button>
          </form>

          {/* Quick Demo Info */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <div className="text-xs text-slate-400 flex items-center justify-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Default Administrator Account:</span>
            </div>
            <code className="text-xs bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-blue-300 font-mono inline-block">
              admin / adminpassword123
            </code>
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={() => setIsHelpOpen(true)}
              className="text-xs text-slate-400 hover:text-slate-300 inline-flex items-center gap-1 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Need access or forgot password?</span>
            </button>
          </div>
        </div>
      </div>

      {/* Access Help Modal */}
      <Modal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        title="Access Assistance"
      >
        <div className="space-y-4 text-sm text-slate-300">
          <p>
            User accounts in AutoArch-AI are governed by strict Role-Based Access Control (RBAC).
          </p>
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs space-y-1.5">
            <div className="font-semibold text-white">System Roles:</div>
            <div>&bull; <strong>Admin</strong>: User management, project management, system configuration.</div>
            <div>&bull; <strong>Architect</strong>: Document processing, QA investigations, review workflows.</div>
            <div>&bull; <strong>Viewer</strong>: Read-only access to diagrams, traceability, and verified Q&amp;A.</div>
          </div>
          <p className="text-xs text-slate-400">
            To register a new user account or reset credentials, please sign in with an Administrator account or contact your project lead.
          </p>
          <div className="flex justify-end pt-2">
            <Button variant="secondary" size="sm" onClick={() => setIsHelpOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
