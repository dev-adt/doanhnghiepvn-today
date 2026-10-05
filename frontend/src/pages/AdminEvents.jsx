import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AdminLayout from '../components/AdminLayout';
import RichTextEditor from '../components/RichTextEditor';
import { formatVNTime } from '../utils/dateUtils';

export const AdminEvents = () => {
  const { getAuthHeaders } = useAuth();
  const navigate = useNavigate();
  
  // Danh sách sự kiện & bộ lọc
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [registrationsModalOpen, setRegistrationsModalOpen] = useState(false);
  const [checkinModalOpen, setCheckinModalOpen] = useState(false);
  const [currentEventForRegs, setCurrentEventForRegs] = useState(null);
  const [registrationsList, setRegistrationsList] = useState([]);
  const [loadingRegs, setLoadingRegs] = useState(false);
  const [regSearch, setRegSearch] = useState('');
  const [viewingProof, setViewingProof] = useState(null);

  // Check-in State
  const [checkinCodeInput, setCheckinCodeInput] = useState('');
  const [checkinResult, setCheckinResult] = useState(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form State (Đồng bộ chuẩn xác theo modal Image 2)
  const [formData, setFormData] = useState({
    title: '',
    short_desc: '',
    content: '',
    image_url: '',
    location: '',
    event_date: '',
    end_date: '',
    is_paid: false,
    price: 0,
    capacity: 0,
    is_published: true,
    organizer: 'Tạp chí Doanh Nghiệp Việt Nam',
    status: 'upcoming'
  });

  const loadEvents = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/events?all=true', {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Không thể tải danh sách sự kiện.');
      const data = await res.json();
      setEvents(data.data || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const formatDateTimeLocal = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const handleOpenAddModal = () => {
    const now = new Date();
    const startStr = formatDateTimeLocal(now);
    now.setHours(now.getHours() + 2);
    const endStr = formatDateTimeLocal(now);

    setFormData({
      title: '',
      short_desc: '',
      content: '',
      image_url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
      location: '',
      event_date: startStr,
      end_date: endStr,
      is_paid: false,
      price: 0,
      capacity: 0,
      is_published: true,
      organizer: 'Tạp chí Doanh Nghiệp Việt Nam',
      status: 'upcoming'
    });
    setEditingEventId(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (event) => {
    setFormData({
      title: event.title || '',
      short_desc: event.short_desc || '',
      content: event.content || event.description || '',
      image_url: event.image_url || '',
      location: event.location || '',
      event_date: formatDateTimeLocal(event.event_date),
      end_date: event.end_date ? formatDateTimeLocal(event.end_date) : '',
      is_paid: Number(event.is_paid) === 1,
      price: event.price || 0,
      capacity: event.capacity || 0,
      is_published: event.is_published !== 0,
      organizer: event.organizer || 'Tạp chí Doanh Nghiệp Việt Nam',
      status: event.status || 'upcoming'
    });
    setEditingEventId(event.id);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.event_date) {
      alert('Vui lòng điền đầy đủ Tiêu đề và Thời gian bắt đầu.');
      return;
    }

    const payload = {
      ...formData,
      is_paid: formData.is_paid ? 1 : 0,
      price: formData.is_paid ? parseFloat(formData.price) || 0 : 0,
      capacity: parseInt(formData.capacity, 10) || 0,
      is_published: formData.is_published ? 1 : 0
    };

    const url = editingEventId ? `/api/admin/events/${editingEventId}` : '/api/admin/events';
    const method = editingEventId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(editingEventId ? 'Cập nhật sự kiện thành công!' : 'Tạo sự kiện mới thành công!');
        setModalOpen(false);
        loadEvents();
      } else {
        alert(data.error || 'Thao tác thất bại.');
      }
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa sự kiện "${title}"?\nThao tác này sẽ xóa toàn bộ vé đăng ký liên quan.`)) return;

    try {
      const res = await fetch(`/api/admin/events/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        alert('Đã xóa sự kiện thành công!');
        loadEvents();
      } else {
        const err = await res.json();
        alert(err.error || 'Thao tác thất bại.');
      }
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  // Mở modal danh sách đăng ký
  const handleOpenRegistrations = async (event) => {
    setCurrentEventForRegs(event);
    setRegistrationsModalOpen(true);
    setLoadingRegs(true);
    try {
      const res = await fetch(`/api/admin/events/${event.id}/registrations`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setRegistrationsList(data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRegs(false);
    }
  };

  // Cập nhật trạng thái thanh toán vé
  const handleUpdatePaymentStatus = async (regId, newStatus) => {
    try {
      const res = await fetch(`/api/admin/events/registrations/${regId}/payment`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ payment_status: newStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRegistrationsList(prev => prev.map(r => r.id === regId ? { ...r, payment_status: newStatus } : r));
      } else {
        alert(data.error || 'Không thể cập nhật trạng thái thanh toán.');
      }
    } catch (e) {
      alert('Lỗi cập nhật: ' + e.message);
    }
  };

  // Thực hiện Check-in
  const handleCheckinSubmit = async (e, codeToUse) => {
    if (e) e.preventDefault();
    const code = (codeToUse || checkinCodeInput).trim();
    if (!code) {
      alert('Vui lòng nhập Mã vé hoặc Quét mã QR.');
      return;
    }

    setCheckingIn(true);
    setCheckinResult(null);
    try {
      const res = await fetch('/api/admin/events/checkin', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ticket_code: code,
          event_id: currentEventForRegs ? currentEventForRegs.id : undefined
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCheckinResult({
          type: data.already_checked_in ? 'warning' : 'success',
          message: data.message,
          reg: data.registration
        });
        if (!data.already_checked_in) {
          // Cập nhật danh sách nếu đang mở modal đăng ký
          setRegistrationsList(prev => prev.map(r => r.ticket_code === code ? { ...r, checkin_status: 'checked_in', checkin_time: data.registration?.checkin_time || new Date().toISOString() } : r));
          loadEvents();
        }
      } else {
        setCheckinResult({
          type: 'error',
          message: data.error || 'Mã vé không hợp lệ hoặc không tìm thấy.'
        });
      }
    } catch (err) {
      setCheckinResult({
        type: 'error',
        message: 'Lỗi mạng: ' + err.message
      });
    } finally {
      setCheckingIn(false);
      setCheckinCodeInput('');
    }
  };

  // Format ngày hiển thị tiếng Việt giống ảnh: "15:24 Thứ Sáu, 30/10/2026"
  const formatEventDateTime = (dStr) => {
    if (!dStr) return '';
    const d = new Date(dStr);
    const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())} ${dayNames[d.getDay()]}, ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  };

  const filteredEvents = events.filter(e => {
    if (statusFilter !== 'all' && e.status !== statusFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (e.title && e.title.toLowerCase().includes(q)) ||
      (e.location && e.location.toLowerCase().includes(q)) ||
      (e.organizer && e.organizer.toLowerCase().includes(q))
    );
  });

  const filteredRegistrations = registrationsList.filter(r => {
    if (!regSearch) return true;
    const q = regSearch.toLowerCase();
    return (
      (r.full_name && r.full_name.toLowerCase().includes(q)) ||
      (r.phone && r.phone.includes(q)) ||
      (r.ticket_code && r.ticket_code.toLowerCase().includes(q)) ||
      (r.company && r.company.toLowerCase().includes(q))
    );
  });

  return (
    <AdminLayout>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem' }}>
        
        {/* TOP BAR: HEADER QUẢN LÝ SỰ KIỆN (CHUẨN HÌNH ẢNH 2) */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.75rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h1 style={{
              fontSize: '22px',
              fontWeight: '800',
              color: '#0F172A',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(13, 148, 136, 0.12)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0D9488'
              }}>
                <i className="ti ti-calendar-event" style={{ fontSize: '20px' }}></i>
              </span>
              Quản lý Sự kiện
            </h1>
            <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px', marginBlockEnd: 0 }}>
              Tạo sự kiện, theo dõi đăng ký và check-in bằng mã QR
            </p>
          </div>

          {/* 2 NÚT THAO TÁC GÓC PHẢI NHƯ ẢNH 2: [# Check-in] và [+ Tạo sự kiện] */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={() => navigate('/admin/checkin')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                backgroundColor: '#ffffff',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                color: '#334155',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F8FAFC'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
            >
              <i className="ti ti-qrcode" style={{ fontSize: '15px', color: '#0D9488' }}></i>
              # Check-in
            </button>

            <button
              onClick={handleOpenAddModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 18px',
                backgroundColor: '#0D9488',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(13, 148, 136, 0.35)',
                transition: 'all 0.18s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#0F766E'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#0D9488'; }}
            >
              <i className="ti ti-plus" style={{ fontSize: '15px' }}></i>
              + Tạo sự kiện
            </button>
          </div>
        </div>

        {/* BỘ LỌC TRẠNG THÁI VÀ TÌM KIẾM */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: `Tất cả (${events.length})` },
              { id: 'upcoming', label: `Sắp diễn ra (${events.filter(e => e.status === 'upcoming').length})` },
              { id: 'ongoing', label: `Đang diễn ra (${events.filter(e => e.status === 'ongoing').length})` },
              { id: 'completed', label: `Đã kết thúc (${events.filter(e => e.status === 'completed').length})` },
              { id: 'cancelled', label: `Đã hủy (${events.filter(e => e.status === 'cancelled').length})` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: statusFilter === tab.id ? '700' : '500',
                  border: '1px solid',
                  borderColor: statusFilter === tab.id ? '#0D9488' : '#E2E8F0',
                  backgroundColor: statusFilter === tab.id ? '#0D9488' : '#FFFFFF',
                  color: statusFilter === tab.id ? '#FFFFFF' : '#64748B',
                  cursor: 'pointer'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', width: '260px' }}>
            <i className="ti ti-search" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}></i>
            <input
              type="text"
              placeholder="Tìm tên sự kiện, địa điểm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 12px 7px 32px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '12.5px',
                outline: 'none',
                backgroundColor: '#ffffff'
              }}
            />
          </div>
        </div>

        {/* DANH SÁCH SỰ KIỆN DẠNG CARD CHUẨN MẪU GIAO DIỆN (ẢNH 2) */}
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#64748B' }}>
            <i className="ti ti-loader animate-spin" style={{ fontSize: '24px', display: 'block', margin: '0 auto 10px', color: '#0D9488' }}></i>
            Đang tải dữ liệu sự kiện...
          </div>
        ) : error ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#EF4444' }}>
            <i className="ti ti-alert-triangle" style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}></i>
            {error}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div style={{
            padding: '4rem',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px dashed #CBD5E1',
            color: '#64748B'
          }}>
            <i className="ti ti-calendar-off" style={{ fontSize: '32px', display: 'block', margin: '0 auto 10px', color: '#94A3B8' }}></i>
            Chưa có sự kiện nào trong danh mục này. Hãy nhấn nút "+ Tạo sự kiện" để thêm mới!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredEvents.map((evt) => {
              const registered = Number(evt.registered_count) || 0;
              const capacity = Number(evt.capacity) || 0;
              const remaining = capacity > 0 ? Math.max(0, capacity - registered) : 'Không giới hạn';
              const checkedIn = Number(evt.checked_in_count) || 0;
              const isPaid = Number(evt.is_paid) === 1 && Number(evt.price) > 0;

              return (
                <div
                  key={evt.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                    padding: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1.5rem',
                    flexWrap: 'wrap',
                    transition: 'border-color 0.2s, box-shadow 0.2s'
                  }}
                >
                  {/* Left: Thumbnail & Main Info */}
                  <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flex: 1, minWidth: '320px' }}>
                    <div style={{
                      width: '120px',
                      height: '80px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      backgroundColor: '#F1F5F9',
                      flexShrink: 0,
                      border: '1px solid #E2E8F0'
                    }}>
                      <img
                        src={evt.image_url || 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=300&q=80'}
                        alt={evt.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: '16px',
                          fontWeight: '800',
                          color: '#0F172A',
                          lineHeight: 1.3
                        }}>
                          {evt.title}
                        </span>

                        {/* Status Badge */}
                        <span style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontWeight: '600',
                          backgroundColor: evt.status === 'upcoming' ? 'rgba(59, 130, 246, 0.1)' : evt.status === 'ongoing' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                          color: evt.status === 'upcoming' ? '#2563EB' : evt.status === 'ongoing' ? '#059669' : '#64748B'
                        }}>
                          {evt.status === 'upcoming' ? 'Sắp diễn ra' : evt.status === 'ongoing' ? 'Đang diễn ra' : evt.status === 'completed' ? 'Đã kết thúc' : 'Đã hủy'}
                        </span>

                        {/* Price Badge */}
                        <span style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontWeight: '700',
                          backgroundColor: isPaid ? 'rgba(245, 158, 11, 0.1)' : 'rgba(13, 148, 136, 0.1)',
                          color: isPaid ? '#D97706' : '#0D9488'
                        }}>
                          {isPaid ? `${Number(evt.price).toLocaleString('vi-VN')} đ` : 'Miễn phí'}
                        </span>

                        {evt.is_published === 0 && (
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#FEE2E2', color: '#DC2626', fontWeight: '600' }}>
                            Đang ẩn
                          </span>
                        )}
                      </div>

                      {/* Time & Venue */}
                      <div style={{ fontSize: '12.5px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        <i className="ti ti-calendar" style={{ color: '#0D9488' }}></i>
                        <span>{formatEventDateTime(evt.event_date)}</span>
                        {evt.location && (
                          <>
                            <span style={{ color: '#CBD5E1' }}>•</span>
                            <i className="ti ti-map-pin" style={{ color: '#EF4444' }}></i>
                            <span>{evt.location}</span>
                          </>
                        )}
                      </div>

                      {/* Ticket Stats (Đúng chuẩn hiển thị ảnh 2) */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#64748B',
                        marginTop: '4px'
                      }}>
                        <span style={{ color: '#0D9488' }}>
                          ĐĂNG KÝ: <strong style={{ color: '#0F172A' }}>{registered}</strong> {capacity > 0 ? `/ ${capacity}` : ''}
                        </span>
                        <span style={{ color: '#CBD5E1' }}>|</span>
                        <span>
                          CÒN: <strong style={{ color: '#D97706' }}>{remaining}</strong> {capacity > 0 ? 'vé' : ''}
                        </span>
                        <span style={{ color: '#CBD5E1' }}>|</span>
                        <span style={{ color: '#2563EB' }}>
                          ĐÃ CHECK-IN: <strong>{checkedIn}/{registered}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions: Xem | Đăng ký (X) | Sửa | Xóa */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <a
                      href={`/events/${evt.slug || evt.id}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        backgroundColor: '#ffffff',
                        color: '#475569',
                        fontSize: '12px',
                        fontWeight: '600',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <i className="ti ti-eye"></i> Xem
                    </a>

                    <button
                      onClick={() => handleOpenRegistrations(evt)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: '1px solid #0D9488',
                        backgroundColor: 'rgba(13, 148, 136, 0.08)',
                        color: '#0D9488',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <i className="ti ti-users"></i> Đăng ký ({registered})
                    </button>

                    <button
                      onClick={() => handleOpenEditModal(evt)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        backgroundColor: '#ffffff',
                        color: '#2563EB',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '15px'
                      }}
                      title="Chỉnh sửa sự kiện"
                    >
                      <i className="ti ti-pencil"></i>
                    </button>

                    <button
                      onClick={() => handleDelete(evt.id, evt.title)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        border: '1px solid #FCA5A5',
                        backgroundColor: '#FEF2F2',
                        color: '#DC2626',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '15px'
                      }}
                      title="Xóa sự kiện"
                    >
                      <i className="ti ti-trash"></i>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL TẠO MỚI / CHỈNH SỬA SỰ KIỆN (CHUẨN 100% THEO ẢNH 2 CUNG CẤP)        */}
      {/* ========================================================================= */}
      {modalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(5px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '860px',
            maxHeight: '92vh',
            overflowY: 'auto',
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.75rem',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                {editingEventId ? 'Chỉnh sửa sự kiện' : 'Tạo sự kiện mới'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', color: '#64748B', cursor: 'pointer' }}
              >
                <i className="ti ti-x"></i>
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmit} style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              
              {/* Tiêu đề * */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Tiêu đề <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nhập tên sự kiện..."
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13.5px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Mô tả ngắn */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Mô tả ngắn
                </label>
                <input
                  type="text"
                  placeholder="Tóm tắt ngắn gọn sự kiện..."
                  value={formData.short_desc}
                  onChange={(e) => setFormData(prev => ({ ...prev, short_desc: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Nội dung chi tiết (RichTextEditor) */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Nội dung chi tiết
                </label>
                <div style={{ border: '1px solid #CBD5E1', borderRadius: '8px', overflow: 'hidden' }}>
                  <RichTextEditor
                    value={formData.content}
                    onChange={(val) => setFormData(prev => ({ ...prev, content: val }))}
                    placeholder="Bấm vào đây và gõ nội dung sự kiện. Chèn ảnh - hoàn hảo cả khi bạn copy từ word và các trang nguồn."
                  />
                </div>
              </div>

              {/* Ảnh đại diện & Địa điểm */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Ảnh đại diện <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 'normal' }}>(Hiển thị khi chia sẻ Zalo, Facebook)</span>
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="https://... hoặc tải ảnh"
                      value={formData.image_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '12.5px',
                        outline: 'none'
                      }}
                    />
                    <label style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      backgroundColor: uploadingImage ? '#E2E8F0' : '#F8FAFC',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: uploadingImage ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap',
                      color: uploadingImage ? '#64748B' : '#334155'
                    }}>
                      <i className={`ti ${uploadingImage ? 'ti-loader animate-spin' : 'ti-upload'}`}></i>
                      {uploadingImage ? 'Đang tải...' : 'Tải ảnh'}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingImage}
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 25 * 1024 * 1024) {
                            alert('Dung lượng tệp vượt quá 25MB. Vui lòng chọn tệp nhỏ hơn.');
                            return;
                          }
                          setUploadingImage(true);
                          const reader = new FileReader();
                          reader.onloadend = async () => {
                            try {
                              const base64Data = reader.result.split(',')[1];
                              const res = await fetch('/api/upload', {
                                method: 'POST',
                                headers: getAuthHeaders(),
                                body: JSON.stringify({
                                  fileName: file.name,
                                  fileType: file.type,
                                  base64Data
                                })
                              });
                              const text = await res.text();
                              let json;
                              try {
                                json = JSON.parse(text);
                              } catch {
                                throw new Error('Máy chủ phản hồi không đúng định dạng JSON.');
                              }
                              if (res.ok && json.success && json.url) {
                                setFormData(prev => ({ ...prev, image_url: json.url }));
                              } else {
                                alert(json.error || 'Lỗi tải ảnh lên.');
                              }
                            } catch (err) {
                              alert('Lỗi tải ảnh: ' + err.message);
                            } finally {
                              setUploadingImage(false);
                            }
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                  </div>
                  {formData.image_url && (
                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img 
                        src={formData.image_url} 
                        alt="Ảnh đại diện sự kiện" 
                        style={{ width: '80px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #CBD5E1' }} 
                        onError={(e) => e.target.style.display = 'none'}
                      />
                      <span style={{ fontSize: '11.5px', color: '#16A34A', fontWeight: '600' }}>✓ Đã tải ảnh lên thành công</span>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Địa điểm
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 36 Hùng vương hoặc Khách sạn Daewoo..."
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '12.5px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Bắt đầu * & Kết thúc */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Bắt đầu <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.event_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, event_date: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '12.5px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Kết thúc
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '12.5px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Có thu phí Toggle & Mức phí (đ/vé) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label style={{
                    position: 'relative',
                    display: 'inline-block',
                    width: '42px',
                    height: '24px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={formData.is_paid}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_paid: e.target.checked }))}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: formData.is_paid ? '#0D9488' : '#CBD5E1',
                      borderRadius: '24px',
                      transition: '0.2s'
                    }}>
                      <span style={{
                        position: 'absolute',
                        height: '18px',
                        width: '18px',
                        left: formData.is_paid ? '20px' : '3px',
                        bottom: '3px',
                        backgroundColor: '#ffffff',
                        borderRadius: '50%',
                        transition: '0.2s'
                      }}></span>
                    </span>
                  </label>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>
                    Có thu phí
                  </span>
                </div>

                {formData.is_paid && (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                      Mức phí (đ/vé)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      placeholder="0"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '7px 12px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Giới hạn số lượng vé */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Giới hạn số lượng vé <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 'normal' }}>(0 = không giới hạn)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.capacity}
                  onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Công khai lên website Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '4px' }}>
                <label style={{
                  position: 'relative',
                  display: 'inline-block',
                  width: '42px',
                  height: '24px',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: formData.is_published ? '#0D9488' : '#CBD5E1',
                    borderRadius: '24px',
                    transition: '0.2s'
                  }}>
                    <span style={{
                      position: 'absolute',
                      height: '18px',
                      width: '18px',
                      left: formData.is_published ? '20px' : '3px',
                      bottom: '3px',
                      backgroundColor: '#ffffff',
                      borderRadius: '50%',
                      transition: '0.2s'
                    }}></span>
                  </span>
                </label>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>
                  Công khai lên website
                </span>
              </div>

              {/* Nút hành động Hủy / Lưu (Chuẩn góc phải như ảnh 2) */}
              <div style={{
                marginTop: '1.25rem',
                paddingTop: '1.25rem',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px'
              }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#ffffff',
                    color: '#64748B',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  style={{
                    padding: '8px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#0D9488',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(13, 148, 136, 0.4)'
                  }}
                >
                  Lưu
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL CHECK-IN NHANH BẰNG MÃ QR HOẶC SỐ ĐIỆN THOẠI                        */}
      {/* ========================================================================= */}
      {checkinModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(5px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '520px',
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            padding: '1.75rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(13, 148, 136, 0.1)', color: '#0D9488', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="ti ti-qrcode" style={{ fontSize: '18px' }}></i>
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                  Điểm danh Check-in sự kiện
                </h3>
              </div>
              <button onClick={() => setCheckinModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '18px', color: '#64748B', cursor: 'pointer' }}>
                <i className="ti ti-x"></i>
              </button>
            </div>

            <form onSubmit={(e) => handleCheckinSubmit(e, checkinCodeInput)}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                  Nhập Mã vé (hoặc quét mã QR)
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    required
                    placeholder="VD: DNVN-1-A89K..."
                    value={checkinCodeInput}
                    onChange={(e) => setCheckinCodeInput(e.target.value)}
                    autoFocus
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '2px solid #0D9488',
                      fontSize: '14px',
                      fontWeight: '700',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="submit"
                    disabled={checkingIn}
                    style={{
                      padding: '9px 18px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#0D9488',
                      color: '#ffffff',
                      fontWeight: '700',
                      fontSize: '13px',
                      cursor: checkingIn ? 'wait' : 'pointer'
                    }}
                  >
                    {checkingIn ? 'Đang kiểm tra...' : 'Xác nhận'}
                  </button>
                </div>
              </div>
            </form>

            {/* Kết quả check-in */}
            {checkinResult && (
              <div style={{
                marginTop: '1rem',
                padding: '1rem',
                borderRadius: '10px',
                border: '1px solid',
                borderColor: checkinResult.type === 'success' ? '#86EFAC' : checkinResult.type === 'warning' ? '#FDE047' : '#FCA5A5',
                backgroundColor: checkinResult.type === 'success' ? '#F0FDF4' : checkinResult.type === 'warning' ? '#FEFCE8' : '#FEF2F2'
              }}>
                <div style={{
                  fontSize: '13.5px',
                  fontWeight: '700',
                  color: checkinResult.type === 'success' ? '#15803D' : checkinResult.type === 'warning' ? '#A16207' : '#B91C1C',
                  marginBottom: checkinResult.reg ? '8px' : 0
                }}>
                  {checkinResult.message}
                </div>

                {checkinResult.reg && (
                  <div style={{ fontSize: '12px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div><strong>Họ và tên:</strong> {checkinResult.reg.full_name}</div>
                    <div><strong>Số điện thoại:</strong> {checkinResult.reg.phone}</div>
                    <div><strong>Số lượng vé:</strong> {checkinResult.reg.quantity} vé</div>
                    {checkinResult.reg.company && <div><strong>Đơn vị:</strong> {checkinResult.reg.company}</div>}
                    <div><strong>Mã vé:</strong> <code style={{ background: '#E2E8F0', padding: '1px 6px', borderRadius: '4px' }}>{checkinResult.reg.ticket_code}</code></div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL QUẢN LÝ DANH SÁCH ĐĂNG KÝ VÉ CỦA SỰ KIỆN                            */}
      {/* ========================================================================= */}
      {registrationsModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(5px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '1000px',
            maxHeight: '90vh',
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.75rem',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#F8FAFC'
            }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                  Danh sách người tham dự: {currentEventForRegs?.title}
                </h3>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                  Tổng cộng: <strong>{registrationsList.reduce((acc, cur) => acc + (cur.quantity || 1), 0)} vé</strong> | Đã check-in: <strong>{registrationsList.filter(r => r.checkin_status === 'checked_in').reduce((acc, cur) => acc + (cur.quantity || 1), 0)}</strong>
                </div>
              </div>
              <button
                onClick={() => setRegistrationsModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', color: '#64748B', cursor: 'pointer' }}
              >
                <i className="ti ti-x"></i>
              </button>
            </div>

            {/* Filter bar */}
            <div style={{ padding: '0.75rem 1.75rem', borderBottom: '1px solid #E2E8F0', display: 'flex', gap: '10px' }}>
              <input
                type="text"
                placeholder="Tìm theo tên, SĐT, mã vé hoặc công ty..."
                value={regSearch}
                onChange={(e) => setRegSearch(e.target.value)}
                style={{
                  flex: 1,
                  padding: '7px 12px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '12.5px',
                  outline: 'none'
                }}
              />
            </div>

            {/* Table */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.75rem' }}>
              {loadingRegs ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
                  Đang tải danh sách vé...
                </div>
              ) : filteredRegistrations.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8' }}>
                  Chưa có lượt đăng ký nào.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #E2E8F0', textAlign: 'left', background: '#F8FAFC' }}>
                      <th style={{ padding: '10px' }}>Mã vé</th>
                      <th style={{ padding: '10px' }}>Họ và tên</th>
                      <th style={{ padding: '10px' }}>Liên hệ</th>
                      <th style={{ padding: '10px' }}>Đơn vị</th>
                      <th style={{ padding: '10px' }}>Số vé</th>
                      <th style={{ padding: '10px' }}>Thanh toán</th>
                      <th style={{ padding: '10px' }}>Check-in</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRegistrations.map((r) => (
                      <tr key={r.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '10px', fontWeight: '700', color: '#0F172A' }}>
                          <code style={{ background: '#E2E8F0', padding: '2px 6px', borderRadius: '4px' }}>{r.ticket_code}</code>
                        </td>
                        <td style={{ padding: '10px', fontWeight: '600', color: '#1E293B' }}>{r.full_name}</td>
                        <td style={{ padding: '10px', color: '#475569' }}>
                          <div>{r.phone}</div>
                          {r.email && <div style={{ fontSize: '11px', color: '#64748B' }}>{r.email}</div>}
                        </td>
                        <td style={{ padding: '10px', color: '#475569' }}>{r.company || '—'}</td>
                        <td style={{ padding: '10px', fontWeight: '700' }}>{r.quantity}</td>
                        <td style={{ padding: '10px' }}>
                          <select
                            value={r.payment_status}
                            onChange={(e) => handleUpdatePaymentStatus(r.id, e.target.value)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              border: '1px solid #CBD5E1',
                              fontSize: '11.5px',
                              fontWeight: '600',
                              backgroundColor: r.payment_status === 'paid' ? '#DCFCE7' : r.payment_status === 'pending' ? '#FEF9C3' : '#F1F5F9',
                              color: r.payment_status === 'paid' ? '#15803D' : r.payment_status === 'pending' ? '#A16207' : '#475569'
                            }}
                          >
                            <option value="free">Miễn phí</option>
                            <option value="pending">Chờ thanh toán</option>
                            <option value="paid">Đã thanh toán</option>
                            <option value="cancelled">Hủy vé</option>
                          </select>

                          {r.payment_proof ? (
                            <button
                              type="button"
                              onClick={() => setViewingProof({ url: r.payment_proof, reg: r })}
                              style={{
                                marginTop: '4px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                padding: '2px 7px',
                                borderRadius: '4px',
                                backgroundColor: '#EFF6FF',
                                color: '#1D4ED8',
                                border: '1px solid #BFDBFE',
                                fontSize: '11px',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                            >
                              <i className="ti ti-receipt"></i> Xem bill
                            </button>
                          ) : r.payment_status === 'pending' && Number(r.total_amount) > 0 ? (
                            <span style={{ fontSize: '10px', color: '#94A3B8', display: 'block', marginTop: '2px' }}>Chưa có bill</span>
                          ) : null}
                        </td>
                        <td style={{ padding: '10px' }}>
                          {r.checkin_status === 'checked_in' ? (
                            <span style={{ color: '#16A34A', fontWeight: '700' }}>
                              <i className="ti ti-check"></i> Đã vào ({r.checkin_time ? formatVNTime(r.checkin_time) : ''})
                            </span>
                          ) : (
                            <button
                              onClick={() => handleCheckinSubmit(null, r.ticket_code)}
                              style={{
                                padding: '3px 8px',
                                borderRadius: '4px',
                                border: '1px solid #CBD5E1',
                                background: '#F8FAFC',
                                fontSize: '11px',
                                cursor: 'pointer',
                                fontWeight: '600'
                              }}
                            >
                              Check-in
                            </button>
                          )}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right' }}>
                          <a
                            href={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(r.ticket_code)}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: '#0D9488', textDecoration: 'none', fontWeight: '600', fontSize: '11.5px' }}
                            title="Xem mã QR vé"
                          >
                            Xem QR
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '1rem 1.75rem', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#F8FAFC' }}>
              <button
                onClick={() => setRegistrationsModalOpen(false)}
                style={{ padding: '6px 16px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#ffffff', cursor: 'pointer', fontSize: '12px' }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XEM ẢNH BILL CHUYỂN KHOẢN VÀ DUYỆT THANH TOÁN */}
      {viewingProof && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.25rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            maxWidth: '520px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
          }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="ti ti-receipt" style={{ color: '#2563EB' }}></i>
                Ảnh biên lai chuyển khoản
              </h4>
              <button onClick={() => setViewingProof(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748B' }}>✕</button>
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '12.5px', color: '#334155', backgroundColor: '#F8FAFC', padding: '10px 12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div><strong>Khách tham dự:</strong> {viewingProof.reg?.full_name} ({viewingProof.reg?.phone})</div>
                <div><strong>Mã vé:</strong> <code>{viewingProof.reg?.ticket_code}</code> · <strong>Số tiền:</strong> <strong style={{ color: '#B45309' }}>{Number(viewingProof.reg?.total_amount).toLocaleString('vi-VN')} VNĐ</strong></div>
                <div><strong>Cú pháp CK:</strong> <code>{viewingProof.reg?.payment_note}</code></div>
              </div>

              <div style={{ maxHeight: '360px', overflowY: 'auto', textAlign: 'center', backgroundColor: '#0F172A', borderRadius: '8px', padding: '8px' }}>
                <img
                  src={viewingProof.url}
                  alt="Bill thanh toán"
                  style={{ maxWidth: '100%', maxHeight: '340px', objectFit: 'contain', borderRadius: '4px' }}
                />
              </div>
            </div>

            <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
              <a
                href={viewingProof.url}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '12px', color: '#2563EB', textDecoration: 'underline', fontWeight: '600' }}
              >
                Mở ảnh gốc trong tab mới
              </a>

              <div style={{ display: 'flex', gap: '8px' }}>
                {viewingProof.reg?.payment_status !== 'paid' && (
                  <button
                    type="button"
                    onClick={() => {
                      handleUpdatePaymentStatus(viewingProof.reg.id, 'paid');
                      setViewingProof(null);
                    }}
                    style={{
                      padding: '7px 16px',
                      backgroundColor: '#16A34A',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12.5px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <i className="ti ti-check"></i> Duyệt đã thanh toán
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setViewingProof(null)}
                  style={{
                    padding: '7px 16px',
                    backgroundColor: '#64748B',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12.5px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  );
};

export default AdminEvents;
