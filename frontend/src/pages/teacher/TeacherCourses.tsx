import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, BookOpen, MoreVertical, Search, Loader2, X, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

interface Course {
  id: string;
  name: string;
  code: string;
  _count: {
    assignments: number;
    materials: number;
  };
  createdAt: string;
}

export const TeacherCourses: React.FC = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCourse, setNewCourse]     = useState({ name: '', code: '' });
  const [formError, setFormError]     = useState('');

  const queryClient = useQueryClient();

  const { data: courses, isLoading, error } = useQuery<Course[]>({
    queryKey: ['teacher-courses'],
    queryFn: async () => {
      const { data } = await api.get('/courses/mine');
      return data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof newCourse) => api.post('/courses', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-courses'] });
      setIsModalOpen(false);
      setNewCourse({ name: '', code: '' });
      setFormError('');
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Failed to create course');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.name || !newCourse.code) {
      setFormError('Both fields are required');
      return;
    }
    createMutation.mutate(newCourse);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Course Management</h1>
          <p className="text-slate-400 mt-1">Organize your classes and curriculum.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
        >
          <Plus size={20} />
          Create New Course
        </button>
      </div>

      {/* Stats / Filters */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Search your courses..." 
            className="w-full bg-slate-900 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white outline-none focus:border-indigo-500/50"
          />
        </div>
        <div className="hidden md:flex items-center gap-4 text-sm text-slate-500">
          <span>Total Courses: <span className="text-white font-semibold">{courses?.length || 0}</span></span>
        </div>
      </div>

      {/* Course Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
          <p className="text-slate-400 animate-pulse">Loading your courses...</p>
        </div>
      ) : error ? (
        <div className="p-8 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-center">
          <AlertCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>Failed to load courses. Please try again later.</p>
        </div>
      ) : courses?.length === 0 ? (
        <div className="text-center py-24 rounded-3xl border-2 border-dashed border-white/5">
          <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
            <BookOpen className="text-slate-500" size={32} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No courses found</h3>
          <p className="text-slate-500 max-w-xs mx-auto mb-8">
            You haven't created any courses yet. Start by building your first class.
          </p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="text-indigo-400 hover:text-indigo-300 font-semibold"
          >
            + Create a course
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses?.map((course) => (
            <div 
              key={course.id} 
              onClick={() => navigate(`/teacher/courses/${course.id}`)}
              className="bento-card group hover:-translate-y-1 transition-all cursor-pointer"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <BookOpen size={24} />
                </div>
                <button className="text-slate-600 hover:text-white transition-colors">
                  <MoreVertical size={20} />
                </button>
              </div>
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors mb-1">
                  {course.name}
                </h3>
                <p className="text-sm font-mono text-slate-500">{course.code}</p>
              </div>
              <div className="flex items-center gap-6 pt-6 border-t border-white/5 text-sm">
                <div className="flex flex-col">
                  <span className="text-white font-bold">{course._count.assignments}</span>
                  <span className="text-slate-500 text-xs">Assignments</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-bold">{course._count.materials}</span>
                  <span className="text-slate-500 text-xs">Materials</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Course Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-white">New Course</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Course Name</label>
                <input 
                  type="text" 
                  value={newCourse.name}
                  onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                  placeholder="e.g. Advanced Calculus" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-indigo-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Course Code</label>
                <input 
                  type="text" 
                  value={newCourse.code}
                  onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. MATH301" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-indigo-500 transition-all font-mono"
                />
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
                  <AlertCircle size={16} />
                  {formError}
                </div>
              )}

              <button 
                type="submit"
                disabled={createMutation.isPending}
                className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98] disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Course'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
