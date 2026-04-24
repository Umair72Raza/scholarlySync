import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen, Search, Plus, Compass,
  ArrowRight, Loader2, AlertCircle, CheckCircle,
  GraduationCap, User, Code,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

interface Course {
  id: string;
  name: string;
  code: string;
  teacher: {
    name: string;
  };
}

export const StudentCourses: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'MY_COURSES' | 'DISCOVER'>('MY_COURSES');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch Enrolled Courses
  const { data: enrolled, isLoading: loadingEnrolled } = useQuery<Course[]>({
    queryKey: ['enrolled-courses'],
    queryFn: async () => {
      const { data } = await api.get('/courses/enrolled');
      return data.data.courses;
    }
  });

  // Fetch Available Courses
  const { data: available, isLoading: loadingAvailable } = useQuery<Course[]>({
    queryKey: ['available-courses'],
    queryFn: async () => {
      const { data } = await api.get('/courses/available');
      return data.data.courses;
    },
    enabled: activeTab === 'DISCOVER'
  });

  const enrollMutation = useMutation({
    mutationFn: (courseId: string) => api.post(`/courses/${courseId}/enroll`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrolled-courses'] });
      queryClient.invalidateQueries({ queryKey: ['available-courses'] });
      setActiveTab('MY_COURSES');
    }
  });

  const unenrollMutation = useMutation({
    mutationFn: (courseId: string) => api.delete(`/courses/${courseId}/enroll`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrolled-courses'] });
      queryClient.invalidateQueries({ queryKey: ['available-courses'] });
    }
  });

  const filteredCourses = (activeTab === 'MY_COURSES' ? enrolled : available)?.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loadingEnrolled) return (
    <div className="flex h-[60vh] items-center justify-center">
      <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">My Learning</h1>
          <p className="text-slate-400">Manage your enrollments and discover new challenges.</p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
          <button
            onClick={() => setActiveTab('MY_COURSES')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'MY_COURSES' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
          >
            <BookOpen size={18} />
            My Courses
          </button>
          <button
            onClick={() => setActiveTab('DISCOVER')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'DISCOVER' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
          >
            <Compass size={18} />
            Explore
          </button>
        </div>
      </header>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
        <input
          type="text"
          placeholder={activeTab === 'MY_COURSES' ? "Search your courses..." : "Find new courses by name or code..."}
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-indigo-500 transition-all text-lg"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCourses?.map((course) => (
          <div key={course.id} className="bento-card group hover:scale-[1.02] transition-all cursor-pointer flex flex-col h-full">
            <div className="flex items-start justify-between mb-6">
              <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                <GraduationCap size={28} />
              </div>
              <span className="px-3 py-1 rounded-lg bg-white/5 text-slate-400 font-mono text-xs border border-white/10">
                {course.code}
              </span>
            </div>

            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                {course.name}
              </h3>
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-6">
                <User size={14} />
                <span>Prof. {course.teacher?.name || 'Academic Faculty'}</span>
              </div>
            </div>

            {activeTab === 'MY_COURSES' ? (
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/student/courses/${course.id}`)}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all flex items-center justify-center gap-2 group/btn"
                >
                  Go to Classroom
                  <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Are you sure you want to leave this class?')) {
                      unenrollMutation.mutate(course.id);
                    }
                  }}
                  disabled={unenrollMutation.isPending && unenrollMutation.variables === course.id}
                  className="px-3 rounded-xl bg-white/5 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-all border border-white/5"
                  title="Leave Class"
                >
                  {unenrollMutation.isPending && unenrollMutation.variables === course.id ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <X size={18} />
                  )}
                </button>
              </div>
            ) : (
              <button
                onClick={() => enrollMutation.mutate(course.id)}
                disabled={enrollMutation.isPending && enrollMutation.variables === course.id}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {enrollMutation.isPending && enrollMutation.variables === course.id ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Plus size={18} />
                )}
                Enroll Now
              </button>
            )}
          </div>
        ))}

        {filteredCourses?.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-12 inline-block max-w-md">
              <Compass className="mx-auto mb-6 text-slate-600" size={64} />
              <h3 className="text-xl font-bold text-white mb-2">
                {activeTab === 'MY_COURSES' ? "No Courses Enrolled" : "No Courses Found"}
              </h3>
              <p className="text-slate-500 mb-8">
                {activeTab === 'MY_COURSES'
                  ? "You haven't joined any classes yet. Head over to the Explore tab to find something interesting!"
                  : "We couldn't find any courses matching your search. Check the spelling or browse all available classes."}
              </p>
              {activeTab === 'MY_COURSES' && (
                <button
                  onClick={() => setActiveTab('DISCOVER')}
                  className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-all"
                >
                  Discover Courses
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
