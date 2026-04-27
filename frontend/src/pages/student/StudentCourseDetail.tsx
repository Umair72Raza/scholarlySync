import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Calendar, FileText, FileBox,
  Download, Eye, Loader2, AlertCircle,
  UploadCloud, CheckCircle, Clock, X, Info,
  Zap, Crown, ChevronLeft, ChevronRight, ZoomIn, ZoomOut
} from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useSocketEvent } from '../../context/SocketContext';
import { toast } from 'react-hot-toast';

// Set up PDF.js worker using the modern .mjs format required by v4+
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface CourseDetail {
  id: string;
  name: string;
  code: string;
  teacher: { name: string };
  assignments: {
    id: string;
    title: string;
    description: string;
    deadline: string;
    submissions: { status: string; grade?: number; feedback?: string }[];
  }[];
  materials: {
    id: string;
    title: string;
    content: string;
    fileUrl?: string;
    fileName?: string;
  }[];
}

export const StudentCourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewPdf, setPreviewPdf] = useState<{ url: string, title: string, content: string } | null>(null);

  // PDF View State
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);

  const { data: course, isLoading } = useQuery<CourseDetail>({
    queryKey: ['student-course-detail', id],
    queryFn: async () => {
      const { data } = await api.get(`/courses/${id}`);
      return data.data;
    }
  });

  // 📡 Real-time updates via custom hook
  const handleUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ['student-course-detail', id] });
  };

  useSocketEvent('SUBMISSION_VERIFIED', handleUpdate);
  useSocketEvent('SUBMISSION_GRADED', handleUpdate);
  useSocketEvent('SUBMISSION_PROCESSING', handleUpdate);

  const submitMutation = useMutation({
    mutationFn: (formData: FormData) => api.post('/submissions', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-course-detail', id] });
      setSelectedAssignment(null);
      setUploadFile(null);
    }
  });

  const handleFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !selectedAssignment) return;
    const formData = new FormData();
    // Append text fields BEFORE files to ensure req.body is populated early by Multer
    formData.append('assignmentId', selectedAssignment.id);
    formData.append('file', uploadFile);
    submitMutation.mutate(formData);
  };

  // Responsive Width State
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // TEMPORARY: Debug state to preview premium features
  const [debugPremium, setDebugPremium] = useState(false);
  const isPremium = user?.is_premium || debugPremium;

  // AI Chat State
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [aiQuestion, setAiQuestion] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  const handleAskAi = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!aiQuestion.trim() || !previewPdf || isAiLoading) return;

    const userMessage = { role: 'user' as const, content: aiQuestion };
    setChatMessages(prev => [...prev, userMessage]);
    setAiQuestion('');
    setIsAiLoading(true);

    try {
      const response = await api.post('/ai/ask', {
        materialId: course?.materials.find(m => m.title === previewPdf.title)?.id,
        question: aiQuestion,
        history: chatMessages
      });

      setChatMessages(prev => [...prev, response.data.data]);
    } catch (err) {
      console.error('AI Error:', err);
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error processing your question.' }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const generateSummary = async (materialId: string) => {
    try {
      setAiSummary('Generating summary...');
      const response = await api.post('/ai/summarize', { materialId });
      setAiSummary(response.data.data.summary);
    } catch (err) {
      console.error('Summary Error:', err);
      setAiSummary('Failed to generate summary.');
    }
  };

  // Trigger summary on PDF load if premium
  React.useEffect(() => {
    if (previewPdf && isPremium && !aiSummary) {
      const material = course?.materials.find(m => m.title === previewPdf.title);
      if (material) generateSummary(material.id);
    }
  }, [previewPdf, isPremium]);

  // Lock body scroll when PDF is open
  React.useEffect(() => {
    if (previewPdf) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = 'unset';
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.documentElement.style.overflow = 'unset';
      document.body.style.overflow = 'unset';
    };
  }, [previewPdf]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  if (isLoading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
    </div>
  );

  const handlePdfPreview = async (material: any) => {
    try {
      // Fetch the PDF as a blob to ensure authentication headers are included
      const response = await api.get(material.fileUrl, { responseType: 'blob' });
      const blobUrl = URL.createObjectURL(response.data);
      setPreviewPdf({
        url: blobUrl,
        title: material.title,
        content: material.content
      });
    } catch (err) {
      console.error('Failed to fetch PDF:', err);
      alert('Could not load PDF. Please ensure you are logged in.');
    }
  };


  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <header>
        <button
          onClick={() => navigate('/student/courses')}
          className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-4 group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Back to My Courses
        </button>
        <div className="flex items-center gap-3 mb-2">
          <span className="px-2 py-1 rounded bg-indigo-500/10 text-indigo-400 font-mono text-xs border border-indigo-500/20">
            {course?.code}
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400 text-sm">Prof. {course?.teacher.name}</span>
        </div>
        <h1 className="text-4xl font-bold text-white">{course?.name}</h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Calendar className="text-indigo-400" size={24} />
              Assignments
            </h2>
            <div className="space-y-4">
              {course?.assignments.map((assignment) => {
                const submission = assignment.submissions?.[0];
                return (
                  <div key={assignment.id} className="bento-card group">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center border ${submission?.status === 'GRADED'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-white/5 text-slate-400 border-white/5'
                          }`}>
                          <FileText size={24} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
                            {assignment.title}
                          </h3>
                          <p className="text-sm text-slate-500 mt-1 line-clamp-1">{assignment.description}</p>
                          <div className="flex items-center gap-4 mt-3">
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Clock size={12} />
                              Due: {new Date(assignment.deadline).toLocaleDateString()}
                            </span>
                            {submission && (
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${submission.status === 'GRADED'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                }`}>
                                {submission.status}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        {submission?.status === 'GRADED' ? (
                          <div className="text-right">
                            <div className="text-2xl font-black text-emerald-400">{submission.grade}%</div>
                            <button onClick={() => setSelectedAssignment(assignment)} className="text-xs text-slate-500 hover:text-white underline">View Feedback</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedAssignment(assignment)}
                            className={`px-6 py-2.5 rounded-xl font-bold transition-all ${submission ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-indigo-600 text-white shadow-lg'
                              }`}
                          >
                            {submission ? 'Resubmit' : 'Submit Now'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <FileBox className="text-emerald-400" size={20} />
              Resources
            </h2>
            <div className="space-y-3">
              {course?.materials.map((material) => {
                const isPdf = material.fileUrl?.toLowerCase().endsWith('.pdf');
                return (
                  <div
                    key={material.id}
                    onClick={() => isPdf ? handlePdfPreview(material) : window.open(material.fileUrl, '_blank')}
                    className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${isPdf ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        {isPdf ? <FileText size={18} /> : <FileBox size={18} />}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-semibold text-white truncate">{material.title}</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">{isPdf ? 'PDF' : 'ZIP'}</p>
                      </div>
                    </div>
                    {isPdf ? <Eye size={16} className="text-slate-500 group-hover:text-white" /> : <Download size={16} className="text-slate-500 group-hover:text-white" />}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {/* Assignment Modal */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-white">{selectedAssignment.title}</h2>
              <X onClick={() => setSelectedAssignment(null)} className="text-slate-500 cursor-pointer hover:text-white" />
            </div>
            {selectedAssignment.submissions?.[0]?.status === 'GRADED' ? (
              <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                <div className="text-emerald-400 font-bold mb-2">Grade: {selectedAssignment.submissions[0].grade}%</div>
                <div className="text-slate-300 text-sm italic">"{selectedAssignment.submissions[0].feedback}"</div>
              </div>
            ) : (
              <form onSubmit={handleFileSubmit} className="space-y-6">
                <div className="relative group">
                  <input type="file" required onChange={(e) => setUploadFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className="w-full border-2 border-dashed border-white/10 group-hover:border-indigo-500/50 rounded-2xl p-10 flex flex-col items-center justify-center bg-white/5">
                    <UploadCloud className="text-slate-500 group-hover:text-indigo-400 mb-2" size={40} />
                    <p className="text-sm text-slate-400">{uploadFile ? uploadFile.name : 'Upload your solution'}</p>
                  </div>
                </div>
                <button disabled={submitMutation.isPending} className="w-full py-4 rounded-xl bg-indigo-600 text-white font-bold">
                  {submitMutation.isPending ? 'Uploading...' : 'Submit'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* PDF Preview with AI Teaser */}
      {previewPdf && (
        <div className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-md overflow-hidden flex flex-col">
          <div className="flex-1 flex flex-col lg:flex-row min-h-0">
            {/* PDF Viewer Area */}
            <div className="h-[50vh] lg:h-full flex-1 flex flex-col min-w-0 border-b lg:border-b-0 lg:border-r border-white/10">
              <div className="p-3 border-b border-white/5 flex items-center justify-between bg-slate-900 shrink-0">
                <div className="flex items-center gap-3">
                  <button onClick={() => {
                    if (previewPdf.url.startsWith('blob:')) URL.revokeObjectURL(previewPdf.url);
                    setPreviewPdf(null);
                  }} className="p-2 hover:bg-white/5 rounded-lg text-slate-400"><X size={20} /></button>
                  <h3 className="text-white font-semibold truncate max-w-[120px] md:max-w-xs text-sm md:text-base">{previewPdf.title}</h3>
                </div>
                <div className="flex items-center gap-1 md:gap-2 bg-white/5 rounded-lg p-1">
                  <button onClick={() => setPageNumber(p => Math.max(1, p - 1))} className="p-1 text-slate-400 hover:text-white"><ChevronLeft size={18} /></button>
                  <span className="text-[10px] md:text-xs text-slate-400 px-1 md:px-2 whitespace-nowrap">{pageNumber} / {numPages || '?'}</span>
                  <button onClick={() => setPageNumber(p => Math.min(numPages || p, p + 1))} className="p-1 text-slate-400 hover:text-white"><ChevronRight size={18} /></button>
                  <div className="w-px h-3 bg-white/10 mx-1" />
                  <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-1 text-slate-400 hover:text-white"><ZoomOut size={16} /></button>
                  <button onClick={() => setScale(s => Math.min(2, s + 0.1))} className="p-1 text-slate-400 hover:text-white"><ZoomIn size={16} /></button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-800/50 p-2 md:p-8 custom-scrollbar">
                <div className="flex flex-col items-center min-h-full">
                  <Document
                    file={previewPdf.url}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={(error) => console.error('PDF Load Error:', error)}
                    loading={<Loader2 className="animate-spin text-indigo-500 my-20" />}
                    className="flex flex-col items-center"
                  >
                    <Page
                      pageNumber={pageNumber}
                      scale={scale}
                      className="shadow-2xl mb-8"
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                      width={windowWidth > 1280 ? 800 : (windowWidth > 1024 ? windowWidth - 420 : windowWidth - 32)}
                    />
                  </Document>
                </div>
              </div>
            </div>

            {/* AI Sidebar / Teaser */}
            <div className="w-full lg:w-96 bg-slate-900 border-l border-white/10 flex flex-col flex-1 lg:flex-none">
              <div className="p-4 lg:p-6 border-b border-white/10 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Zap className="text-indigo-400" size={20} />
                  <h4 className="text-lg font-bold text-white">AI Study Assistant</h4>
                </div>
                <button
                  onClick={() => setDebugPremium(!debugPremium)}
                  className="text-[10px] bg-white/5 hover:bg-white/10 text-slate-500 px-2 py-1 rounded border border-white/5"
                >
                  {debugPremium ? 'Exit Preview' : 'Preview Premium'}
                </button>
              </div>

              {isPremium ? (
                <div className="flex-1 flex flex-col min-h-0 bg-slate-900">
                  <div className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto custom-scrollbar">
                    {/* Summary Section */}
                    {aiSummary && (
                      <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 animate-fade-in">
                        <p className="text-[10px] text-indigo-300 font-bold uppercase mb-2">AI Summary</p>
                        <p className="text-xs md:text-sm text-slate-300 leading-relaxed italic whitespace-pre-line">
                          {aiSummary}
                        </p>
                      </div>
                    )}

                    {/* Chat Messages */}
                    <div className="space-y-4">
                      {chatMessages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] p-3 rounded-2xl text-xs md:text-sm ${msg.role === 'user'
                              ? 'bg-indigo-600 text-white rounded-tr-none'
                              : 'bg-white/5 text-slate-300 rounded-tl-none border border-white/5'
                            }`}>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                      {isAiLoading && (
                        <div className="flex justify-start">
                          <div className="bg-white/5 p-3 rounded-2xl rounded-tl-none border border-white/5">
                            <Loader2 className="animate-spin text-indigo-400" size={16} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Chat Input */}
                  <div className="p-4 border-t border-white/10 bg-slate-900/80 backdrop-blur-md">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleAskAi();
                      }}
                      className="relative"
                    >
                      <input
                        type="text"
                        value={aiQuestion}
                        onChange={(e) => setAiQuestion(e.target.value)}
                        placeholder="Ask Claude about this document..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-xs md:text-sm text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                        disabled={isAiLoading}
                      />
                      <button
                        type="submit"
                        disabled={isAiLoading || !aiQuestion.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-indigo-400 hover:text-indigo-300 disabled:opacity-50 transition-colors"
                      >
                        <Zap size={18} className={isAiLoading ? 'animate-pulse' : ''} />
                      </button>
                    </form>
                    <p className="text-[10px] text-slate-500 mt-2 text-center uppercase tracking-widest">Powered by Claude 3 Sonnet</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-gradient-to-b from-indigo-500/5 to-transparent">
                  <div className="p-6 md:p-8 flex flex-col items-center text-center min-h-full justify-center">
                    <div className="h-12 w-12 md:h-16 md:w-16 rounded-2xl md:rounded-3xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 md:mb-6 border border-indigo-500/20 shrink-0">
                      <Crown size={windowWidth > 768 ? 32 : 24} />
                    </div>
                    <h5 className="text-lg md:text-xl font-bold text-white mb-2">Unlock AI Insights</h5>
                    <p className="text-slate-400 text-xs md:text-sm mb-6 md:mb-8 max-w-[240px]">
                      Let ScholarlySync AI summarize this lecture and answer your questions instantly.
                    </p>
                    <ul className="text-left space-y-2 md:space-y-3 mb-6 md:mb-8 w-full max-w-[280px]">
                      <li className="flex items-center gap-2 text-[10px] md:text-xs text-slate-300">
                        <CheckCircle className="text-indigo-400 shrink-0" size={14} />
                        Instant document summarization
                      </li>
                      <li className="flex items-center gap-2 text-[10px] md:text-xs text-slate-300">
                        <CheckCircle className="text-indigo-400 shrink-0" size={14} />
                        Ask Claude questions about the content
                      </li>
                      <li className="flex items-center gap-2 text-[10px] md:text-xs text-slate-300">
                        <CheckCircle className="text-indigo-400 shrink-0" size={14} />
                        Generate exam prep quizzes
                      </li>
                    </ul>
                    <button className="w-full py-3 md:py-4 rounded-xl md:rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2 shrink-0">
                      <Zap size={18} />
                      Get Premium Now
                    </button>
                    <p className="mt-4 text-[10px] text-slate-500 uppercase tracking-widest shrink-0">Starting from $9.99/mo</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
