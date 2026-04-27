import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Bell, Search, GraduationCap } from 'lucide-react';

import { useSocketEvent } from '../context/SocketContext';
import { toast } from 'react-hot-toast';

const BaseLayout: React.FC<{ children?: React.ReactNode; roleColor: string }> = ({ children, roleColor }) => {
  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col transition-all duration-300 ml-20 md:ml-64">
        {/* Sub-header */}
        <header className="h-16 border-b border-white/5 bg-slate-950/50 backdrop-blur-md sticky top-0 z-40 px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${roleColor} animate-pulse`} />
            <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">ScholarlySync System</span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-white/5 border border-white/10 rounded-lg py-1.5 pl-10 pr-4 text-xs text-white outline-none focus:border-indigo-500/50 w-64"
              />
            </div>
            <button className="relative text-slate-400 hover:text-white transition-colors">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-indigo-500 border-2 border-slate-950" />
            </button>
          </div>
        </header>

        <main className="p-8 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export const StudentLayout: React.FC = () => {
  useSocketEvent('SUBMISSION_GRADED', (payload) => {
    toast.success(`Assignment "${payload.assignmentTitle}" graded: ${payload.grade}%!`, {
      icon: '🎓',
      style: { background: '#1e293b', color: '#fff', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }
    });
  });

  return <BaseLayout roleColor="bg-indigo-500" />;
};

export const TeacherLayout: React.FC = () => {
  useSocketEvent('NEW_SUBMISSION', (payload) => {
    toast.success(`New submission from ${payload.studentName}!`, {
      icon: '📥',
      style: { background: '#1e293b', color: '#fff', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }
    });
  });

  return <BaseLayout roleColor="bg-emerald-500" />;
};

export const AdminLayout: React.FC = () => <BaseLayout roleColor="bg-rose-500" />;
