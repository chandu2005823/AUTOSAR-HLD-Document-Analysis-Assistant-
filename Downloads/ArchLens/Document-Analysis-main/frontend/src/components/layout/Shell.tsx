import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { useAuthStore } from '@/store/useAuthStore';
import { useProjectStore } from '@/store/useProjectStore';

export const Shell: React.FC = () => {
  const { isAuthenticated, fetchCurrentUser } = useAuthStore();
  const { loadProjects } = useProjectStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchCurrentUser();
      loadProjects();
    }
  }, [isAuthenticated, fetchCurrentUser, loadProjects]);

  return (
    <div className="min-h-screen bg-[#070B14] flex flex-col font-sans text-slate-100 selection:bg-blue-600/30 selection:text-blue-200">
      <TopBar />

      <main className="flex-1 w-full px-4 sm:px-6 py-6 md:py-8">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      <footer className="border-t-2 border-slate-800 bg-[#070B14] py-4 text-center text-xs text-slate-300 font-semibold tracking-wider shadow-inner">
        AutoArch-AI &bull; AUTOSAR High-Level Design Intelligence Platform
      </footer>
    </div>
  );
};
