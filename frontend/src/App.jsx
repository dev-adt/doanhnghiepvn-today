import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import brandConfig from './brand.config';
import { PWAProvider } from './contexts/PWAContext';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Members from './pages/Members';
import Posts from './pages/Posts';
import PostDetail from './pages/PostDetail';
import Events from './pages/Events';
import AIChat from './pages/AIChat';
import Search from './pages/Search';
import Guide from './pages/Guide';
import MemberDashboard from './pages/MemberDashboard';
import CreatorDashboard from './pages/CreatorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminMembers from './pages/AdminMembers';
import AdminPosts from './pages/AdminPosts';
import AdminConfig from './pages/AdminConfig';
import AdminEvents from './pages/AdminEvents';
import AdminCategories from './pages/AdminCategories';
import AdminCreators from './pages/AdminCreators';
import AdminOrganizers from './pages/AdminOrganizers';
import AdminLeads from './pages/AdminLeads';
import AdminCheckin from './pages/AdminCheckin';
import OrganizerDashboard from './pages/OrganizerDashboard';

// Tự động cuộn lên đầu trang khi chuyển tuyến đường và đồng bộ title
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    if (pathname === '/') {
      document.title = `${brandConfig.brandName} — ${brandConfig.slogan}`;
    }
  }, [pathname]);

  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <PWAProvider>
            <Router>
              <ScrollToTop />
              <PWAInstallPrompt />
              <Routes>
            {/* Tuyến đường công khai */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/members" element={<Members />} />
            <Route path="/posts" element={<Posts />} />
            <Route path="/posts/:id" element={<PostDetail />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:id" element={<Events />} />
            <Route path="/su-kien" element={<Events />} />
            <Route path="/su-kien/:id" element={<Events />} />
            <Route path="/ai-chat" element={<AIChat />} />
            <Route path="/search" element={<Search />} />
            <Route path="/guide" element={<Guide />} />

            {/* Tuyến đường bảo vệ dành cho Hội viên */}
            <Route 
              path="/member-dashboard" 
              element={
                <ProtectedRoute allowedRoles={['member']}>
                  <MemberDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Tuyến đường bảo vệ dành cho Biên tập viên */}
            <Route 
              path="/creator-dashboard" 
              element={
                <ProtectedRoute allowedRoles={['creator']}>
                  <CreatorDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Tuyến đường bảo vệ dành cho Ban tổ chức Sự kiện */}
            <Route 
              path="/organizer-dashboard" 
              element={
                <ProtectedRoute allowedRoles={['organizer']}>
                  <OrganizerDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Tuyến đường Check-in Sự kiện bằng camera QR & mã vé */}
            <Route 
              path="/admin/checkin" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'organizer']}>
                  <AdminCheckin />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin-checkin" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'organizer']}>
                  <AdminCheckin />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/organizer/checkin" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'organizer']}>
                  <AdminCheckin />
                </ProtectedRoute>
              } 
            />

            {/* Tuyến đường bảo vệ dành cho Admin */}
            <Route 
              path="/admin-dashboard" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin-members" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminMembers />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin-posts" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminPosts />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin-events" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminEvents />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin-categories" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminCategories />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin-creators" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminCreators />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin-organizers" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminOrganizers />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin-leads" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminLeads />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin-config" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminConfig />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </Router>
          </PWAProvider>
      </AuthProvider>
    </LanguageProvider>
  </ErrorBoundary>
  );
}

export default App;
