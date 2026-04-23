import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, Calendar, FileText, ArrowLeft, MoreVertical, 
  Clock, CheckCircle, AlertCircle, Loader2, X,
  FileBox, Download, Eye, UploadCloud
} from 'lucide-react';
import api from '../../services/api';

interface Assignment {
  id: string;
  title: string;
  deadline: string;
  description: string;
}

interface Material {
  id: string;
  title: string;
  content: string;
  fileUrl?: string;
  fileName?: string;
}

interface CourseDetail {
  id: string;
  name: string;
  code: string;
  assignments: Assignment[];
  materials: Material[];
}

export const TeacherCourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [previewPdf, setPreviewPdf] = useState<{ url: string; title: string } | null>(null);

  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    deadline: '',
    courseId: id || ''
  });

  const [newMaterial, setNewMaterial] = useState({
    title: '',
    content: '',
    file: null as File | null
  });

  const [formError, setFormError] = useState('');

  const { data: course, isLoading, error } = useQuery<CourseDetail>({
    queryKey: ['course-detail', id],
    queryFn: async () => {
      const { data } = await api.get(`/courses/${id}`);
      return data.data;
    },
    enabled: !!id
  });

  const createAssignmentMutation = useMutation({
    mutationFn: (data: typeof newAssignment) => api.post('/assignments', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-detail', id] });
      setIsModalOpen(false);
      setNewAssignment({ title: '', description: '', deadline: '', courseId: id || '' });
      setFormError('');
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Failed to create assignment');
    }
  });

  const createMaterialMutation = useMutation({
    mutationFn: (formData: FormData) => api.post('/materials', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-detail', id] });
      setIsMaterialModalOpen(false);
      setNewMaterial({ title: '', content: '', file: null });
      setFormError('');
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Failed to upload material');
    }
  });

  const handleAssignmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssignment.title || !newAssignment.deadline) {
      setFormError('Title and deadline are required');
      return;
    }
    createAssignmentMutation.mutate(newAssignment);
  };

  const handleMaterialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterial.title) {
      setFormError('Title is required');
      return;
    }
    
    const formData = new FormData();
    formData.append('title', newMaterial.title);
    formData.append('content', newMaterial.content);
    formData.append('courseId', id || '');
    if (newMaterial.file) {
      formData.append('file', newMaterial.file);
    }
    
    createMaterialMutation.mutate(formData);
  };

  const handleMaterialClick = (material: Material) => {
    if (!material.fileUrl) return;
    
    // Ensure the URL starts with / for the proxy to catch it
    const normalizedUrl = material.fileUrl.startsWith('/') 
      ? material.fileUrl 
      : `/${material.fileUrl}`;
    
    const isPdf = normalizedUrl.toLowerCase().endsWith('.pdf');
    if (isPdf) {
      setPreviewPdf({ url: normalizedUrl, title: material.title });
    } else {
      // Direct download for ZIP or others
      window.open(normalizedUrl, '_blank');
    }
  };

  if (isLoading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
    </div>
  );

  if (error || !course) return (
    <div className="p-8 text-center">
      <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-6 rounded-2xl inline-block">
        <AlertCircle className="mx-auto mb-4" size={40} />
        <h2 className="text-xl font-bold mb-2">Error Loading Course</h2>
        <p>The course might not exist or you don't have permission to view it.</p>
        <button onClick={() => navigate('/teacher/courses')} className="mt-4 text-indigo-400 font-semibold underline">Back to Courses</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <button 
          onClick={() => navigate('/teacher/courses')}
          className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-4 group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Back to Course Management
        </button>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2 py-1 rounded bg-indigo-500/10 text-indigo-400 font-mono text-xs border border-indigo-500/20">
                {course.code}
              </span>
            </div>
            <h1 className="text-4xl font-bold text-white">{course.name}</h1>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setIsMaterialModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold transition-all border border-white/10"
            >
              <UploadCloud size={20} />
              Add Material
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-lg shadow-indigo-500/20"
            >
              <Plus size={20} />
              Add Assignment
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Assignments */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Calendar className="text-indigo-400" size={24} />
                Assignments
              </h2>
            </div>
            {course.assignments?.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white/5 border border-white/5 text-slate-500">No assignments created.</div>
            ) : (
              <div className="space-y-4">
                {course.assignments?.map((assignment) => (
                  <div key={assignment.id} className="bento-card group flex items-center justify-between hover:bg-white/10 transition-all cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400"><FileText size={20} /></div>
                      <div>
                        <h3 className="font-semibold text-white group-hover:text-indigo-400 transition-colors">{assignment.title}</h3>
                        <p className="text-xs text-slate-500 mt-1">Due: {new Date(assignment.deadline).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <MoreVertical size={20} className="text-slate-600" />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Materials */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <FileBox className="text-emerald-400" size={24} />
                Study Materials
              </h2>
            </div>
            {course.materials?.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white/5 border border-white/5 text-slate-500">No materials uploaded.</div>
            ) : (
              <div className="space-y-4">
                {course.materials?.map((material) => {
                  const isPdf = material.fileUrl?.toLowerCase().endsWith('.pdf');
                  return (
                    <div 
                      key={material.id} 
                      onClick={() => handleMaterialClick(material)}
                      className="bento-card group flex items-center justify-between hover:bg-white/10 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${isPdf ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                          {isPdf ? <FileText size={20} /> : <FileBox size={20} />}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">{material.title}</h3>
                          <p className="text-xs text-slate-500 mt-1">{material.fileName || 'Text Resource'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isPdf ? <Eye size={18} className="text-slate-500" /> : <Download size={18} className="text-slate-500" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-8">
          <div className="bento-card">
            <h3 className="text-lg font-bold text-white mb-6">Course Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-white/5 text-center">
                <p className="text-xs text-slate-500 mb-1">Students</p>
                <p className="text-lg font-bold text-white">0</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 text-center">
                <p className="text-xs text-slate-500 mb-1">Pass Rate</p>
                <p className="text-lg font-bold text-white">N/A</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-white">New Assignment</h2>
              <X onClick={() => setIsModalOpen(false)} className="text-slate-500 cursor-pointer hover:text-white" />
            </div>
            <form onSubmit={handleAssignmentSubmit} className="space-y-6">
              <input 
                type="text" placeholder="Assignment Title" required
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-indigo-500"
                value={newAssignment.title} onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})}
              />
              <textarea 
                placeholder="Description" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-indigo-500 min-h-[100px]"
                value={newAssignment.description} onChange={(e) => setNewAssignment({...newAssignment, description: e.target.value})}
              />
              <input 
                type="datetime-local" required
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-indigo-500"
                value={newAssignment.deadline} onChange={(e) => setNewAssignment({...newAssignment, deadline: e.target.value})}
              />
              <button disabled={createAssignmentMutation.isPending} className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold disabled:opacity-50">
                {createAssignmentMutation.isPending ? 'Publishing...' : 'Publish Assignment'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Material Modal */}
      {isMaterialModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-white">Upload Material</h2>
              <X onClick={() => setIsMaterialModalOpen(false)} className="text-slate-500 cursor-pointer hover:text-white" />
            </div>
            <form onSubmit={handleMaterialSubmit} className="space-y-6">
              <input 
                type="text" placeholder="Material Title (e.g. Week 4 Notes)" required
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-indigo-500"
                value={newMaterial.title} onChange={(e) => setNewMaterial({...newMaterial, title: e.target.value})}
              />
              <textarea 
                placeholder="Brief summary or content notes..." 
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-indigo-500 min-h-[100px]"
                value={newMaterial.content} onChange={(e) => setNewMaterial({...newMaterial, content: e.target.value})}
              />
              <div className="relative group">
                <input 
                  type="file" accept=".pdf,.zip"
                  onChange={(e) => setNewMaterial({...newMaterial, file: e.target.files?.[0] || null})}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="w-full border-2 border-dashed border-white/10 group-hover:border-indigo-500/50 rounded-2xl p-8 flex flex-col items-center justify-center transition-all bg-white/5">
                  <UploadCloud className="text-slate-500 group-hover:text-indigo-400 mb-2" size={32} />
                  <p className="text-sm text-slate-400">
                    {newMaterial.file ? newMaterial.file.name : 'Click to upload PDF or ZIP'}
                  </p>
                </div>
              </div>
              <button disabled={createMaterialMutation.isPending} className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold disabled:opacity-50">
                {createMaterialMutation.isPending ? 'Uploading...' : 'Upload Resource'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      {previewPdf && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="w-full h-full max-w-5xl flex flex-col bg-slate-900 rounded-3xl border border-white/10 overflow-hidden animate-slide-up">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-white font-semibold">{previewPdf.title}</h3>
              <button onClick={() => setPreviewPdf(null)} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-all">
                <X size={24} />
              </button>
            </div>
            <iframe 
              src={previewPdf.url} 
              className="w-full flex-1 border-none"
              title="PDF Preview"
            />
          </div>
        </div>
      )}
    </div>
  );
};
