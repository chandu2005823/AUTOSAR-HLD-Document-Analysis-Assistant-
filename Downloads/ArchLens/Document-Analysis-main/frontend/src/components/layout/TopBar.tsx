import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { useProjectStore } from '@/store/useProjectStore';
import { Badge } from '@/components/common/Badge';
import {
  ChevronDown,
  LogOut,
  FolderKanban,
  FileText,
  HelpCircle,
  Network,
  GitCompare,
  ListTree,
  CheckSquare,
  ShieldCheck,
  Settings,
  Download,
  LayoutDashboard,
  Building,
} from 'lucide-react';
import { clsx } from 'clsx';

export const TopBar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { projects, activeProject, selectProjectById } = useProjectStore();
  const navigate = useNavigate();

  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isProjectOpen, setIsProjectOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const projectRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setIsMoreOpen(false);
      }
      if (projectRef.current && !projectRef.current.contains(e.target as Node)) {
        setIsProjectOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { name: 'Documents', to: '/documents', icon: FileText },
    { name: 'Grounded Q&A', to: '/qa', icon: HelpCircle },
    { name: 'Traceability', to: '/traceability', icon: ListTree },
    { name: 'Architecture', to: '/architecture', icon: Network },
    { name: 'Compare', to: '/compare', icon: GitCompare },
  ];

  const moreLinks = [
    { name: 'Review Queue', to: '/review', icon: CheckSquare },
    { name: 'Audit Logs', to: '/audit', icon: ShieldCheck },
    { name: 'Projects', to: '/projects', icon: Building },
    { name: 'Settings', to: '/settings', icon: Settings },
    { name: 'Exports', to: '/exports', icon: Download },
  ];

  return (
    <header className="bg-[#0B1020] border-b-2 border-slate-800/80 sticky top-0 z-40 shadow-lg shadow-black/50 backdrop-blur-md">
      <div className="w-full pl-4 pr-4 sm:pl-6 sm:pr-6 flex items-center justify-between h-16">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl overflow-hidden bg-blue-600/25 border-2 border-blue-500/40 flex items-center justify-center p-1 group-hover:border-blue-400 group-hover:shadow-lg group-hover:shadow-blue-500/30 transition-all duration-200">
              <img
                src="/image.png"
                alt="AutoArch-AI"
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Fallback if image fails to load
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="text-base font-bold bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent tracking-tight leading-tight">
                AutoArch-AI
              </div>
              <div className="text-[10px] text-slate-300 font-semibold tracking-wider uppercase leading-tight">
                AUTOSAR HLD Intelligence
              </div>
            </div>
          </Link>

          {/* Project Switcher */}
          <div className="relative" ref={projectRef}>
            <button
              onClick={() => setIsProjectOpen(!isProjectOpen)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 border-2 border-slate-700 hover:border-slate-600 text-xs text-slate-100 font-medium shadow-md hover:shadow-lg transition-all duration-150"
              title="Select Project"
            >
              <FolderKanban className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="font-semibold max-w-[120px] truncate">
                {activeProject ? activeProject.name : 'No Project'}
              </span>
              {activeProject && (
                <Badge variant="blue" size="sm">
                  {activeProject.role}
                </Badge>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-slate-300 ml-0.5" />
            </button>

            {isProjectOpen && (
              <div className="absolute left-0 mt-2 w-64 bg-[#151E2F] border-2 border-slate-600/90 rounded-xl shadow-2xl shadow-black/60 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 text-[11px] font-bold text-slate-300 uppercase tracking-widest border-b border-slate-700/50 mb-1">
                  Select Project
                </div>
                <div className="max-h-56 overflow-y-auto">
                  {projects.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        selectProjectById(p.id);
                        setIsProjectOpen(false);
                      }}
                      className={clsx(
                        'w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition-colors',
                        activeProject?.id === p.id
                          ? 'text-blue-400 bg-blue-500/10 font-semibold'
                          : 'text-slate-300'
                      )}
                    >
                      <span className="truncate">{p.name}</span>
                      <Badge variant="slate" size="sm">
                        {p.role}
                      </Badge>
                    </button>
                  ))}
                  {projects.length === 0 && (
                    <div className="px-3 py-2 text-xs text-slate-500 italic">
                      No projects available
                    </div>
                  )}
                </div>
                <div className="border-t border-slate-800 mt-1 pt-1 px-2">
                  <Link
                    to="/projects"
                    onClick={() => setIsProjectOpen(false)}
                    className="block text-center text-xs text-blue-400 hover:text-blue-300 py-1.5 font-medium rounded-lg hover:bg-slate-800/60"
                  >
                    + Manage Projects
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Primary Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1.5">
          {navLinks.map((tab) => {
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150',
                    isActive
                      ? 'bg-blue-600/20 text-blue-300 border-2 border-blue-500/40 shadow-md shadow-blue-500/20'
                      : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800 border-2 border-transparent hover:border-slate-700'
                  )
                }
              >
                <Icon className="w-4 h-4" />
                <span className="tracking-wide">{tab.name}</span>
              </NavLink>
            );
          })}

          {/* More Menu Dropdown */}
          <div className="relative" ref={moreRef}>
            <button
              onClick={() => setIsMoreOpen(!isMoreOpen)}
              className={clsx(
                'flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150 border-2',
                isMoreOpen
                  ? 'bg-slate-800 text-slate-100 border-slate-600'
                  : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800 border-transparent hover:border-slate-700'
              )}
            >
              <span className="tracking-wide">More</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-300" />
            </button>

            {isMoreOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-[#151E2F] border-2 border-slate-600/90 rounded-xl shadow-2xl shadow-black/60 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                {moreLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setIsMoreOpen(false)}
                      className={({ isActive }) =>
                        clsx(
                          'flex items-center gap-3 px-4 py-2.5 text-xs font-semibold transition-colors',
                          isActive
                            ? 'bg-blue-600/20 text-blue-300 border-l-4 border-blue-500'
                            : 'text-slate-200 hover:bg-slate-800 hover:text-white border-l-4 border-transparent'
                        )
                      }
                    >
                      <Icon className="w-4 h-4 text-slate-300" />
                      <span className="tracking-wide">{item.name}</span>
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* User Info & Logout */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-100 tracking-wide">
                  {user.username}
                </span>
                <span className="text-[10px] text-slate-300 capitalize font-semibold tracking-wider">
                  {user.role}
                </span>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 border-2 border-blue-400/50 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-blue-500/30">
                {user.username.slice(0, 2).toUpperCase()}
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-300 hover:text-rose-400 hover:bg-rose-500/15 rounded-lg transition-all duration-150 border-2 border-transparent hover:border-rose-500/30"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="text-xs font-semibold text-blue-300 hover:text-blue-200 px-4 py-2 rounded-lg bg-blue-600/15 border-2 border-blue-500/40 hover:border-blue-400/60 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-150"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
