import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import brandConfig from '../brand.config';

export const Events = () => {
  const { id: routeParamId } = useParams();
  const navigate = useNavigate();

  // Danh sách sự kiện (khi ở trang tổng quan)
  const [eventsList, setEventsList] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Sự kiện chi tiết hiện tại (khi có routeParamId hoặc chọn từ danh sách)
  const [currentEvent, setCurrentEvent] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState('');

  // Đếm ngược thời gian (Countdown Timer)
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isPassed: false });

  // Form đăng ký tham gia (Image 1)
  const [regForm, setRegForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    company: '',
    quantity: 1,
    createAccount: false
  });
  const [submittingReg, setSubmittingReg] = useState(false);
  const [regSuccessData, setRegSuccessData] = useState(null);
  const [copiedNote, setCopiedNote] = useState(false);
  const [copiedBank, setCopiedBank] = useState(false);

  // 1. Tải danh sách sự kiện nếu không có id hoặc khi tải trang
  useEffect(() => {
    let isMounted = true;
    const fetchEvents = async () => {
      try {
        const res = await fetch('/api/events');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && isMounted) {
            setEventsList(json.data);
          }
        }
      } catch (e) {
        console.warn('Lỗi tải danh sách sự kiện:', e);
      } finally {
        if (isMounted) setLoadingList(false);
      }
    };
    fetchEvents();
    return () => { isMounted = false; };
  }, []);

  // 2. Tải chi tiết sự kiện
  useEffect(() => {
    let isMounted = true;
    const targetIdOrSlug = routeParamId || (eventsList.length > 0 && !routeParamId && location.pathname.includes('/su-kien/') ? 'su-kien-demo' : null);

    if (targetIdOrSlug) {
      setLoadingDetail(true);
      setDetailError('');
      fetch(`/api/events/${encodeURIComponent(targetIdOrSlug)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data && isMounted) {
            setCurrentEvent(data.data);
          } else if (isMounted) {
            setDetailError(data.error || 'Không tìm thấy thông tin sự kiện.');
          }
        })
        .catch(err => {
          if (isMounted) setDetailError(err.message);
        })
        .finally(() => {
          if (isMounted) setLoadingDetail(false);
        });
    } else {
      setCurrentEvent(null);
    }
    return () => { isMounted = false; };
  }, [routeParamId, eventsList]);

  // 3. Hiệu ứng Countdown Timer thời gian thực (Image 1: [28 NGÀY] [05 GIỜ] [57 PHÚT] [51 GIÂY])
  useEffect(() => {
    if (!currentEvent || !currentEvent.event_date) return;

    const calculateTime = () => {
      const targetTime = new Date(currentEvent.event_date).getTime();
      const now = new Date().getTime();
      const diff = targetTime - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPassed: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isPassed: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [currentEvent]);

  // Xử lý gửi đăng ký vé
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!currentEvent) return;

    if (!regForm.fullName.trim() || !regForm.phone.trim()) {
      alert('Vui lòng điền Họ và tên và Số điện thoại liên hệ.');
      return;
    }

    setSubmittingReg(true);
    try {
      const res = await fetch(`/api/events/${currentEvent.id}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          full_name: regForm.fullName.trim(),
          phone: regForm.phone.trim(),
          email: regForm.email.trim() || null,
          company: regForm.company.trim() || null,
          quantity: parseInt(regForm.quantity, 10) || 1,
          create_account: regForm.createAccount
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setRegSuccessData(data.registration);
        // Cập nhật lại số lượng vé còn lại trên giao diện
        setCurrentEvent(prev => ({
          ...prev,
          registered_count: (Number(prev.registered_count) || 0) + (parseInt(regForm.quantity, 10) || 1),
          remaining_tickets: prev.capacity > 0 ? Math.max(0, (Number(prev.remaining_tickets) || prev.capacity) - (parseInt(regForm.quantity, 10) || 1)) : 999999
        }));
      } else {
        alert(data.error || 'Đăng ký vé không thành công.');
      }
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setSubmittingReg(false);
    }
  };

  // Format ngày tiếng Việt giống Image 1: "15:24 Thứ Sáu, 30/10/2026 - 16:10 Thứ Sáu, 30/10/2026"
  const formatDateTimeRange = (startDateStr, endDateStr) => {
    if (!startDateStr) return '';
    const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const pad = (n) => String(n).padStart(2, '0');

    const formatSingle = (dStr) => {
      const d = new Date(dStr);
      return `${pad(d.getHours())}:${pad(d.getMinutes())} ${dayNames[d.getDay()]}, ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    };

    const s = formatSingle(startDateStr);
    if (!endDateStr) return s;
    const e = formatSingle(endDateStr);
    return `${s} — ${e}`;
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'bank') {
      setCopiedBank(true);
      setTimeout(() => setCopiedBank(false), 2000);
    } else {
      setCopiedNote(true);
      setTimeout(() => setCopiedNote(false), 2000);
    }
  };

  // =========================================================================
  // VIEW CHI TIẾT SỰ KIỆN (CHUẨN 100% THEO ẢNH 1 NGƯỜI DÙNG CUNG CẤP)
  // =========================================================================
  if (routeParamId || currentEvent) {
    if (loadingDetail) {
      return (
        <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
          <Navbar />
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem' }}>
            <div style={{ textAlign: 'center', color: '#0D9488' }}>
              <i className="ti ti-loader animate-spin" style={{ fontSize: '36px', display: 'block', margin: '0 auto 12px' }}></i>
              <span style={{ fontSize: '15px', fontWeight: '600', color: '#334155' }}>Đang tải thông tin sự kiện...</span>
            </div>
          </div>
          <Footer />
        </div>
      );
    }

    if (detailError || !currentEvent) {
      return (
        <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
          <Navbar />
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem' }}>
            <div style={{ textAlign: 'center', maxWidth: '500px' }}>
              <i className="ti ti-alert-circle" style={{ fontSize: '48px', color: '#EF4444', marginBottom: '12px', display: 'block' }}></i>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0F172A', marginBottom: '8px' }}>Không tìm thấy sự kiện</h2>
              <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '1.5rem' }}>{detailError || 'Sự kiện này không tồn tại hoặc đã bị gỡ bỏ.'}</p>
              <Link to="/events" style={{ display: 'inline-block', padding: '10px 20px', backgroundColor: '#0D9488', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', fontSize: '13px' }}>
                Quay lại danh sách sự kiện
              </Link>
            </div>
          </div>
          <Footer />
        </div>
      );
    }

    const isPaid = Number(currentEvent.is_paid) === 1 && Number(currentEvent.price) > 0;
    const capacity = Number(currentEvent.capacity) || 0;
    const registered = Number(currentEvent.registered_count) || 0;
    const remaining = capacity > 0 ? Math.max(0, capacity - registered) : 'Không giới hạn';

    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', color: '#0F172A', display: 'flex', flexDirection: 'column' }}>
        <SEOHead
          title={`${currentEvent.title} — ${brandConfig.brandName}`}
          description={currentEvent.short_desc || currentEvent.description}
          image={currentEvent.image_url}
        />
        <Navbar />

        {/* MAIN CONTAINER */}
        <main style={{ maxWidth: '1180px', margin: '0 auto', width: '100%', padding: '1.5rem 1rem 4rem' }}>
          
          {/* 1. TOP BANNER / COVER IMAGE (CHUẨN ẢNH 1: HÌNH ẢNH HỒ GƯƠM / COVER SỰ KIỆN) */}
          <div style={{
            width: '100%',
            height: 'clamp(240px, 36vw, 420px)',
            borderRadius: '16px',
            overflow: 'hidden',
            backgroundColor: '#E2E8F0',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
            marginBottom: '2rem'
          }}>
            <img
              src={currentEvent.image_url || 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80'}
              alt={currentEvent.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>

          {/* 2. TWO-COLUMN GRID: LEFT INFO + RIGHT REGISTRATION CARD (CHUẨN ẢNH 1) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2.5rem',
            alignItems: 'start'
          }}>
            
            {/* CỘT TRÁI: THÔNG TIN SỰ KIỆN & NỘI DUNG */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Badge: Miễn phí / Phí */}
              <div>
                <span style={{
                  display: 'inline-block',
                  padding: '4px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '700',
                  backgroundColor: isPaid ? 'rgba(245, 158, 11, 0.15)' : '#D1FAE5',
                  color: isPaid ? '#D97706' : '#065F46'
                }}>
                  {isPaid ? `${Number(currentEvent.price).toLocaleString('vi-VN')} đ / vé` : 'Miễn phí'}
                </span>
              </div>

              {/* Title Sự kiện */}
              <h1 style={{
                fontSize: 'clamp(24px, 3vw, 32px)',
                fontWeight: '900',
                color: '#0D382A',
                lineHeight: 1.25,
                margin: 0
              }}>
                {currentEvent.title}
              </h1>

              {/* Meta Rows (Thời gian, Địa điểm, Số vé) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px', color: '#475569' }}>
                {/* Thời gian */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="ti ti-calendar" style={{ color: '#D97706', fontSize: '17px' }}></i>
                  <span>{formatDateTimeRange(currentEvent.event_date, currentEvent.end_date)}</span>
                </div>

                {/* Địa điểm */}
                {currentEvent.location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="ti ti-map-pin" style={{ color: '#D97706', fontSize: '17px' }}></i>
                    <span>{currentEvent.location}</span>
                  </div>
                )}

                {/* Số vé còn lại */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="ti ti-ticket" style={{ color: '#D97706', fontSize: '17px' }}></i>
                  <span style={{ fontWeight: '600', color: '#0F172A' }}>
                    Còn {remaining} {capacity > 0 ? `/ ${capacity} vé` : ''}
                  </span>
                </div>
              </div>

              {/* Mô tả ngắn */}
              {currentEvent.short_desc && (
                <div style={{
                  fontSize: '14.5px',
                  color: '#334155',
                  lineHeight: '1.6',
                  padding: '10px 0',
                  fontWeight: '500'
                }}>
                  {currentEvent.short_desc}
                </div>
              )}

              {/* Nội dung chi tiết (Rich Text Content) */}
              {currentEvent.content ? (
                <div 
                  className="event-rich-content"
                  dangerouslySetInnerHTML={{ __html: currentEvent.content }}
                  style={{
                    fontSize: '14.5px',
                    lineHeight: '1.75',
                    color: '#1E293B',
                    borderTop: '1px solid #E2E8F0',
                    paddingTop: '1.5rem'
                  }}
                />
              ) : currentEvent.description ? (
                <div style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155', borderTop: '1px solid #E2E8F0', paddingTop: '1.5rem' }}>
                  {currentEvent.description}
                </div>
              ) : null}

              {/* Ảnh minh họa trong nội dung (như trong ảnh mẫu người dùng gửi) */}
              <div style={{
                borderRadius: '12px',
                overflow: 'hidden',
                backgroundColor: '#E2E8F0',
                marginTop: '1rem',
                boxShadow: '0 4px 16px rgba(0,0,0,0.05)'
              }}>
                <img
                  src={currentEvent.image_url || 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80'}
                  alt="Ảnh chi tiết sự kiện"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              </div>

            </div>

            {/* CỘT PHẢI: STICKY CARD ĐẾM NGƯỢC & FORM ĐĂNG KÝ (CHUẨN ẢNH 1) */}
            <div style={{ position: 'sticky', top: '90px' }}>
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem'
              }}>
                
                {/* 1. Đếm ngược: Sự kiện bắt đầu sau */}
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12.5px',
                    fontWeight: '600',
                    color: '#64748B',
                    marginBottom: '10px'
                  }}>
                    <i className="ti ti-clock" style={{ color: '#D97706', fontSize: '15px' }}></i>
                    <span>Sự kiện bắt đầu sau</span>
                  </div>

                  {timeLeft.isPassed ? (
                    <div style={{ padding: '8px', textAlign: 'center', backgroundColor: '#F1F5F9', borderRadius: '8px', fontSize: '13px', fontWeight: '700', color: '#64748B' }}>
                      Sự kiện đã diễn ra
                    </div>
                  ) : (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '8px',
                      textAlign: 'center'
                    }}>
                      {[
                        { val: timeLeft.days, label: 'NGÀY' },
                        { val: timeLeft.hours, label: 'GIỜ' },
                        { val: timeLeft.minutes, label: 'PHÚT' },
                        { val: timeLeft.seconds, label: 'GIÂY' }
                      ].map((box, i) => (
                        <div
                          key={i}
                          style={{
                            backgroundColor: '#064E3B', // Màu xanh đậm chuẩn ảnh 1
                            color: '#ffffff',
                            borderRadius: '8px',
                            padding: '8px 4px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            boxShadow: '0 2px 6px rgba(6, 78, 59, 0.3)'
                          }}
                        >
                          <span style={{ fontSize: '20px', fontWeight: '900', fontFamily: 'monospace', lineHeight: 1.1 }}>
                            {String(box.val).padStart(2, '0')}
                          </span>
                          <span style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.4px', marginTop: '3px', opacity: 0.9 }}>
                            {box.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ height: '1px', backgroundColor: '#F1F5F9' }}></div>

                {/* 2. Form: Đăng ký tham gia (Đúng từng trường trong ảnh 1) */}
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: '0 0 1rem 0' }}>
                    Đăng ký tham gia
                  </h3>

                  <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    
                    {/* Họ và tên * */}
                    <div>
                      <input
                        type="text"
                        required
                        placeholder="Họ và tên *"
                        value={regForm.fullName}
                        onChange={(e) => setRegForm(prev => ({ ...prev, fullName: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #CBD5E1',
                          fontSize: '13px',
                          outline: 'none',
                          backgroundColor: '#F8FAFC'
                        }}
                      />
                    </div>

                    {/* Số điện thoại * */}
                    <div>
                      <input
                        type="tel"
                        required
                        placeholder="Số điện thoại *"
                        value={regForm.phone}
                        onChange={(e) => setRegForm(prev => ({ ...prev, phone: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #CBD5E1',
                          fontSize: '13px',
                          outline: 'none',
                          backgroundColor: '#F8FAFC'
                        }}
                      />
                    </div>

                    {/* Email (không bắt buộc) */}
                    <div>
                      <input
                        type="email"
                        placeholder="Email (không bắt buộc)"
                        value={regForm.email}
                        onChange={(e) => setRegForm(prev => ({ ...prev, email: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #CBD5E1',
                          fontSize: '13px',
                          outline: 'none',
                          backgroundColor: '#F8FAFC'
                        }}
                      />
                    </div>

                    {/* Đơn vị / Công ty (không bắt buộc) */}
                    <div>
                      <input
                        type="text"
                        placeholder="Đơn vị / Công ty (không bắt buộc)"
                        value={regForm.company}
                        onChange={(e) => setRegForm(prev => ({ ...prev, company: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #CBD5E1',
                          fontSize: '13px',
                          outline: 'none',
                          backgroundColor: '#F8FAFC'
                        }}
                      />
                    </div>

                    {/* Số lượng vé */}
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748B', marginBottom: '3px' }}>
                        Số lượng vé
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={regForm.quantity}
                        onChange={(e) => setRegForm(prev => ({ ...prev, quantity: Math.max(1, parseInt(e.target.value, 10) || 1) }))}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid #CBD5E1',
                          fontSize: '13px',
                          outline: 'none',
                          backgroundColor: '#F8FAFC'
                        }}
                      />
                    </div>

                    {/* Checkbox: Tạo tài khoản để theo dõi vé */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                      <input
                        type="checkbox"
                        id="chkCreateAcc"
                        checked={regForm.createAccount}
                        onChange={(e) => setRegForm(prev => ({ ...prev, createAccount: e.target.checked }))}
                        style={{ cursor: 'pointer', width: '15px', height: '15px' }}
                      />
                      <label htmlFor="chkCreateAcc" style={{ fontSize: '12px', color: '#475569', cursor: 'pointer' }}>
                        Tạo tài khoản để theo dõi vé
                      </label>
                    </div>

                    {/* Nút Đăng ký ngay */}
                    <button
                      type="submit"
                      disabled={submittingReg || (capacity > 0 && remaining === 0)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: '#064E3B', // Màu xanh đậm chuẩn ảnh 1
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '700',
                        cursor: submittingReg || (capacity > 0 && remaining === 0) ? 'not-allowed' : 'pointer',
                        marginTop: '8px',
                        boxShadow: '0 4px 12px rgba(6, 78, 59, 0.35)',
                        transition: 'transform 0.15s ease, background-color 0.15s'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#04382A'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#064E3B'; }}
                    >
                      {submittingReg ? 'Đang xử lý...' : (capacity > 0 && remaining === 0) ? 'Đã hết vé' : 'Đăng ký ngay'}
                    </button>

                    {/* Subtext chú thích (Ảnh 1) */}
                    <div style={{ fontSize: '11px', color: '#64748B', textAlign: 'center', marginTop: '6px', lineHeight: 1.4 }}>
                      Bạn sẽ nhận được mã QR ngay sau khi hoàn tất đăng ký.
                      <div style={{ marginTop: '2px' }}>
                        Đã có tài khoản?{' '}
                        <Link to="/login" style={{ color: '#D97706', textDecoration: 'none', fontWeight: '600' }}>
                          Tra cứu tại đây
                        </Link>
                      </div>
                    </div>

                  </form>
                </div>

              </div>
            </div>

          </div>
        </main>

        {/* ========================================================================= */}
        {/* MODAL POPUP XÁC NHẬN VÉ & MÃ QR + VIETQR CHUYỂN KHOẢN SAU KHI ĐĂNG KÝ    */}
        {/* ========================================================================= */}
        {regSuccessData && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(5px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem'
          }}>
            <div style={{
              width: '100%',
              maxWidth: '540px',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Header Thành công */}
              <div style={{
                backgroundColor: '#064E3B',
                color: '#ffffff',
                padding: '1.25rem',
                textAlign: 'center'
              }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 8px',
                  fontSize: '24px'
                }}>
                  <i className="ti ti-check"></i>
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: '800', margin: '0 0 4px 0' }}>
                  Đăng ký tham gia thành công!
                </h3>
                <p style={{ fontSize: '12px', opacity: 0.9, margin: 0 }}>
                  {regSuccessData.event_title}
                </p>
              </div>

              {/* Body Vé & Mã QR */}
              <div style={{ padding: '1.5rem', maxHeight: '75vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                {/* Thẻ Vé Điện Tử */}
                <div style={{
                  border: '2px dashed #0D9488',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  backgroundColor: '#F0FDFA',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#0F766E', fontWeight: '700', letterSpacing: '0.6px' }}>
                    MÃ VÉ THAM DỰ CHÍNH THỨC
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: '900', color: '#0F172A', letterSpacing: '1px', margin: '4px 0 10px' }}>
                    {regSuccessData.ticket_code}
                  </div>

                  {/* QR Image */}
                  <div style={{
                    width: '180px',
                    height: '180px',
                    margin: '0 auto',
                    backgroundColor: '#ffffff',
                    padding: '8px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                  }}>
                    <img
                      src={regSuccessData.qr_image}
                      alt="Mã QR Check-in"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B', marginTop: '8px' }}>
                    Vui lòng xuất trình mã QR này tại quầy lễ tân để check-in vào sự kiện.
                  </div>
                </div>

                {/* Thông tin người đăng ký */}
                <div style={{ fontSize: '12.5px', color: '#334155', backgroundColor: '#F8FAFC', padding: '10px 14px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div><strong>Người tham dự:</strong> {regSuccessData.full_name}</div>
                  <div><strong>Số điện thoại:</strong> {regSuccessData.phone}</div>
                  <div><strong>Số lượng:</strong> {regSuccessData.quantity} vé</div>
                  {regSuccessData.company && <div><strong>Đơn vị:</strong> {regSuccessData.company}</div>}
                </div>

                {/* Khối thanh toán Chuyển khoản VietQR nếu có phí */}
                {regSuccessData.total_amount > 0 && (
                  <div style={{
                    border: '1px solid #FCD34D',
                    backgroundColor: '#FFFBEB',
                    borderRadius: '12px',
                    padding: '1.25rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#B45309', fontWeight: '800', fontSize: '13.5px', marginBottom: '8px' }}>
                      <i className="ti ti-credit-card"></i>
                      <span>Thông tin thanh toán chuyển khoản</span>
                    </div>

                    <div style={{ fontSize: '12px', color: '#78350F', marginBottom: '10px' }}>
                      Tổng số tiền cần thanh toán:{' '}
                      <strong style={{ fontSize: '15px', color: '#B45309' }}>
                        {Number(regSuccessData.total_amount).toLocaleString('vi-VN')} VNĐ
                      </strong>
                    </div>

                    {/* VietQR Code Image */}
                    {regSuccessData.vietqr_url && (
                      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                        <img
                          src={regSuccessData.vietqr_url}
                          alt="VietQR Chuyển khoản"
                          style={{ maxWidth: '240px', width: '100%', borderRadius: '8px', border: '1px solid #FDE68A' }}
                        />
                      </div>
                    )}

                    {/* Chi tiết tài khoản */}
                    <div style={{ fontSize: '12px', color: '#451A03', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <div><strong>Ngân hàng:</strong> {regSuccessData.bank_info?.bank_name} ({regSuccessData.bank_info?.bank_branch})</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span><strong>Số tài khoản:</strong> <code style={{ fontSize: '13px', fontWeight: '700' }}>{regSuccessData.bank_info?.account_number}</code></span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(regSuccessData.bank_info?.account_number, 'bank')}
                          style={{ padding: '2px 8px', fontSize: '11px', backgroundColor: '#FDE68A', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          {copiedBank ? 'Đã chép!' : 'Sao chép'}
                        </button>
                      </div>
                      <div><strong>Chủ tài khoản:</strong> {regSuccessData.bank_info?.account_holder}</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FEF3C7', padding: '6px', borderRadius: '6px', marginTop: '4px' }}>
                        <span><strong>Nội dung CK:</strong> <code style={{ fontSize: '12px', fontWeight: '800', color: '#B45309' }}>{regSuccessData.payment_note}</code></span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(regSuccessData.payment_note, 'note')}
                          style={{ padding: '2px 8px', fontSize: '11px', backgroundColor: '#F59E0B', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
                        >
                          {copiedNote ? 'Đã chép!' : 'Sao chép'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Footer Modal */}
              <div style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                backgroundColor: '#F8FAFC'
              }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#ffffff',
                    color: '#334155',
                    fontSize: '12.5px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <i className="ti ti-printer"></i> In vé
                </button>

                <button
                  type="button"
                  onClick={() => setRegSuccessData(null)}
                  style={{
                    padding: '8px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#064E3B',
                    color: '#ffffff',
                    fontSize: '12.5px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Hoàn tất
                </button>
              </div>

            </div>
          </div>
        )}

        <Footer />
      </div>
    );
  }

  // =========================================================================
  // VIEW DANH SÁCH TẤT CẢ SỰ KIỆN (KHI TRUY CẬP /events HOẶC /su-kien)
  // =========================================================================
  const filteredList = eventsList.filter(e => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (e.title && e.title.toLowerCase().includes(q)) ||
      (e.location && e.location.toLowerCase().includes(q)) ||
      (e.short_desc && e.short_desc.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', color: '#0F172A', display: 'flex', flexDirection: 'column' }}>
      <SEOHead
        title={`Lịch Sự kiện & Diễn đàn Doanh nghiệp — ${brandConfig.brandName}`}
        description="Tổng hợp các sự kiện xúc tiến thương mại, hội thảo kết nối đầu tư, diễn đàn chuyển đổi số và giao thương B2B của Tạp chí Doanh Nghiệp Việt Nam."
      />
      <Navbar />

      <main style={{ maxWidth: '1240px', margin: '0 auto', width: '100%', padding: '2rem 1.25rem 4rem', flex: 1 }}>
        
        {/* Header Title & Search */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem',
          borderBottom: '1px solid #E2E8F0',
          paddingBottom: '1.25rem'
        }}>
          <div>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#0D9488', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              HỆ SINH THÁI DOANHNGHIEPVN.TODAY
            </span>
            <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#0F172A', margin: '4px 0 0' }}>
              Sự kiện & Diễn đàn Giao thương
            </h1>
          </div>

          <div style={{ position: 'relative', width: '300px' }}>
            <i className="ti ti-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}></i>
            <input
              type="text"
              placeholder="Tìm kiếm sự kiện, địa điểm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '10px',
                border: '1px solid #CBD5E1',
                fontSize: '13px',
                outline: 'none',
                backgroundColor: '#ffffff'
              }}
            />
          </div>
        </div>

        {/* Grid Sự Kiện */}
        {loadingList ? (
          <div style={{ padding: '5rem', textAlign: 'center', color: '#0D9488' }}>
            <i className="ti ti-loader animate-spin" style={{ fontSize: '32px', display: 'block', margin: '0 auto 10px' }}></i>
            Đang tải danh sách sự kiện...
          </div>
        ) : filteredList.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px dashed #CBD5E1', color: '#64748B' }}>
            Chưa tìm thấy sự kiện nào phù hợp.
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '1.75rem'
          }}>
            {filteredList.map((evt) => {
              const isPaid = Number(evt.is_paid) === 1 && Number(evt.price) > 0;
              const capacity = Number(evt.capacity) || 0;
              const registered = Number(evt.registered_count) || 0;
              const remaining = capacity > 0 ? Math.max(0, capacity - registered) : 'Không giới hạn';

              return (
                <div
                  key={evt.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '14px',
                    border: '1px solid #E2E8F0',
                    overflow: 'hidden',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.04)';
                  }}
                >
                  {/* Thumbnail */}
                  <div style={{ height: '190px', width: '100%', position: 'relative', overflow: 'hidden', backgroundColor: '#F1F5F9' }}>
                    <img
                      src={evt.image_url || 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80'}
                      alt={evt.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {/* Badge Giá */}
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      backgroundColor: isPaid ? '#F59E0B' : '#0D9488',
                      color: '#ffffff',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '700',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                    }}>
                      {isPaid ? `${Number(evt.price).toLocaleString('vi-VN')} đ` : 'Miễn phí'}
                    </div>
                  </div>

                  {/* Body Info */}
                  <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#D97706', fontWeight: '600', marginBottom: '6px' }}>
                        <i className="ti ti-calendar"></i>
                        <span>{new Date(evt.event_date).toLocaleDateString('vi-VN')}</span>
                        {evt.location && <span>• {evt.location}</span>}
                      </div>

                      <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', lineHeight: 1.35, margin: '0 0 8px 0' }}>
                        {evt.title}
                      </h3>

                      <p style={{
                        fontSize: '12.5px',
                        color: '#64748B',
                        lineHeight: 1.5,
                        margin: 0,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {evt.short_desc || evt.description}
                      </p>
                    </div>

                    <div style={{ marginTop: '1.25rem', paddingTop: '10px', borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '11.5px', color: '#0D9488', fontWeight: '600' }}>
                        Còn: <strong>{remaining}</strong> {capacity > 0 ? 'vé' : ''}
                      </span>

                      <Link
                        to={`/events/${evt.slug || evt.id}`}
                        style={{
                          padding: '6px 14px',
                          backgroundColor: '#064E3B',
                          color: '#ffffff',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          fontSize: '12px',
                          fontWeight: '700',
                          transition: 'background-color 0.15s'
                        }}
                      >
                        Đăng ký ngay
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
};

export default Events;
