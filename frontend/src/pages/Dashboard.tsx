import React from 'react';
import { BookOpen, Calendar, MessageSquare, Star, Users, CheckSquare, BarChart2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export const Dashboard: React.FC = () => {
  const { user } = useAuthStore();

  const isTeacher = user?.role === 'TEACHER';
  const isAdmin   = user?.role === 'ADMIN';

  const getStats = () => {
    if (isAdmin) {
      return [
        { label: 'Total Users', value: '1,284', icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
        { label: 'Active Courses', value: '42', icon: BookOpen, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
        { label: 'System Health', value: 'Optimal', icon: BarChart2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { label: 'Pending Reports', value: '0', icon: MessageSquare, color: 'text-rose-400', bg: 'bg-rose-500/10' },
      ];
    }
    if (isTeacher) {
      return [
        { label: 'Your Courses', value: '3', icon: BookOpen, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
        { label: 'Total Students', value: '156', icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
        { label: 'To Grade', value: '24', icon: CheckSquare, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        { label: 'Course Rating', value: '4.8', icon: Star, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
      ];
    }
    // Default: Student
    return [
      { label: 'Active Courses', value: '4', icon: BookOpen, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
      { label: 'Upcoming Deadlines', value: '3', icon: Calendar, color: 'text-amber-400', bg: 'bg-amber-500/10' },
      { label: 'AI Study Tokens', value: user?.is_premium ? 'Unlimited' : '10/day', icon: Star, color: 'text-purple-400', bg: 'bg-purple-500/10' },
      { label: 'Unread Messages', value: '12', icon: MessageSquare, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    ];
  };

  const stats = getStats();

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          {isAdmin ? 'System Overview' : `Good morning, ${user?.name.split(' ')[0]}!`}
        </h1>
        <p className="mt-1 text-slate-400">
          {isAdmin 
            ? 'Monitor platform performance and manage user growth.' 
            : isTeacher 
              ? "Here's an overview of your active classes and pending tasks." 
              : "Here's what's happening with your studies today."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bento-card flex items-center gap-4 transition-transform hover:-translate-y-1">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <p className="text-xl font-bold text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">
              {isAdmin ? 'Recent User Activity' : isTeacher ? 'Your Courses' : 'Recent Courses'}
            </h2>
            <button className="text-sm font-semibold text-indigo-400 hover:text-indigo-300">View all</button>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bento-card group flex items-center justify-between transition-all hover:bg-white/10">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center font-bold text-slate-500">
                    {isAdmin ? 'USR' : 'CS'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">
                      {isAdmin ? `New User Registered: User ${i}` : 'Introduction to Computer Science'}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {isAdmin ? '2 minutes ago' : 'Instructor: Dr. Emily Chen'}
                    </p>
                  </div>
                </div>
                {!isAdmin && (
                  <div className="text-right">
                    <div className="h-2 w-24 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full bg-indigo-500 w-2/3 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
                    </div>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      {isTeacher ? '42 Students Enrolled' : '67% Complete'}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-bold text-white mb-6">
              {isAdmin ? 'Queue Status' : isTeacher ? 'To Grade' : 'Deadlines'}
            </h2>
            <div className="rounded-2xl border border-white/10 bg-white/5 divide-y divide-white/10 overflow-hidden">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 hover:bg-white/5 transition-colors cursor-pointer">
                  <p className={`text-xs font-bold uppercase ${isAdmin ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isAdmin ? 'Running' : isTeacher ? 'Pending Review' : 'Tomorrow'}
                  </p>
                  <p className="font-medium text-white mt-1">
                    {isAdmin ? `Worker Instance #${i}` : isTeacher ? `Submission from Student ${i}` : 'Algorithm Analysis Quiz'}
                  </p>
                  <p className="text-sm text-slate-400">
                    {isAdmin ? 'Status: Healthy' : isTeacher ? 'Course: CS101' : 'Course: Advanced Algorithms'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
