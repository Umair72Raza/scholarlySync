import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, Filter, CheckCircle, Clock, 
  ExternalLink, MessageSquare, Award, Loader2, FileText,
  ChevronRight, AlertCircle, X, Download
} from 'lucide-react';
import api from '../../services/api';
import { useSocketEvent } from '../../context/SocketContext';
import { toast } from 'react-hot-toast';

interface Submission {
  id: string;
  status: string;
  grade?: number;
  feedback?: string;
  createdAt: string;
  fileName: string;
  fileUrl: string;
  user: {
    name: string;
  };
  assignment: {
    title: string;
    course: {
      name: string;
    };
  };
}

export const TeacherGrading: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  
  // Grading state
  const [grade, setGrade] = useState<number | ''>('');
  const [feedback, setFeedback] = useState('');

  const { data: submissions, isLoading, error } = useQuery<Submission[]>({
    queryKey: ['teacher-submissions'],
    queryFn: async () => {
      const { data } = await api.get('/submissions/teacher');
      return data.data.submissions;
    }
  });

  // 📡 Real-time updates via custom hook
  useSocketEvent('NEW_SUBMISSION', () => {
    queryClient.invalidateQueries({ queryKey: ['teacher-submissions'] });
  });

  const gradeMutation = useMutation({
    mutationFn: (data: { id: string, grade: number, feedback: string }) => 
      api.patch(`/submissions/${data.id}/grade`, { grade: data.grade, feedback: data.feedback }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-submissions'] });
      setSelectedSubmission(null);
      setGrade('');
      setFeedback('');
    }
  });

  const filteredSubmissions = submissions?.filter(s => {
    const matchesSearch = s.user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         s.assignment.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = statusFilter === 'ALL';
    if (statusFilter === 'PENDING') {
      matchesStatus = s.status === 'QUEUED' || s.status === 'PROCESSING';
    } else if (statusFilter === 'GRADED') {
      matchesStatus = s.status === 'GRADED';
    }
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'GRADED': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'PROCESSING': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'FAILED': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default: return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    }
  };

  const handleGradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission || grade === '') return;
    gradeMutation.mutate({
      id: selectedSubmission.id,
      grade: Number(grade),
      feedback
    });
  };

  if (isLoading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <h1 className="text-4xl font-bold text-white mb-2">Grading Center</h1>
        <p className="text-slate-400">Review and provide feedback on student submissions.</p>
      </header>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Search student or assignment..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-indigo-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {['ALL', 'PENDING', 'GRADED'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                statusFilter === status 
                ? 'bg-indigo-600 border-indigo-500 text-white' 
                : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bento-card overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-slate-500 text-sm">
                <th className="px-6 py-4 font-semibold">Student</th>
                <th className="px-6 py-4 font-semibold">Assignment / Course</th>
                <th className="px-6 py-4 font-semibold">Submitted</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredSubmissions?.map((s) => (
                <tr key={s.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-white">{s.user.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-white text-sm">{s.assignment.title}</div>
                    <div className="text-slate-500 text-xs">{s.assignment.course.name}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-sm">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(s.status)}`}>
                      {s.status === 'GRADED' ? <CheckCircle size={12} /> : <Clock size={12} />}
                      {s.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => {
                        setSelectedSubmission(s);
                        setGrade(s.grade ?? '');
                        setFeedback(s.feedback ?? '');
                      }}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-bold hover:bg-indigo-500 hover:text-white transition-all"
                    >
                      {s.status === 'GRADED' ? 'Edit Grade' : 'Grade Now'}
                      <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredSubmissions?.length === 0 && (
            <div className="p-20 text-center text-slate-500">
              <AlertCircle className="mx-auto mb-4 opacity-20" size={48} />
              <p>No submissions found matching your filters.</p>
            </div>
          )}
        </div>
      </div>

      {/* Grading Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
              <div>
                <h2 className="text-xl font-bold text-white">Grade Submission</h2>
                <p className="text-xs text-slate-400 mt-1">{selectedSubmission.user.name} • {selectedSubmission.assignment.title}</p>
              </div>
              <button onClick={() => setSelectedSubmission(null)} className="text-slate-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-8">
              {/* File Info */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <FileText size={20} />
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm">{selectedSubmission.fileName}</div>
                    <div className="text-slate-500 text-xs">Submitted on {new Date(selectedSubmission.createdAt).toLocaleString()}</div>
                  </div>
                </div>
                <button 
                  onClick={() => window.open(selectedSubmission.fileUrl, '_blank')}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm transition-all"
                >
                  <Download size={16} />
                  Download File
                </button>
              </div>

              <form onSubmit={handleGradeSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-slate-400 mb-2">Grade (0-100)</label>
                    <div className="relative">
                      <Award className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input 
                        type="number" 
                        min="0" max="100"
                        placeholder="100"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-indigo-500 transition-all font-bold text-lg"
                        value={grade}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : Number(e.target.value);
                          if (val === '' || (val >= 0 && val <= 100)) {
                            setGrade(val);
                          }
                        }}
                        required
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-400 mb-2">Feedback (Optional)</label>
                    <div className="relative">
                      <MessageSquare className="absolute left-4 top-4 text-slate-500" size={18} />
                      <textarea 
                        placeholder="Well done! Great attention to detail..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-indigo-500 transition-all min-h-[100px] resize-none"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setSelectedSubmission(null)}
                    className="flex-1 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={gradeMutation.isPending}
                    className="flex-[2] py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {gradeMutation.isPending && <Loader2 size={18} className="animate-spin" />}
                    {selectedSubmission.status === 'GRADED' ? 'Update Grade' : 'Confirm Grade'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


