import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import brandConfig from './brand.config';
import { PWAProvider } from './contexts/PWAContext';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';

// Public Core Pages (Eagerly loaded for instant first paint)
import Home from './pages/Home';
import Posts from './pages/Posts';
import PostDetail from './pages/PostDetail';
import Events from './pages/Events';
import Members from './pages/Members';

// Code-split Pages (Lazy loaded on demand to reduce initial JS payload by >60%)
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const AIChat = React.lazy(() => import('./pages/AIChat'));
const Search = React.lazy(() => import('./pages/Search'));
const Guide = React.lazy(() => import('./pages/Guide'));
const MemberDashboard = React.lazy(() => import('./pages/MemberDashboard'));
const CreatorDashboard = React.lazy(() => import('./pages/CreatorDashboard'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const AdminMembers = React.lazy(() => import('./pages/AdminMembers'));
const AdminPosts = React.lazy(() => import('./pages/AdminPosts'));
const AdminConfig = React.lazy(() => import('./pages/AdminConfig'));
const AdminEvents = React.lazy(() => import('./pages/AdminEvents'));
const AdminCategories = React.lazy(() => import('./pages/AdminCategories'));
const AdminCreators = React.lazy(() => import('./pages/AdminCreators'));
const AdminOrganizers = React.lazy(() => import('./pages/AdminOrganizers'));
const AdminLeads = React.lazy(() => import('./pages/AdminLeads'));
const AdminCheckin = React.lazy(() => import('./pages/AdminCheckin'));
const OrganizerDashboard = React.lazy(() => import('./pages/OrganizerDashboard'));

// Ultra-fast pure CSS fallback (No external fonts or CDN dependencies required)
const PageLoadingFallback = () => (
  <div style={{
    minHeight: '60vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: '12px',
    color: '#0F52BA'
  }}>
    <div style={{
      width: '38px',
      height: '38px',
      borderRadius: '50%',
      border: '3px solid rgba(15, 82, 186, 0.2)',
      borderTopColor: '#00E5FF',
      animation: 'dnvnSpin 0.7s linear infinite'
    }} />
    <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>Đang tải trang...</span>
    <style>{`@keyframes dnvnSpin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

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
              <React.Suspense fallback={<PageLoadingFallback />}>
                <Routes>
            {/* Tuyến đường công khai */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/members" element={<Members />} />
            <Route path="/members/:id" element={<Members />} />
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
              </React.Suspense>
        </Router>
          </PWAProvider>
      </AuthProvider>
    </LanguageProvider>
  </ErrorBoundary>
  );
}

export default App;
