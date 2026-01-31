import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/components/contexts/ThemeProvider';
import { AuthProvider, useAuth } from '@/components/contexts/AuthContext';
import { ProgressProvider } from '@/components/contexts/ProgressContext';
import { NotificationProvider } from '@/components/contexts/NotificationContext';
import { ProtectedRoute } from '@/components/guards/ProtectedRoute';
import { AdminRoute } from '@/components/guards/AdminRoute';
import { Toaster } from '@/components/ui/sonner';
import MainLayout from '@/components/layouts/MainLayout';
import LoginPage from '@/pages/auth/LoginPage';
import ModulesPage from '@/pages/modules/ModulesPage';
import SettingsPage from '@/pages/profile/SettingsPage';
import NotificationsPage from '@/pages/profile/NotificationsPage';
import LessonListView from '@/components/lessons/LessonListView';
import LessonPage from '@/pages/lessons/LessonPage';
import PlaygroundPage from '@/pages/playground/PlaygroundPage';
import AdminModules from '@/pages/admin/AdminModulesPage';
import AdminModuleContent from '@/pages/admin/AdminModuleContentPage';
import AdminReviews from '@/pages/admin/AdminReviewsPage';
import { AdminGroupsPage } from '@/pages/admin/AdminGroupsPage';

function HomeRedirect() {
  const { isAdmin } = useAuth();
  if (isAdmin) {
    return <Navigate to="/admin/reviews" replace />;
  }
  return <Navigate to="/modules" replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <ProgressProvider>
            <Router>
              <Routes>
              <Route path="/login" element={<LoginPage />} />
              
              <Route element={<MainLayout />}>
                <Route path="/" element={
                  <ProtectedRoute>
                    <HomeRedirect />
                  </ProtectedRoute>
                } />
                <Route path="/modules" element={<ProtectedRoute><ModulesPage /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                <Route path="/modules/:moduleSlug" element={<ProtectedRoute><LessonListView /></ProtectedRoute>} />
                <Route path="/playground" element={<ProtectedRoute><PlaygroundPage /></ProtectedRoute>} />
                
                <Route path="/admin/modules" element={<AdminRoute><AdminModules /></AdminRoute>} />
                <Route path="/admin/modules/:moduleSlug" element={<AdminRoute><AdminModuleContent /></AdminRoute>} />
                <Route path="/admin/reviews" element={<AdminRoute><AdminReviews /></AdminRoute>} />
                <Route path="/admin/groups" element={<AdminRoute><AdminGroupsPage /></AdminRoute>} />
              </Route>

              <Route path="/modules/:moduleSlug/:lessonId" element={<ProtectedRoute><LessonPage /></ProtectedRoute>} />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Toaster />
          </Router>
        </ProgressProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
