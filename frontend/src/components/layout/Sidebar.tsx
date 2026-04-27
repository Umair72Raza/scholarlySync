import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  BookOpen, Calendar, MessageSquare, Star, 
  Users, LayoutDashboard, FileText, Settings,
  Zap, Bell, LogOut, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface SidebarItem {
  label: string;
  icon: any;
  path: string;
}

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const getMenuItems = (): SidebarItem[] => {
    const role = user?.role;
    const base = role?.toLowerCase();

    if (role === 'ADMIN') {
      return [
        { label: 'Overview', icon: LayoutDashboard, path: '/admin' },
        { label: 'Users', icon: Users, path: '/admin/users' },
        { label: 'System', icon: Settings, path: '/admin/system' },
        { label: 'Broadcast', icon: Bell, path: '/admin/broadcast' },
      ];
    }
    if (role === 'TEACHER') {
      return [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/teacher' },
        { label: 'My Courses', icon: BookOpen, path: '/teacher/courses' },
        { label: 'Grading', icon: FileText, path: '/teacher/grading' },
      ];
    }
    // Student
    return [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/student' },
      { label: 'My Courses', icon: BookOpen, path: '/student/courses' },
    ];
  };

  const menuItems = getMenuItems();

  return (
    <aside 
      className={`fixed left-0 top-0 h-screen bg-slate-900 border-r border-white/5 transition-all duration-300 z-50 flex flex-col ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Collapse Toggle */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center text-white border border-white/10 hover:bg-indigo-500 transition-colors shadow-lg"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Profile Section */}
      <div className={`p-6 mb-4 ${isCollapsed ? 'items-center' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20 flex-shrink-0">
            {user?.name.charAt(0)}
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <p className="text-white font-semibold text-sm truncate">{user?.name}</p>
              <p className="text-slate-500 text-xs capitalize">{user?.role?.toLowerCase()}</p>
            </div>
          )}
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/student' || item.path === '/teacher' || item.path === '/admin'}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group
              ${isActive 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}
              ${isCollapsed ? 'justify-center' : ''}
            `}
          >
            <item.icon size={20} className={isCollapsed ? '' : 'flex-shrink-0'} />
            {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
            {isCollapsed && (
              <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-xl border border-white/10">
                {item.label}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-white/5 space-y-1">
        <button 
          onClick={() => logout()}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-all ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut size={20} />
          {!isCollapsed && <span className="text-sm font-medium">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};
