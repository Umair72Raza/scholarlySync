import React from 'react';
import { LogOut, User, Bell, Search, GraduationCap } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-8 w-8 text-indigo-500" />
          <span className="text-xl font-bold tracking-tight text-white">ScholarlySync</span>
        </div>

        <div className="hidden flex-1 justify-center px-8 md:flex">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search courses, assignments..."
              className="w-full rounded-full border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white outline-none transition-all focus:border-indigo-500/50 focus:bg-white/10 focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative rounded-full p-2 text-slate-400 hover:bg-white/5 transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-slate-950"></span>
          </button>

          <div className="flex items-center gap-3 pl-2 border-l border-white/10">
            <div className="hidden text-right md:block">
              <p className="text-sm font-medium text-white">{user?.name || 'Guest'}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role?.toLowerCase() || 'Scholar'}</p>
            </div>
            <div className="group relative">
              <button className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 transition-all hover:ring-4 hover:ring-indigo-500/10">
                <User className="h-5 w-5" />
              </button>
              
              <div className="invisible absolute right-0 mt-2 w-48 scale-95 rounded-xl border border-white/10 bg-slate-900 p-1 shadow-xl opacity-0 transition-all group-hover:visible group-hover:scale-100 group-hover:opacity-100">
                <button 
                  onClick={() => logout()}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
