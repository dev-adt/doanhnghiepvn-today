import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F8FAFC',
          padding: '2rem',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}>
          <div style={{
            maxWidth: '520px',
            width: '100%',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '2.5rem 2rem',
            textAlign: 'center',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            border: '1px solid #E2E8F0'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#FEE2E2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              margin: '0 auto 1.25rem'
            }}>
              <i className="ti ti-alert-triangle"></i>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A', marginBottom: '8px' }}>
              Đã xảy ra sự cố hiển thị
            </h2>
            <p style={{ fontSize: '13.5px', color: '#64748B', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              Trang web gặp sự cố nhỏ khi tải giao diện. Bạn có thể nhấn nút dưới đây để tải lại trang hoặc quay lại trang chủ.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#1E63E9',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Tải lại trang
              </button>
              <a
                href="/"
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#F1F5F9',
                  color: '#334155',
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '700',
                  textDecoration: 'none',
                  display: 'inline-block'
                }}
              >
                Về Trang chủ
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
