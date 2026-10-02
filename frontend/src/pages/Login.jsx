import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Login = () => {
  const { login, setGuestMode } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const navigate = useNavigate();

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotMessage('');
    setForgotLoading(true);

    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra.');
      }
      setForgotMessage(data.message || 'Mật khẩu mới đã được gửi về email của bạn.');
    } catch (err) {
      setForgotError(err.message);
    } finally {
      setForgotLoading(false);
    }
  };

  useEffect(() => {
    document.body.classList.add('public-body');
    document.body.classList.remove('light-theme');
  }, []);


  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(username, password);
      // Đăng nhập thành công -> Điều hướng tương ứng với vai trò
      if (data.role === 'admin') {
        navigate('/admin-dashboard');
      } else if (data.role === 'organizer') {
        navigate('/organizer-dashboard');
      } else if (data.role === 'creator') {
        navigate('/creator-dashboard');
      } else {
        navigate('/member-dashboard');
      }
    } catch (err) {
      setError(err.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại tài khoản và mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAsGuest = () => {
    setGuestMode();
    navigate('/');
  };

  return (
    <div className="public-body" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      {/* Background Blur Spots */}
      <div style={{ position: 'fixed', top: '-10%', left: '-10%', width: '350px', height: '350px', background: 'radial-gradient(circle, rgba(79,70,229,0.15) 0%, rgba(79,70,229,0) 70%)', borderRadius: '50%', zIndex: 1, filter: 'blur(30px)', pointerEvents: 'none' }}></div>
      <div style={{ position: 'fixed', bottom: '-10%', right: '-10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0) 70%)', borderRadius: '50%', zIndex: 1, filter: 'blur(30px)', pointerEvents: 'none' }}></div>

      <div style={{ width: '100%', maxWidth: '420px', padding: '1.5rem', zIndex: 10 }}>
        <div className="glass-card" style={{ padding: '2.5rem 2.25rem', borderRadius: '16px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '2rem', textAlign: 'center' }}>
            <div className="logo-icon" style={{ width: 'auto', height: '60px', borderRadius: '16px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(13, 148, 136, 0.35)', border: '1px solid rgba(45, 212, 191, 0.4)', padding: '6px 14px', background: 'rgba(15, 23, 42, 0.8)' }}>
              <img src="/logo_doanhnghiepvn.png" alt="DoanhNghiepVN.today Logo" onError={(e) => { e.target.style.display = 'none'; }} style={{ height: '100%', width: 'auto', objectFit: 'contain' }} />
            </div>
            <div>
              <div className="logo-name" style={{ fontFamily: 'var(--font-title)', fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>DoanhNghiepVN<span style={{ color: '#2DD4BF' }}>.today</span></div>
              <div className="logo-sub" style={{ fontSize: '10.5px', color: '#0D9488', fontWeight: 700, marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>TẠP CHÍ DOANH NGHIỆP VIỆT NAM</div>
            </div>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '1.5rem' }}>
            Đăng nhập tài khoản của bạn để vào Dashboard tương ứng hoặc tiếp tục với quyền khách vãng lai.
          </p>

          {error && (
            <div className="error-box" style={{ display: 'flex', background: 'rgba(239, 68, 68, 0.1)', border: '0.5px solid rgba(239, 68, 68, 0.25)', color: '#FCA5A5', fontSize: '12px', padding: '8px 12px', borderRadius: '8px', marginBottom: '1.25rem', alignItems: 'center', gap: '6px', lineHeight: 1.4 }}>
              <i className="ti ti-circle-x" style={{ fontSize: '14px' }}></i>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit}>
            <div className="input-group" style={{ position: 'relative', marginBottom: '1.25rem' }}>
              <label className="input-label" htmlFor="username" style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94A3B8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tài khoản / Email</label>
              <div className="input-wrapper" style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  id="username" 
                  placeholder="Email đăng ký hoặc username..." 
                  required 
                  autoFocus 
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '8px', border: '1px solid var(--border-strong)', background: 'var(--surface-2)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
                />
                <i className="ti ti-user" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '15px', color: '#475569' }}></i>
              </div>
            </div>

            <div className="input-group" style={{ position: 'relative', marginBottom: '1rem' }}>
              <label className="input-label" htmlFor="password" style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94A3B8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Mật khẩu</label>
              <div className="input-wrapper" style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  id="password" 
                  placeholder="Mật khẩu của bạn..." 
                  required 
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', padding: '10px 40px 10px 36px', borderRadius: '8px', border: '1px solid var(--border-strong)', background: 'var(--surface-2)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
                />
                <i className="ti ti-lock" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '15px', color: '#475569' }}></i>
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', outline: 'none', color: '#475569', display: 'flex', alignItems: 'center' }}
                >
                  <i className={showPassword ? "ti ti-eye-off" : "ti ti-eye"} style={{ fontSize: '15px' }}></i>
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.25rem' }}>
              <button 
                type="button" 
                onClick={() => { setShowForgotModal(true); setForgotEmail(''); setForgotMessage(''); setForgotError(''); }} 
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '12px', fontWeight: '500', cursor: 'pointer', outline: 'none' }}
              >
                Quên mật khẩu?
              </button>
            </div>

            <button type="submit" className="btn-submit" disabled={loading} style={{ width: '100%', padding: '10px', background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)', color: '#ffffff', fontWeight: 600, border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 8px 16px var(--primary-glow)', outline: 'none' }}>
              {loading ? (
                <>
                  <i className="ti ti-loader animate-spin"></i> Đang xác thực...
                </>
              ) : (
                <>
                  <i className="ti ti-login"></i> Đăng nhập hệ thống
                </>
              )}
            </button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '1.5rem', textAlign: 'center' }}>
            <button 
              onClick={handleContinueAsGuest}
              style={{
                width: '100%',
                padding: '10px',
                background: 'rgba(12,35,64,0.05)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-strong)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
            >
              Tiếp tục với tư cách Khách (Guest)
            </button>

            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
              Doanh nghiệp chưa đăng ký?{' '}
              <Link to="/register" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>Gửi hồ sơ ngay</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(8,14,30,0.85)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '2rem', borderColor: 'var(--border-strong)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <i className="ti ti-key" style={{ color: 'var(--primary)' }}></i> Quên mật khẩu
              </h3>
              <button onClick={() => { setShowForgotModal(false); setForgotEmail(''); setForgotMessage(''); setForgotError(''); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '18px', cursor: 'pointer' }}><i className="ti ti-x"></i></button>
            </div>
            
            {forgotError && (
              <div style={{ display: 'flex', background: 'rgba(239, 68, 68, 0.1)', border: '0.5px solid rgba(239, 68, 68, 0.25)', color: '#FCA5A5', fontSize: '12px', padding: '8px 12px', borderRadius: '8px', marginBottom: '1.25rem', alignItems: 'center', gap: '6px', lineHeight: 1.4 }}>
                <i className="ti ti-circle-x" style={{ fontSize: '14px' }}></i>
                <span>{forgotError}</span>
              </div>
            )}
            {forgotMessage && (
              <div style={{ display: 'flex', background: 'rgba(16, 185, 129, 0.1)', border: '0.5px solid rgba(16, 185, 129, 0.25)', color: '#A7F3D0', fontSize: '12px', padding: '8px 12px', borderRadius: '8px', marginBottom: '1.25rem', alignItems: 'center', gap: '6px', lineHeight: 1.4 }}>
                <i className="ti ti-circle-check" style={{ fontSize: '14px', color: 'var(--emerald)' }}></i>
                <span>{forgotMessage}</span>
              </div>
            )}

            {!forgotMessage && (
              <form onSubmit={handleForgotSubmit}>
                <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="input-label" style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94A3B8', marginBottom: '6px', textTransform: 'uppercase' }}>Nhập Email tài khoản</label>
                  <input 
                    type="email" 
                    required 
                    placeholder="example@domain.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-strong)', background: 'var(--surface-2)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
                  />
                </div>
                <button type="submit" disabled={forgotLoading} style={{ width: '100%', padding: '10px', background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)', color: '#ffffff', fontWeight: 600, border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', outline: 'none' }}>
                  {forgotLoading ? (
                    <>
                      <i className="ti ti-loader animate-spin"></i> Đang gửi...
                    </>
                  ) : (
                    <>
                      <i className="ti ti-send"></i> Gửi mật khẩu mới
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default Login;
