import React from 'react';
import { usePWA } from '../contexts/PWAContext';
import brandConfig from '../brand.config';

export const PWAInstallPrompt = () => {
  const {
    isInstallable,
    isInstalled,
    isIOS,
    showIOSGuide,
    setShowIOSGuide,
    installApp,
    bannerDismissed,
    dismissBanner
  } = usePWA();

  // Không hiển thị nếu đã cài đặt
  if (isInstalled) return null;

  return (
    <>
      <style>{`
        .dnvn-pwa-banner {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 9998;
          max-width: 400px;
          width: calc(100vw - 32px);
          background: rgba(8, 16, 30, 0.94);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(45, 212, 191, 0.35);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(13, 148, 136, 0.25);
          border-radius: 16px;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          animation: dnvnSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          color: #F8FAFC;
          font-family: inherit;
        }

        @keyframes dnvnSlideUp {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @media (max-width: 640px) {
          .dnvn-pwa-banner {
            bottom: 12px;
            right: 16px;
            left: 16px;
            width: auto;
            max-width: 100%;
          }
        }

        .dnvn-pwa-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          overflow: hidden;
          background: #08101E;
          border: 1.5px solid rgba(45, 212, 191, 0.4);
          box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3);
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .dnvn-pwa-icon img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .dnvn-pwa-content {
          flex: 1;
          min-width: 0;
        }

        .dnvn-pwa-title {
          font-size: 13.5px;
          font-weight: 700;
          color: #FFFFFF;
          margin-bottom: 2px;
          line-height: 1.25;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .dnvn-pwa-desc {
          font-size: 11.5px;
          color: #94A3B8;
          line-height: 1.3;
        }

        .dnvn-pwa-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .dnvn-pwa-btn-install {
          background: linear-gradient(135deg, #0D9488 0%, #0F766E 100%);
          color: #FFFFFF;
          border: 1px solid rgba(45, 212, 191, 0.6);
          padding: 8px 14px;
          border-radius: 9px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(13, 148, 136, 0.4);
          white-space: nowrap;
        }

        .dnvn-pwa-btn-install:hover {
          background: linear-gradient(135deg, #14B8A6 0%, #0D9488 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(45, 212, 191, 0.45);
        }

        .dnvn-pwa-btn-close {
          background: transparent;
          border: none;
          color: #64748B;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          transition: all 0.15s ease;
        }

        .dnvn-pwa-btn-close:hover {
          color: #E2E8F0;
          background: rgba(255, 255, 255, 0.1);
        }

        /* iOS Guide Modal */
        .dnvn-ios-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 99999;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          animation: dnvnFadeIn 0.2s ease;
        }

        @keyframes dnvnFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .dnvn-ios-modal-card {
          background: #08101E;
          border: 1px solid rgba(45, 212, 191, 0.35);
          border-radius: 20px;
          padding: 24px;
          max-width: 440px;
          width: 100%;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7);
          color: #F8FAFC;
          text-align: center;
        }

        .dnvn-ios-step {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 12px 14px;
          margin-bottom: 10px;
          text-align: left;
        }

        .dnvn-ios-step-num {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #0D9488;
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 13px;
          flex-shrink: 0;
        }

        .dnvn-ios-step-text {
          font-size: 12.5px;
          color: #E2E8F0;
          line-height: 1.4;
        }
      `}</style>

      {/* 1. Floating Smart Banner */}
      {isInstallable && !bannerDismissed && (
        <aside className="dnvn-pwa-banner" aria-label="Cài đặt ứng dụng">
          <div className="dnvn-pwa-icon">
            <img src="/logo_icon.png" alt="DoanhNghiepVN Logo" />
          </div>
          <div className="dnvn-pwa-content">
            <div className="dnvn-pwa-title">Cài đặt {brandConfig.brandShortName || 'DoanhNghiepVN'}</div>
            <div className="dnvn-pwa-desc">Thêm vào màn hình chính, tải siêu nhanh & chạy toàn màn hình</div>
          </div>
          <div className="dnvn-pwa-actions">
            <button 
              onClick={installApp} 
              className="dnvn-pwa-btn-install"
              aria-label="Cài đặt ứng dụng ngay"
            >
              <i className="ti ti-device-mobile-down"></i>
              <span>Cài đặt</span>
            </button>
            <button 
              onClick={dismissBanner} 
              className="dnvn-pwa-btn-close"
              title="Đóng thông báo"
              aria-label="Đóng thông báo"
            >
              <i className="ti ti-x"></i>
            </button>
          </div>
        </aside>
      )}

      {/* 2. iOS Safari Step-by-Step Guide Modal */}
      {showIOSGuide && (
        <div className="dnvn-ios-modal-backdrop" onClick={() => setShowIOSGuide(false)}>
          <div className="dnvn-ios-modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              overflow: 'hidden',
              margin: '0 auto 16px',
              border: '1.5px solid rgba(45, 212, 191, 0.4)',
              boxShadow: '0 4px 16px rgba(13, 148, 136, 0.4)'
            }}>
              <img src="/logo_icon.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '8px' }}>
              Cài đặt ứng dụng trên iPhone / iPad
            </h3>
            <p style={{ fontSize: '12.5px', color: '#94A3B8', marginBottom: '20px', lineHeight: 1.5 }}>
              Để trải nghiệm ứng dụng {brandConfig.brandName} toàn màn hình từ màn hình chính iOS, vui lòng làm theo 3 bước:
            </p>

            <div className="dnvn-ios-step">
              <div className="dnvn-ios-step-num">1</div>
              <div className="dnvn-ios-step-text">
                Nhấn vào nút <strong>Chia sẻ (Share)</strong> <i className="ti ti-share" style={{ color: '#38BDF8', fontSize: '15px' }}></i> ở thanh công cụ phía dưới trình duyệt Safari.
              </div>
            </div>

            <div className="dnvn-ios-step">
              <div className="dnvn-ios-step-num">2</div>
              <div className="dnvn-ios-step-text">
                Cuộn xuống trong danh sách và chọn mục <strong>"Thêm vào Màn hình chính"</strong> <i className="ti ti-square-plus" style={{ color: '#F59E0B', fontSize: '15px' }}></i> (Add to Home Screen).
              </div>
            </div>

            <div className="dnvn-ios-step">
              <div className="dnvn-ios-step-num">3</div>
              <div className="dnvn-ios-step-text">
                Nhấn <strong>"Thêm" (Add)</strong> ở góc trên bên phải màn hình để hoàn tất.
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              style={{
                marginTop: '16px',
                width: '100%',
                padding: '11px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '13.5px',
                border: '1px solid rgba(45, 212, 191, 0.5)',
                cursor: 'pointer'
              }}
            >
              Tôi đã hiểu
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PWAInstallPrompt;
