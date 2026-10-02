import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Html5Qrcode } from 'html5-qrcode';

export const AdminCheckin = () => {
  const { role, getAuthHeaders } = useAuth();
  const navigate = useNavigate();

  // State
  const [ticketInput, setTicketInput] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkinResult, setCheckinResult] = useState(null);

  // Camera QR Scanner State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const qrScannerRef = useRef(null);
  const isScanningRef = useRef(false);

  // Guest Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);

  // Audio Beep generator using Web Audio API
  const playBeep = (type = 'success') => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'success') {
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        osc.frequency.setValueAtTime(1174.66, audioCtx.currentTime + 0.1); // D6
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      } else if (type === 'warning') {
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.setValueAtTime(330, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      } else {
        osc.frequency.setValueAtTime(220, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      }
    } catch (e) {
      console.warn('AudioContext not supported or blocked:', e);
    }
  };

  // Helper to extract clean ticket code from text or URL
  const extractCode = (raw) => {
    if (!raw) return '';
    let code = raw.trim();
    if (code.includes('code=')) {
      try {
        const url = new URL(code);
        const c = url.searchParams.get('code');
        if (c) return c.trim();
      } catch (e) {
        const match = code.match(/code=([^&]+)/);
        if (match) return decodeURIComponent(match[1]).trim();
      }
    }
    return code;
  };

  // Xử lý gửi Check-in
  const executeCheckin = async (codeToUse, regId = null) => {
    const code = extractCode(codeToUse || ticketInput);
    if (!code && !regId) {
      alert('Vui lòng nhập mã vé cần check-in.');
      return;
    }

    setCheckingIn(true);
    setCheckinResult(null);

    try {
      const res = await fetch('/api/admin/events/checkin', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ticket_code: code || undefined,
          registration_id: regId || undefined
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.already_checked_in) {
          playBeep('warning');
          setCheckinResult({
            type: 'warning',
            message: data.message || 'Vé này đã được check-in trước đó!',
            reg: data.registration
          });
        } else {
          playBeep('success');
          setCheckinResult({
            type: 'success',
            message: data.message || 'Check-in thành công cho khách tham dự!',
            reg: data.registration
          });
        }

        // Cập nhật kết quả tìm kiếm nếu đang hiển thị
        if (searchResults && searchResults.length > 0) {
          setSearchResults(prev => prev.map(item => {
            if ((code && item.ticket_code === code) || (regId && item.id === regId)) {
              return { ...item, checkin_status: 'checked_in', checkin_time: new Date().toISOString() };
            }
            return item;
          }));
        }
      } else {
        playBeep('error');
        setCheckinResult({
          type: 'error',
          message: data.error || 'Không tìm thấy vé hợp lệ hoặc có lỗi xảy ra.'
        });
      }
    } catch (err) {
      playBeep('error');
      setCheckinResult({
        type: 'error',
        message: 'Lỗi kết nối máy chủ: ' + err.message
      });
    } finally {
      setCheckingIn(false);
      setTicketInput('');
    }
  };

  const handleManualCheckin = (e) => {
    e.preventDefault();
    executeCheckin(ticketInput);
  };

  // Khởi động Camera QR Scanner
  const startCamera = async () => {
    setCameraError('');
    setIsCameraActive(true);

    // Chờ DOM render div #qr-reader
    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode('qr-reader');
        qrScannerRef.current = scanner;
        isScanningRef.current = true;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          (decodedText) => {
            // Khi quét thành công mã QR
            if (decodedText) {
              const clean = extractCode(decodedText);
              executeCheckin(clean);
              // Tạm dừng 2 giây trước khi cho phép quét vé tiếp theo để tránh lặp
              if (qrScannerRef.current && isScanningRef.current) {
                qrScannerRef.current.pause();
                setTimeout(() => {
                  if (qrScannerRef.current && isScanningRef.current) {
                    try { qrScannerRef.current.resume(); } catch (e) {}
                  }
                }, 2200);
              }
            }
          },
          (errorMessage) => {
            // Lỗi khi quét từng khung hình, bỏ qua
          }
        );
      } catch (err) {
        console.error('Không thể bật camera:', err);
        setCameraError('Không thể mở camera. Vui lòng cấp quyền truy cập máy ảnh cho trình duyệt.');
        setIsCameraActive(false);
        isScanningRef.current = false;
      }
    }, 150);
  };

  const stopCamera = async () => {
    if (qrScannerRef.current && isScanningRef.current) {
      try {
        await qrScannerRef.current.stop();
        qrScannerRef.current.clear();
      } catch (e) {
        console.warn('Lỗi khi dừng camera:', e);
      }
    }
    isScanningRef.current = false;
    qrScannerRef.current = null;
    setIsCameraActive(false);
  };

  const toggleCameraScanner = () => {
    if (isCameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  // Dọn dẹp scanner khi unmount component
  useEffect(() => {
    return () => {
      if (qrScannerRef.current && isScanningRef.current) {
        try {
          qrScannerRef.current.stop().catch(() => {});
        } catch (e) {}
      }
    };
  }, []);

  // Xử lý Tìm kiếm Khách theo SĐT / Email / Tên
  const handleSearchGuests = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(`/api/admin/events/registrations/search?q=${encodeURIComponent(searchQuery.trim())}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSearchResults(data.data || []);
      } else {
        alert(data.error || 'Lỗi khi tìm kiếm khách tham dự.');
      }
    } catch (err) {
      alert('Lỗi kết nối: ' + err.message);
    } finally {
      setSearching(false);
    }
  };

  const backUrl = role === 'organizer' ? '/organizer-dashboard' : '/admin-events';

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F8FAFC',
      color: '#0F172A',
      padding: '2rem 1.25rem 4rem',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        
        {/* Nút Quay lại theo đúng Ảnh 3: "← Quay lại quản lý sự kiện" */}
        <div style={{ marginBottom: '1.5rem' }}>
          <Link
            to={backUrl}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#475569',
              textDecoration: 'none',
              fontSize: '13.5px',
              fontWeight: '600',
              transition: 'color 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#0D9488'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#475569'; }}
          >
            <i className="ti ti-arrow-left" style={{ fontSize: '15px' }}></i>
            Quay lại quản lý sự kiện
          </Link>
        </div>

        {/* ========================================================================= */}
        {/* KHỐI 1: CHECK-IN SỰ KIỆN (CHUẨN THEO ẢNH 3) */}
        {/* ========================================================================= */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '2rem 2.25rem',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
          marginBottom: '1.75rem'
        }}>
          {/* Header Card */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'rgba(13, 148, 136, 0.12)',
              color: '#0D9488',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <i className="ti ti-qrcode" style={{ fontSize: '20px' }}></i>
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
              Check-in sự kiện
            </h2>
          </div>

          <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 1.25rem 0' }}>
            Quét mã QR trên vé của khách bằng camera, hoặc nhập mã vé thủ công.
          </p>

          {/* Nút [ 📷 Quét bằng camera ] Chuẩn Ảnh 3 */}
          <button
            type="button"
            onClick={toggleCameraScanner}
            style={{
              width: '100%',
              padding: '12px 18px',
              backgroundColor: '#064E3B',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(6, 78, 59, 0.25)',
              transition: 'background-color 0.15s ease',
              marginBottom: '1.25rem'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#022C22'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#064E3B'; }}
          >
            <i className={isCameraActive ? "ti ti-camera-off" : "ti ti-camera"} style={{ fontSize: '18px' }}></i>
            {isCameraActive ? 'Đang mở Camera (Nhấn để tắt)' : 'Quét bằng camera'}
          </button>

          {/* Vùng Camera Scanner trực tiếp */}
          {isCameraActive && (
            <div style={{
              marginBottom: '1.25rem',
              backgroundColor: '#0F172A',
              borderRadius: '12px',
              overflow: 'hidden',
              padding: '12px',
              textAlign: 'center',
              border: '2px solid #0D9488'
            }}>
              <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22C55E', display: 'inline-block' }}></span>
                Hướng camera vào mã QR trên vé của khách
              </div>
              <div id="qr-reader" style={{ width: '100%', maxWidth: '400px', margin: '0 auto', borderRadius: '8px', overflow: 'hidden' }}></div>
            </div>
          )}

          {cameraError && (
            <div style={{
              backgroundColor: '#FEF2F2',
              color: '#B91C1C',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '12.5px',
              marginBottom: '1.25rem',
              border: '1px solid #FCA5A5'
            }}>
              {cameraError}
            </div>
          )}

          {/* Form Nhập mã vé thủ công */}
          <form onSubmit={handleManualCheckin} style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder="Nhập mã vé (VD: ADT...)"
              value={ticketInput}
              onChange={(e) => setTicketInput(e.target.value)}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '13.5px',
                outline: 'none',
                backgroundColor: '#FFFFFF'
              }}
            />
            <button
              type="submit"
              disabled={checkingIn}
              style={{
                padding: '10px 24px',
                backgroundColor: '#064E3B',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13.5px',
                fontWeight: '700',
                cursor: checkingIn ? 'wait' : 'pointer',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#022C22'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#064E3B'; }}
            >
              {checkingIn ? 'Kiểm tra...' : 'Check-in'}
            </button>
          </form>

          {/* Hộp Thông báo kết quả Check-in */}
          {checkinResult && (
            <div style={{
              marginTop: '1.25rem',
              padding: '14px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              border: '1px solid',
              borderColor: checkinResult.type === 'success' ? '#86EFAC' : checkinResult.type === 'warning' ? '#FDE047' : '#FCA5A5',
              backgroundColor: checkinResult.type === 'success' ? '#F0FDF4' : checkinResult.type === 'warning' ? '#FEFCE8' : '#FEF2F2'
            }}>
              <div style={{
                fontWeight: '700',
                color: checkinResult.type === 'success' ? '#15803D' : checkinResult.type === 'warning' ? '#A16207' : '#B91C1C',
                marginBottom: checkinResult.reg ? '8px' : 0,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <i className={checkinResult.type === 'success' ? "ti ti-circle-check" : checkinResult.type === 'warning' ? "ti ti-alert-triangle" : "ti ti-alert-circle"} style={{ fontSize: '18px' }}></i>
                <span>{checkinResult.message}</span>
              </div>

              {checkinResult.reg && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '6px', fontSize: '12.5px', color: '#334155', marginTop: '6px', paddingTop: '8px', borderTop: '1px dashed rgba(0,0,0,0.1)' }}>
                  <div><strong>Họ và tên:</strong> {checkinResult.reg.full_name}</div>
                  <div><strong>Số điện thoại:</strong> {checkinResult.reg.phone}</div>
                  <div><strong>Số lượng:</strong> {checkinResult.reg.quantity || 1} vé</div>
                  <div><strong>Sự kiện:</strong> {checkinResult.reg.event_title}</div>
                  <div><strong>Mã vé:</strong> <code style={{ backgroundColor: 'rgba(0,0,0,0.06)', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>{checkinResult.reg.ticket_code}</code></div>
                  {checkinResult.reg.company && <div><strong>Đơn vị:</strong> {checkinResult.reg.company}</div>}
                  {checkinResult.reg.checkin_time && (
                    <div style={{ gridColumn: 'span 2' }}>
                      <strong>Thời gian check-in:</strong> {new Date(checkinResult.reg.checkin_time).toLocaleString('vi-VN')}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* KHỐI 2: TÌM KHÁCH THEO SĐT / EMAIL / TÊN (CHUẨN THEO ẢNH 3) */}
        {/* ========================================================================= */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '2rem 2.25rem',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)'
        }}>
          {/* Header Card */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'rgba(13, 148, 136, 0.12)',
              color: '#0D9488',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <i className="ti ti-search" style={{ fontSize: '18px' }}></i>
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
              Tìm khách theo SĐT / email / tên
            </h2>
          </div>

          {/* Form Tìm kiếm */}
          <form onSubmit={handleSearchGuests} style={{ display: 'flex', gap: '10px', marginBottom: searchResults ? '1.25rem' : 0 }}>
            <input
              type="text"
              placeholder="Số điện thoại, email hoặc tên"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '13.5px',
                outline: 'none',
                backgroundColor: '#FFFFFF'
              }}
            />
            <button
              type="submit"
              disabled={searching}
              style={{
                padding: '10px 24px',
                backgroundColor: '#064E3B',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13.5px',
                fontWeight: '700',
                cursor: searching ? 'wait' : 'pointer',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#022C22'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#064E3B'; }}
            >
              {searching ? 'Đang tìm...' : 'Tìm'}
            </button>
          </form>

          {/* Kết quả Tìm kiếm */}
          {searchResults && (
            <div style={{ marginTop: '1.25rem', borderTop: '1px solid #F1F5F9', paddingTop: '1rem' }}>
              <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '10px' }}>
                Tìm thấy <strong>{searchResults.length}</strong> kết quả phù hợp:
              </div>

              {searchResults.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                  Không tìm thấy khách tham dự nào khớp với từ khóa "{searchQuery}".
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {searchResults.map((guest) => {
                    const isCheckedIn = guest.checkin_status === 'checked_in';

                    return (
                      <div
                        key={guest.id}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '10px',
                          border: '1px solid #E2E8F0',
                          backgroundColor: isCheckedIn ? '#F0FDF4' : '#F8FAFC',
                          display: 'flex',
                          flexWrap: 'wrap',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '10px'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '14px', color: '#0F172A' }}>
                            {guest.full_name}{' '}
                            <span style={{ fontSize: '12px', fontWeight: '600', color: '#0D9488' }}>
                              ({guest.quantity || 1} vé)
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            <span><i className="ti ti-phone"></i> {guest.phone}</span>
                            {guest.email && <span><i className="ti ti-mail"></i> {guest.email}</span>}
                            {guest.company && <span><i className="ti ti-building"></i> {guest.company}</span>}
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '3px' }}>
                            Sự kiện: <strong>{guest.event_title}</strong> • Mã vé: <code style={{ backgroundColor: '#E2E8F0', padding: '1px 5px', borderRadius: '4px' }}>{guest.ticket_code}</code>
                          </div>
                        </div>

                        {/* Thao tác Check-in */}
                        <div>
                          {isCheckedIn ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '6px 12px',
                              backgroundColor: '#DCFCE7',
                              color: '#15803D',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: '700'
                            }}>
                              <i className="ti ti-check"></i>
                              Đã check-in ({guest.checkin_time ? new Date(guest.checkin_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''})
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => executeCheckin(guest.ticket_code, guest.id)}
                              disabled={checkingIn}
                              style={{
                                padding: '7px 16px',
                                backgroundColor: '#0D9488',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '12.5px',
                                fontWeight: '700',
                                cursor: checkingIn ? 'wait' : 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <i className="ti ti-qrcode"></i>
                              Xác nhận Check-in
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminCheckin;
