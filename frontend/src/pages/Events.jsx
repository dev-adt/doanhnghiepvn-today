import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import brandConfig from '../brand.config';
import { fetchJsonWithTimeout, FALLBACK_EVENTS } from '../utils/api';

export const Events = () => {
  const { id: routeParamId } = useParams();
  const navigate = useNavigate();
  const { user, token, role } = useAuth();
  let storedMemberUser = null;
  try {
    const raw = localStorage.getItem('doson_member_user');
    if (raw) storedMemberUser = JSON.parse(raw);
  } catch (e) {}
  const memberToken = localStorage.getItem('doson_member_token') || (role === 'member' ? token : null);
  const effectiveUser = (role === 'member' ? user : null) || storedMemberUser || user;
  const isActuallyLoggedIn = Boolean(effectiveUser && (role === 'member' || !!memberToken || (user && role !== 'guest')));
  const isLoggedIn = isActuallyLoggedIn;

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
    createAccount: false,
    accountLogin: '',
    accountPassword: '',
    accountConfirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [accountNotice, setAccountNotice] = useState('');
  const [submittingReg, setSubmittingReg] = useState(false);
  const [regSuccessData, setRegSuccessData] = useState(null);
  const [paidFlowStep, setPaidFlowStep] = useState('transfer'); // 'transfer' | 'pending_approval'
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState('');
  const [uploadingProof, setUploadingProof] = useState(false);
  const [copiedNote, setCopiedNote] = useState(false);
  const [copiedBank, setCopiedBank] = useState(false);

  const handleProofChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      alert('Dung lượng ảnh vượt quá 20MB. Vui lòng chọn ảnh nhỏ hơn.');
      return;
    }
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
  };

  const handleSubmitPaymentProof = async () => {
    if (!proofFile || !regSuccessData?.id) {
      alert('Vui lòng tải lên ảnh chụp màn hình giao dịch chuyển khoản thành công.');
      return;
    }
    setUploadingProof(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Data = reader.result.split(',')[1];
          const res = await fetch(`/api/events/registrations/${regSuccessData.id}/payment-proof`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: proofFile.name,
              base64Data,
              ticket_code: regSuccessData.ticket_code
            })
          });
          const data = await res.json();
          if (res.ok && data.success) {
            setPaidFlowStep('pending_approval');
          } else {
            alert(data.error || 'Không thể gửi ảnh chuyển khoản.');
          }
        } catch (err) {
          alert('Lỗi gửi ảnh chuyển khoản: ' + err.message);
        } finally {
          setUploadingProof(false);
        }
      };
      reader.readAsDataURL(proofFile);
    } catch (err) {
      setUploadingProof(false);
      alert('Lỗi đọc tệp ảnh: ' + err.message);
    }
  };

  // 1. Tải danh sách sự kiện nếu không có id hoặc khi tải trang
  useEffect(() => {
    let isMounted = true;
    const fetchEvents = async () => {
      try {
        const json = await fetchJsonWithTimeout('/api/events', {}, 4500);
        if (json.success && Array.isArray(json.data) && isMounted) {
          if (json.data.length > 0) {
            setEventsList(json.data);
          } else {
            setEventsList(FALLBACK_EVENTS);
          }
        }
      } catch (e) {
        console.warn('Lỗi tải danh sách sự kiện, sử dụng dữ liệu mặc định:', e.message);
        if (isMounted) setEventsList(FALLBACK_EVENTS);
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

  // Tự động điền thông tin khi người dùng đã đăng nhập
  useEffect(() => {
    if (isActuallyLoggedIn && effectiveUser) {
      setRegForm(prev => ({
        ...prev,
        fullName: prev.fullName || effectiveUser.contact_name || effectiveUser.name || '',
        phone: prev.phone || effectiveUser.phone || '',
        email: prev.email || effectiveUser.email || '',
        company: prev.company || effectiveUser.name || '',
        createAccount: false
      }));
    }
  }, [isActuallyLoggedIn, effectiveUser]);

  // Xử lý gửi đăng ký vé
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!currentEvent) return;

    if (!regForm.fullName.trim() || !regForm.phone.trim()) {
      alert('Vui lòng điền Họ và tên và Số điện thoại liên hệ.');
      return;
    }

    if (!isActuallyLoggedIn && regForm.createAccount) {
      const login = regForm.accountLogin.trim() || regForm.phone.trim() || regForm.email.trim();
      if (!login) {
        alert('Vui lòng nhập Tài khoản (Email hoặc Số điện thoại) để tạo tài khoản theo dõi vé.');
        return;
      }
      if (!regForm.accountPassword) {
        alert('Vui lòng nhập mật khẩu cho tài khoản theo dõi vé.');
        return;
      }
      if (regForm.accountPassword.length < 6) {
        alert('Mật khẩu phải có ít nhất 6 ký tự.');
        return;
      }
      if (regForm.accountPassword !== regForm.accountConfirmPassword) {
        alert('Mật khẩu xác nhận không khớp. Vui lòng nhập lại chính xác.');
        return;
      }
    }

    setSubmittingReg(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      const authToken = memberToken || token;
      if (authToken) headers['Authorization'] = 'Bearer ' + authToken;

      const res = await fetch(`/api/events/${currentEvent.id}/register`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          full_name: regForm.fullName.trim(),
          phone: regForm.phone.trim(),
          email: regForm.email.trim() || null,
          company: regForm.company.trim() || null,
          quantity: parseInt(regForm.quantity, 10) || 1,
          member_id: effectiveUser?.id || user?.id || null,
          create_account: isActuallyLoggedIn ? false : regForm.createAccount,
          account_login: regForm.accountLogin.trim() || regForm.phone.trim() || regForm.email.trim(),
          account_password: regForm.accountPassword,
          account_confirm_password: regForm.accountConfirmPassword
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setRegSuccessData(data.registration);
        setPaidFlowStep('transfer');
        setProofFile(null);
        setProofPreview('');
        if (data.account_message) {
          setAccountNotice(data.account_message);
        }
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

  // Format ngày tiếng Việt giống Image 1: "15:24 Thứ Sáu, 30/10/2026 — 16:10 Thứ Sáu, 30/10/2026"
  const formatDateTimeRange = (startDateStr, endDateStr) => {
    if (!startDateStr) return '';
    const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const pad = (n) => String(n).padStart(2, '0');

    const formatSingle = (dStr) => {
      try {
        if (!dStr) return '';
        const cleanStr = String(dStr).trim().replace(' ', 'T');
        const d = new Date(cleanStr);
        if (isNaN(d.getTime())) return String(dStr);
        const dayName = dayNames[d.getDay()] || '';
        return `${pad(d.getHours())}:${pad(d.getMinutes())} ${dayName}${dayName ? ', ' : ''}${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
      } catch (e) {
        return String(dStr);
      }
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
            <div style={{ textAlign: 'center', color: '#1E63E9' }}>
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
              <Link to="/events" style={{ display: 'inline-block', padding: '10px 20px', backgroundColor: '#1E63E9', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', fontSize: '13px' }}>
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

          <style>{`
            @media (max-width: 920px) {
              .event-detail-grid {
                grid-template-columns: 1fr !important;
                gap: 1.5rem !important;
              }
            }
          `}</style>

          {/* 2. TWO-COLUMN GRID: LEFT INFO + RIGHT REGISTRATION CARD (CHUẨN ẢNH 1) */}
          <div className="event-detail-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.85fr) minmax(300px, 350px)',
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

                {/* 2. Form: Đăng ký tham gia hoặc thông báo Sự kiện đã kết thúc */}
                {timeLeft.isPassed || currentEvent.status === 'completed' ? (
                  <div style={{
                    padding: '1.5rem 1rem',
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: '12px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: '#FEE2E2',
                      color: '#DC2626',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px'
                    }}>
                      <i className="ti ti-calendar-off"></i>
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '800', color: '#991B1B', marginBottom: '4px' }}>
                        Sự kiện đã kết thúc
                      </div>
                      <p style={{ fontSize: '12.5px', color: '#7F1D1D', margin: 0, lineHeight: 1.5 }}>
                        Cổng đăng ký tham gia sự kiện này đã đóng do thời gian sự kiện đã kết thúc. Quý vị vui lòng theo dõi các sự kiện sắp diễn ra khác.
                      </p>
                    </div>
                  </div>
                ) : (
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

                    {/* Checkbox tạo tài khoản HOẶC Thông báo đã đăng nhập */}
                    {isActuallyLoggedIn ? (
                      <div style={{
                        padding: '10px 14px',
                        backgroundColor: '#F0FDF4',
                        border: '1px solid #BBF7D0',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginTop: '4px'
                      }}>
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: '#DCFCE7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#166534',
                          flexShrink: 0
                        }}>
                          <i className="ti ti-user-check" style={{ fontSize: '16px' }}></i>
                        </div>
                        <div style={{ fontSize: '12px', color: '#166534', lineHeight: 1.4 }}>
                          Tài khoản: <strong>{effectiveUser?.name || effectiveUser?.username || effectiveUser?.email}</strong>
                          <div style={{ fontSize: '11px', color: '#15803D' }}>Vé đăng ký sẽ tự động gán vào tài khoản này để theo dõi.</div>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Checkbox: Tạo tài khoản để theo dõi vé */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                          <input
                            type="checkbox"
                            id="chkCreateAcc"
                            checked={regForm.createAccount}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setRegForm(prev => ({
                                ...prev,
                                createAccount: checked,
                                accountLogin: checked && !prev.accountLogin ? (prev.email || prev.phone) : prev.accountLogin
                              }));
                            }}
                            style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#064E3B' }}
                          />
                          <label htmlFor="chkCreateAcc" style={{ fontSize: '12.5px', fontWeight: '600', color: '#334155', cursor: 'pointer' }}>
                            Tạo tài khoản để theo dõi vé
                          </label>
                        </div>

                        {/* Hiển thị 3 ô khi tích chọn tạo tài khoản */}
                        {regForm.createAccount && (
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            padding: '10px 12px',
                            backgroundColor: '#F0FDF4',
                            border: '1px solid #BBF7D0',
                            borderRadius: '8px',
                            marginTop: '2px'
                          }}>
                            <div style={{ fontSize: '11px', color: '#166534', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <i className="ti ti-user-plus"></i>
                              <span>Thiết lập tài khoản thành viên:</span>
                            </div>

                            {/* Ô 1: Tài khoản (Email hoặc Số điện thoại) */}
                            <div>
                              <input
                                type="text"
                                required={regForm.createAccount}
                                placeholder="Tài khoản (Email hoặc Số điện thoại) *"
                                value={regForm.accountLogin}
                                onChange={(e) => setRegForm(prev => ({ ...prev, accountLogin: e.target.value }))}
                                style={{
                                  width: '100%',
                                  padding: '8px 10px',
                                  borderRadius: '6px',
                                  border: '1px solid #86EFAC',
                                  fontSize: '12.5px',
                                  outline: 'none',
                                  backgroundColor: '#ffffff'
                                }}
                              />
                            </div>

                            {/* Ô 2: Mật khẩu */}
                            <div style={{ position: 'relative' }}>
                              <input
                                type={showPassword ? 'text' : 'password'}
                                required={regForm.createAccount}
                                placeholder="Mật khẩu (tối thiểu 6 ký tự) *"
                                value={regForm.accountPassword}
                                onChange={(e) => setRegForm(prev => ({ ...prev, accountPassword: e.target.value }))}
                                style={{
                                  width: '100%',
                                  padding: '8px 32px 8px 10px',
                                  borderRadius: '6px',
                                  border: '1px solid #86EFAC',
                                  fontSize: '12.5px',
                                  outline: 'none',
                                  backgroundColor: '#ffffff'
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(p => !p)}
                                style={{
                                  position: 'absolute',
                                  right: '8px',
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  background: 'none',
                                  border: 'none',
                                  color: '#64748B',
                                  cursor: 'pointer',
                                  padding: '2px',
                                  fontSize: '14px'
                                }}
                                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                              >
                                <i className={showPassword ? "ti ti-eye-off" : "ti ti-eye"}></i>
                              </button>
                            </div>

                            {/* Ô 3: Xác nhận mật khẩu */}
                            <div>
                              <input
                                type={showPassword ? 'text' : 'password'}
                                required={regForm.createAccount}
                                placeholder="Xác nhận mật khẩu *"
                                value={regForm.accountConfirmPassword}
                                onChange={(e) => setRegForm(prev => ({ ...prev, accountConfirmPassword: e.target.value }))}
                                style={{
                                  width: '100%',
                                  padding: '8px 10px',
                                  borderRadius: '6px',
                                  border: '1px solid #86EFAC',
                                  fontSize: '12.5px',
                                  outline: 'none',
                                  backgroundColor: '#ffffff'
                                }}
                              />
                            </div>

                            <div style={{ fontSize: '10.5px', color: '#15803D', lineHeight: 1.35 }}>
                              * Hệ thống sẽ tự động tạo tài khoản như đăng ký thành viên (các trường bắt buộc khác sẽ để mặc định là "Cần bổ sung"). Sau khi admin duyệt, bạn có thể đăng nhập vào để cập nhật thông tin.
                            </div>
                          </div>
                        )}
                      </>
                    )}

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

                    {/* Subtext chú thích */}
                    <div style={{ fontSize: '11px', color: '#64748B', textAlign: 'center', marginTop: '6px', lineHeight: 1.4 }}>
                      {Number(currentEvent?.is_paid) === 1 && Number(currentEvent?.price) > 0
                        ? 'Sự kiện có phí: Vui lòng chuyển khoản và tải ảnh xác nhận để kích hoạt vé.'
                        : 'Bạn sẽ nhận được mã QR ngay sau khi hoàn tất đăng ký.'}
                      {!isLoggedIn && (
                        <div style={{ marginTop: '2px' }}>
                          Đã có tài khoản?{' '}
                          <Link to="/login" style={{ color: '#D97706', textDecoration: 'none', fontWeight: '600' }}>
                            Tra cứu tại đây
                          </Link>
                        </div>
                      )}
                    </div>

                  </form>
                </div>
                )}

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
              {/* ───────────────────────────────────────────────────────────── */}
              {/* TRƯỜNG HỢP 1: SỰ KIỆN CÓ PHÍ (PAID EVENT FLOW)               */}
              {/* ───────────────────────────────────────────────────────────── */}
              {Number(regSuccessData.total_amount) > 0 ? (
                paidFlowStep === 'transfer' ? (
                  // BƯỚC 1 CỦA SỰ KIỆN CÓ PHÍ: THÔNG TIN CHUYỂN KHOẢN & BẮT BUỘC TẢI ẢNH BILL
                  <>
                    <div style={{ backgroundColor: '#064E3B', color: '#ffffff', padding: '1.25rem', textAlign: 'center' }}>
                      <div style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 8px',
                        fontSize: '22px'
                      }}>
                        <i className="ti ti-credit-card"></i>
                      </div>
                      <h3 style={{ fontSize: '17px', fontWeight: '800', margin: '0 0 4px 0' }}>
                        Thanh toán & Kích hoạt vé
                      </h3>
                      <p style={{ fontSize: '12px', opacity: 0.9, margin: 0 }}>
                        {regSuccessData.event_title}
                      </p>
                    </div>

                    <div style={{ padding: '1.25rem 1.5rem', maxHeight: '72vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {/* Chú thích thông tin người đăng ký */}
                      <div style={{ fontSize: '12.5px', color: '#334155', backgroundColor: '#F8FAFC', padding: '10px 14px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <div><strong>Khách tham dự:</strong> {regSuccessData.full_name} ({regSuccessData.phone})</div>
                        <div><strong>Số lượng vé:</strong> {regSuccessData.quantity} vé · <strong>Mã đăng ký:</strong> <code style={{ fontWeight: '700' }}>{regSuccessData.ticket_code}</code></div>
                      </div>

                      {/* Khối thanh toán Chuyển khoản VietQR */}
                      <div style={{ border: '1px solid #FCD34D', backgroundColor: '#FFFBEB', borderRadius: '12px', padding: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#B45309', fontWeight: '800', fontSize: '14px', marginBottom: '8px' }}>
                          <i className="ti ti-building-bank"></i>
                          <span>Thông tin thanh toán chuyển khoản</span>
                        </div>

                        <div style={{ fontSize: '13px', color: '#78350F', marginBottom: '10px' }}>
                          Tổng số tiền cần thanh toán:{' '}
                          <strong style={{ fontSize: '17px', color: '#B45309' }}>
                            {Number(regSuccessData.total_amount).toLocaleString('vi-VN')} VNĐ
                          </strong>
                        </div>

                        {/* VietQR Code Image */}
                        {regSuccessData.vietqr_url && (
                          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                            <img
                              src={regSuccessData.vietqr_url}
                              alt="VietQR Chuyển khoản"
                              style={{ maxWidth: '240px', width: '100%', borderRadius: '8px', border: '1px solid #FDE68A', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}
                            />
                            <div style={{ fontSize: '11px', color: '#78350F', marginTop: '4px' }}>
                              Quét mã VietQR bằng ứng dụng ngân hàng bất kỳ để chuyển khoản tự động
                            </div>
                          </div>
                        )}

                        {/* Chi tiết tài khoản */}
                        <div style={{ fontSize: '12px', color: '#451A03', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div><strong>Ngân hàng:</strong> {regSuccessData.bank_info?.bank_name} ({regSuccessData.bank_info?.bank_branch})</div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FEF3C7', padding: '6px 8px', borderRadius: '6px' }}>
                            <span><strong>Số tài khoản:</strong> <code style={{ fontSize: '13px', fontWeight: '800' }}>{regSuccessData.bank_info?.account_number}</code></span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(regSuccessData.bank_info?.account_number, 'bank')}
                              style={{ padding: '3px 8px', fontSize: '11px', backgroundColor: '#D97706', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
                            >
                              {copiedBank ? 'Đã chép!' : 'Sao chép'}
                            </button>
                          </div>
                          <div><strong>Chủ tài khoản:</strong> {regSuccessData.bank_info?.account_holder}</div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FEF3C7', padding: '6px 8px', borderRadius: '6px' }}>
                            <span><strong>Nội dung CK:</strong> <code style={{ fontSize: '12px', fontWeight: '800', color: '#B45309' }}>{regSuccessData.payment_note}</code></span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(regSuccessData.payment_note, 'note')}
                              style={{ padding: '3px 8px', fontSize: '11px', backgroundColor: '#D97706', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
                            >
                              {copiedNote ? 'Đã chép!' : 'Sao chép'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* KHỐI BẮT BUỘC TẢI ẢNH CHUYỂN KHOẢN (BILL) */}
                      <div style={{
                        border: '2px dashed #1E63E9',
                        backgroundColor: '#EFF6FF',
                        borderRadius: '12px',
                        padding: '1.25rem',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '13px', fontWeight: '800', color: '#1E40AF', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <i className="ti ti-upload"></i>
                          <span>Tải ảnh chuyển khoản thành công (Bắt buộc) *</span>
                        </div>
                        <p style={{ fontSize: '11.5px', color: '#1E3A8A', margin: '0 0 12px', lineHeight: 1.4 }}>
                          Sau khi chuyển khoản qua ứng dụng ngân hàng, quý khách vui lòng tải ảnh biên lai giao dịch thành công lên đây để Ban tổ chức kiểm duyệt và kích hoạt vé.
                        </p>

                        {proofPreview ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              maxHeight: '180px',
                              width: '100%',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              border: '1px solid #BFDBFE',
                              backgroundColor: '#ffffff'
                            }}>
                              <img
                                src={proofPreview}
                                alt="Ảnh chuyển khoản"
                                style={{ width: '100%', maxHeight: '180px', objectFit: 'contain' }}
                              />
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <span style={{ fontSize: '11px', color: '#1E40AF', fontWeight: '600' }}>
                                ✓ Đã chọn ảnh: {proofFile?.name}
                              </span>
                              <label
                                style={{
                                  fontSize: '11px',
                                  color: '#2563EB',
                                  cursor: 'pointer',
                                  textDecoration: 'underline',
                                  fontWeight: '600'
                                }}
                              >
                                Đổi ảnh khác
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleProofChange}
                                  style={{ display: 'none' }}
                                />
                              </label>
                            </div>
                          </div>
                        ) : (
                          <label style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '1.5rem',
                            border: '1px dashed #3B82F6',
                            borderRadius: '8px',
                            backgroundColor: '#ffffff',
                            cursor: 'pointer',
                            gap: '6px'
                          }}>
                            <i className="ti ti-photo-plus" style={{ fontSize: '30px', color: '#1E63E9' }}></i>
                            <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#1E40AF' }}>
                              Nhấn vào đây để tải ảnh bill chuyển khoản
                            </span>
                            <span style={{ fontSize: '11px', color: '#64748B' }}>
                              Hỗ trợ định dạng JPG, PNG, WEBP (Tối đa 20MB)
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleProofChange}
                              style={{ display: 'none' }}
                            />
                          </label>
                        )}
                      </div>

                    </div>

                    {/* Footer Modal Thanh toán */}
                    <div style={{
                      padding: '1rem 1.5rem',
                      borderTop: '1px solid #E2E8F0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: '#F8FAFC'
                    }}>
                      <button
                        type="button"
                        onClick={() => setRegSuccessData(null)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '8px',
                          border: '1px solid #CBD5E1',
                          backgroundColor: '#ffffff',
                          color: '#64748B',
                          fontSize: '12.5px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Đóng
                      </button>

                      <button
                        type="button"
                        onClick={handleSubmitPaymentProof}
                        disabled={!proofFile || uploadingProof}
                        style={{
                          padding: '9px 22px',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: proofFile ? '#064E3B' : '#94A3B8',
                          color: '#ffffff',
                          fontSize: '13px',
                          fontWeight: '700',
                          cursor: proofFile && !uploadingProof ? 'pointer' : 'not-allowed',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: proofFile ? '0 2px 6px rgba(6, 78, 59, 0.3)' : 'none'
                        }}
                      >
                        {uploadingProof ? (
                          <>
                            <i className="ti ti-loader animate-spin"></i>
                            Đang gửi ảnh...
                          </>
                        ) : (
                          <>
                            <i className="ti ti-send"></i>
                            Gửi ảnh xác nhận thanh toán
                          </>
                        )}
                      </button>
                    </div>
                  </>
                ) : (
                  // BƯỚC 2 CỦA SỰ KIỆN CÓ PHÍ: THÔNG BÁO CHỜ DUYỆT THANH TOÁN
                  <>
                    <div style={{ backgroundColor: '#065F46', color: '#ffffff', padding: '1.5rem 1.25rem', textAlign: 'center' }}>
                      <div style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 10px',
                        fontSize: '26px'
                      }}>
                        <i className="ti ti-clock"></i>
                      </div>
                      <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 4px 0' }}>
                        Đã gửi thông tin thanh toán!
                      </h3>
                      <p style={{ fontSize: '12.5px', opacity: 0.9, margin: 0 }}>
                        {regSuccessData.event_title}
                      </p>
                    </div>

                    <div style={{ padding: '1.5rem', maxHeight: '72vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      
                      {/* Box thông báo Chờ duyệt */}
                      <div style={{
                        backgroundColor: '#FEF3C7',
                        border: '1px solid #FCD34D',
                        borderRadius: '12px',
                        padding: '1.25rem',
                        textAlign: 'center'
                      }}>
                        <span style={{
                          display: 'inline-block',
                          backgroundColor: '#F59E0B',
                          color: '#ffffff',
                          fontSize: '11.5px',
                          fontWeight: '800',
                          padding: '3px 12px',
                          borderRadius: '12px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          marginBottom: '8px'
                        }}>
                          Trạng thái: Chờ duyệt thanh toán
                        </span>
                        <div style={{ fontSize: '14px', fontWeight: '800', color: '#92400E', marginBottom: '6px' }}>
                          Ban tổ chức đang kiểm tra và đối soát chuyển khoản
                        </div>
                        <p style={{ fontSize: '12.5px', color: '#78350F', margin: 0, lineHeight: 1.5 }}>
                          Chứng từ chuyển khoản của bạn đã được tiếp nhận thành công. Sau khi xác nhận hợp lệ, Ban tổ chức sẽ kích hoạt vé tham dự chính thức.
                        </p>
                      </div>

                      {/* Hướng dẫn xem vé trong Dashboard */}
                      <div style={{
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: '10px',
                        padding: '12px 14px',
                        fontSize: '12.5px',
                        color: '#334155',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}>
                        <div><strong>Mã đăng ký:</strong> <code style={{ fontWeight: '700', color: '#0F172A' }}>{regSuccessData.ticket_code}</code></div>
                        <div><strong>Khách tham dự:</strong> {regSuccessData.full_name}</div>
                        <div><strong>Số lượng:</strong> {regSuccessData.quantity} vé · <strong>Tổng tiền:</strong> {Number(regSuccessData.total_amount).toLocaleString('vi-VN')} VNĐ</div>
                        <div style={{ marginTop: '4px', fontSize: '12px', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <i className="ti ti-info-circle"></i>
                          <span>Khi vé được duyệt, bạn đăng nhập vào <strong>Dashboard thành viên</strong> sẽ thấy ngay mã QR check-in để tham gia sự kiện.</span>
                        </div>
                      </div>

                      {accountNotice && (
                        <div style={{
                          backgroundColor: '#ECFDF5',
                          border: '1px solid #A7F3D0',
                          color: '#065F46',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          lineHeight: 1.45
                        }}>
                          <strong>Tài khoản theo dõi:</strong> {accountNotice}
                        </div>
                      )}

                    </div>

                    <div style={{
                      padding: '1rem 1.5rem',
                      borderTop: '1px solid #E2E8F0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      backgroundColor: '#F8FAFC'
                    }}>
                      {isLoggedIn ? (
                        <Link
                          to="/member-dashboard"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 16px',
                            backgroundColor: '#1E63E9',
                            color: '#ffffff',
                            borderRadius: '8px',
                            fontSize: '12.5px',
                            fontWeight: '700',
                            textDecoration: 'none'
                          }}
                        >
                          <i className="ti ti-ticket"></i> Vào Dashboard theo dõi
                        </Link>
                      ) : (
                        <Link
                          to="/login"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 16px',
                            backgroundColor: '#1E63E9',
                            color: '#ffffff',
                            borderRadius: '8px',
                            fontSize: '12.5px',
                            fontWeight: '700',
                            textDecoration: 'none'
                          }}
                        >
                          <i className="ti ti-login"></i> Đăng nhập Dashboard
                        </Link>
                      )}

                      <button
                        type="button"
                        onClick={() => setRegSuccessData(null)}
                        style={{
                          padding: '8px 24px',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: '#0D3894',
                          color: '#ffffff',
                          fontSize: '12.5px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        Hoàn tất
                      </button>
                    </div>
                  </>
                )
              ) : (
                // ─────────────────────────────────────────────────────────────
                // TRƯỜNG HỢP 2: SỰ KIỆN MIỄN PHÍ (CÓ VÉ LIỀN)
                // ─────────────────────────────────────────────────────────────
                <>
                  <div style={{ backgroundColor: '#064E3B', color: '#ffffff', padding: '1.25rem', textAlign: 'center' }}>
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

                  <div style={{ padding: '1.5rem', maxHeight: '75vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    
                    {/* Thẻ Vé Điện Tử */}
                    <div style={{
                      border: '2px dashed #1E63E9',
                      borderRadius: '12px',
                      padding: '1.25rem',
                      backgroundColor: '#EFF6FF',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#1E40AF', fontWeight: '700', letterSpacing: '0.6px' }}>
                        MÃ VÉ THAM DỰ CHÍNH THỨC
                      </div>
                      <div style={{ fontSize: '22px', fontWeight: '900', color: '#0F172A', letterSpacing: '1px', margin: '4px 0 10px' }}>
                        {regSuccessData.ticket_code}
                      </div>

                      {/* QR Image */}
                      {regSuccessData.qr_image && (
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
                      )}
                      <div style={{ fontSize: '11px', color: '#64748B', marginTop: '8px' }}>
                        Vui lòng xuất trình mã QR này tại quầy lễ tân để check-in vào sự kiện.
                      </div>
                    </div>

                    {/* Thông tin người đăng ký */}
                    <div style={{ fontSize: '12.5px', color: '#334155', backgroundColor: '#F8FAFC', padding: '10px 14px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div><strong>Người tham dự:</strong> {regSuccessData.full_name}</div>
                      <div><strong>Số điện thoại:</strong> {regSuccessData.phone}</div>
                      <div><strong>Số lượng:</strong> {regSuccessData.quantity} vé (Miễn phí)</div>
                      {regSuccessData.company && <div><strong>Đơn vị:</strong> {regSuccessData.company}</div>}
                    </div>

                    {/* Thông báo tạo tài khoản nếu có */}
                    {accountNotice && (
                      <div style={{
                        backgroundColor: '#ECFDF5',
                        border: '1px solid #A7F3D0',
                        color: '#065F46',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        lineHeight: 1.45,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px'
                      }}>
                        <i className="ti ti-check-circle" style={{ fontSize: '18px', color: '#059669', flexShrink: 0, marginTop: '2px' }}></i>
                        <div>
                          <strong>Tài khoản theo dõi vé:</strong> {accountNotice} Sau khi Ban quản trị phê duyệt hồ sơ, bạn có thể đăng nhập bằng tài khoản này để xem và quản lý vé trong Dashboard thành viên.
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

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {isLoggedIn && (
                        <Link
                          to="/member-dashboard"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 16px',
                            backgroundColor: '#1E63E9',
                            color: '#ffffff',
                            borderRadius: '8px',
                            fontSize: '12.5px',
                            fontWeight: '700',
                            textDecoration: 'none'
                          }}
                        >
                          <i className="ti ti-ticket"></i> Xem vé trong Dashboard
                        </Link>
                      )}

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
                </>
              )}

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
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#1E63E9', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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
          <div style={{ padding: '5rem', textAlign: 'center', color: '#1E63E9' }}>
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
                      backgroundColor: isPaid ? '#F59E0B' : '#1E63E9',
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
                      <span style={{ fontSize: '11.5px', color: '#1E63E9', fontWeight: '600' }}>
                        Còn: <strong>{remaining}</strong> {capacity > 0 ? 'vé' : ''}
                      </span>

                      <Link
                        to={`/events/${evt.slug || evt.id}`}
                        style={{
                          padding: '6px 14px',
                          backgroundColor: '#1E63E9',
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
