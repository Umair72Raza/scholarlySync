import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { SignIn } from './pages/SignIn';
import { Dashboard } from './pages/Dashboard';
import { Landing } from './pages/Landing';
import { StudentLayout, TeacherLayout, AdminLayout } from './layouts/RoleLayouts';
import { TeacherCourses } from './pages/teacher/TeacherCourses';
import { TeacherCourseDetail } from './pages/teacher/TeacherCourseDetail';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function DashboardRedirect() {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/signin" replace />;
  
  const role = user.role;
  if (role === 'ADMIN')   return <Navigate to="/admin" replace />;
  if (role === 'TEACHER') return <Navigate to="/teacher" replace />;
  return <Navigate to="/student" replace />;
}

function AppRoutes() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <Routes>
      {/* ── Public ─────────────────────────────── */}
      <Route path="/" element={<Landing />} />
      <Route path="/signin" element={<SignIn />} />
      {/* Legacy redirect */}
      <Route path="/login" element={<Navigate to="/signin" replace />} />
      <Route
        path="/unauthorized"
        element={
          <div className="flex h-screen items-center justify-center font-bold text-red-500">
            Unauthorized Access
          </div>
        }
      />

      {/* ── Protected ──────────────────────────── */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardRedirect />} />
        
        {/* Student Routes */}
        <Route element={<StudentLayout />}>
          <Route path="/student" element={<Dashboard />} />
          <Route path="/student/courses" element={<div className="text-white">Student Courses</div>} />
          <Route path="/student/assignments" element={<div className="text-white">Student Assignments</div>} />
          <Route path="/student/ai-room" element={<div className="text-white">AI Study Room</div>} />
        </Route>

        {/* Teacher Routes */}
        <Route element={<TeacherLayout />}>
          <Route path="/teacher" element={<Dashboard />} />
          <Route path="/teacher/courses" element={<TeacherCourses />} />
          <Route path="/teacher/courses/:id" element={<TeacherCourseDetail />} />
          <Route path="/teacher/grading" element={<div className="text-white">Grading Center</div>} />
          <Route path="/teacher/analytics" element={<div className="text-white">Class Analytics</div>} />
        </Route>

        {/* Admin Routes */}
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/users" element={<div className="text-white">User Management</div>} />
          <Route path="/admin/system" element={<div className="text-white">System Settings</div>} />
          <Route path="/admin/broadcast" element={<div className="text-white">Bulk Broadcast</div>} />
        </Route>
      </Route>

      {/* ── Fallback ───────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AppRoutes />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
