import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import brandConfig from '../brand.config';

export const OrganizerDashboard = () => {
  const { user, logout, getAuthHeaders } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal Thêm / Sửa sự kiện
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    short_desc: '',
    content: '',
    image_url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
    location: '',
    event_date: '',
    end_date: '',
    is_paid: false,
    price: 0,
    capacity: 0,
    is_published: true,
    organizer: 'Ban tổ chức Sự kiện',
    status: 'upcoming'
  });

  // Modal Danh sách vé đã đăng ký
  const [registrationsModalOpen, setRegistrationsModalOpen] = useState(false);
  const [selectedEventForRegs, setSelectedEventForRegs] = useState(null);
  const [registrationsList, setRegistrationsList] = useState([]);
  const [loadingRegs, setLoadingRegs] = useState(false);
  const [regSearch, setRegSearch] = useState('');
  const [regFilterStatus, setRegFilterStatus] = useState('all');

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
      organizer: user?.name || 'Ban tổ chức Sự kiện',
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
      is_paid: Boolean(event.is_paid),
      price: event.price || 0,
      capacity: event.capacity || 0,
      is_published: event.is_published !== 0,
      organizer: event.organizer || user?.name || 'Ban tổ chức Sự kiện',
      status: event.status || 'upcoming'
    });
    setEditingEventId(event.id);
    setModalOpen(true);
  };

  const handleSubmitEvent = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editingEventId ? `/api/admin/events/${editingEventId}` : '/api/admin/events';
      const method = editingEventId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Có lỗi xảy ra khi lưu sự kiện.');
      }

      setModalOpen(false);
      loadEvents();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId, title) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa sự kiện "${title}" không?`)) return;

    try {
      const res = await fetch(`/api/admin/events/${eventId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Không thể xóa sự kiện.');
      }
      loadEvents();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOpenRegistrationsModal = async (event) => {
    setSelectedEventForRegs(event);
    setRegistrationsModalOpen(true);
    setLoadingRegs(true);
    try {
      const res = await fetch(`/api/admin/events/${event.id}/registrations`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRegistrationsList(data.data || []);
      } else {
        alert(data.error || 'Không thể tải danh sách vé đăng ký.');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi tải danh sách người tham gia: ' + err.message);
    } finally {
      setLoadingRegs(false);
    }
  };

  const handleUpdatePaymentStatus = async (regId, newStatus) => {
    try {
      const res = await fetch(`/api/admin/events/registrations/${regId}/payment`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ payment_status: newStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRegistrationsList(prev => prev.map(r => r.id === regId ? { ...r, payment_status: newStatus } : r));
      } else {
        alert(data.error || 'Không thể cập nhật trạng thái thanh toán.');
      }
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleCheckinDirect = async (ticketCode) => {
    try {
      const res = await fetch('/api/admin/events/checkin', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ticket_code: ticketCode })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
        setRegistrationsList(prev => prev.map(r => r.ticket_code === ticketCode ? { ...r, checkin_status: 'checked_in', checkin_time: new Date().toISOString() } : r));
        loadEvents();
      } else {
        alert(data.error || 'Check-in không thành công.');
      }
    } catch (err) {
      alert('Lỗi check-in: ' + err.message);
    }
  };

  // Lọc sự kiện
  const filteredEvents = events.filter(evt => {
    const matchesSearch = (evt.title && evt.title.toLowerCase().includes(search.toLowerCase())) ||
      (evt.location && evt.location.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || evt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Thống kê nhanh
  const totalEvents = events.length;
  const upcomingEvents = events.filter(e => e.status === 'upcoming').length;
  const totalRegistrations = events.reduce((sum, e) => sum + (Number(e.registered_count) || 0), 0);
  const totalCheckedIn = events.reduce((sum, e) => sum + (Number(e.checked_in_count) || 0), 0);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', color: '#0F172A', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* TOPBAR CHO BAN TỔ CHỨC */}
      <header style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        padding: '0.85rem 1.5rem',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <div style={{ maxWidth: '1360px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          
          {/* Logo & Role Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: '#0D9488',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '13px'
              }}>
                DNVN
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
                  DoanhNghiepVN<span style={{ color: '#0D9488' }}>.today</span>
                </div>
              </div>
            </Link>

            <span style={{
              backgroundColor: '#FEF3C7',
              color: '#92400E',
              padding: '3px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              BAN TỔ CHỨC SỰ KIỆN
            </span>
          </div>

          {/* Action buttons & Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link
              to="/organizer/checkin"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                backgroundColor: '#064E3B',
                color: '#FFFFFF',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '700',
                textDecoration: 'none',
                boxShadow: '0 2px 4px rgba(6, 78, 59, 0.2)'
              }}
            >
              <i className="ti ti-camera" style={{ fontSize: '16px' }}></i>
              Quét QR Check-in
            </Link>

            <div style={{ height: '24px', width: '1px', backgroundColor: '#E2E8F0' }}></div>

            <div style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>
              {user?.name || user?.username || 'Ban tổ chức'}
            </div>

            <button
              onClick={() => {
                if (window.confirm('Bạn có muốn đăng xuất không?')) logout();
              }}
              style={{
                background: 'none',
                border: '1px solid #CBD5E1',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#EF4444',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Đăng xuất
            </button>
          </div>

        </div>
      </header>

      {/* NỘI DUNG CHÍNH */}
      <main style={{ maxWidth: '1360px', margin: '0 auto', width: '100%', padding: '2rem 1.5rem 4rem', flex: 1 }}>
        
        {/* Header Section */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.75rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="ti ti-calendar-event" style={{ color: '#0D9488' }}></i>
              Quản lý Sự kiện & Check-in
            </h1>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0' }}>
              Khởi tạo sự kiện, quản lý danh sách đăng ký vé, và thực hiện check-in khách tham dự đồng bộ theo thời gian thực.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Link
              to="/organizer/checkin"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 18px',
                backgroundColor: '#ffffff',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                color: '#334155',
                fontSize: '13px',
                fontWeight: '600',
                textDecoration: 'none'
              }}
            >
              <i className="ti ti-qrcode" style={{ color: '#0D9488' }}></i>
              Mở trang Check-in
            </Link>

            <button
              onClick={handleOpenAddModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 18px',
                backgroundColor: '#0D9488',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(13, 148, 136, 0.2)'
              }}
            >
              <i className="ti ti-plus"></i>
              Tạo sự kiện mới
            </button>
          </div>
        </div>

        {/* THỐNG KÊ NHANH */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem'
        }}>
          <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>TỔNG SỐ SỰ KIỆN</div>
            <div style={{ fontSize: '26px', fontWeight: '800', color: '#0F172A', marginTop: '6px' }}>{totalEvents}</div>
          </div>
          <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>SỰ KIỆN SẮP DIỄN RA</div>
            <div style={{ fontSize: '26px', fontWeight: '800', color: '#0D9488', marginTop: '6px' }}>{upcomingEvents}</div>
          </div>
          <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>TỔNG VÉ ĐÃ ĐĂNG KÝ</div>
            <div style={{ fontSize: '26px', fontWeight: '800', color: '#3B82F6', marginTop: '6px' }}>{totalRegistrations}</div>
          </div>
          <div style={{ backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>ĐÃ CHECK-IN</div>
            <div style={{ fontSize: '26px', fontWeight: '800', color: '#16A34A', marginTop: '6px' }}>{totalCheckedIn}</div>
          </div>
        </div>

        {/* BỘ LỌC VÀ TÌM KIẾM */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          padding: '1rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'upcoming', label: 'Sắp diễn ra' },
              { id: 'ongoing', label: 'Đang diễn ra' },
              { id: 'completed', label: 'Đã kết thúc' }
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setStatusFilter(btn.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  backgroundColor: statusFilter === btn.id ? '#0D9488' : '#F1F5F9',
                  color: statusFilter === btn.id ? '#ffffff' : '#475569'
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', width: '280px' }}>
            <i className="ti ti-search" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}></i>
            <input
              type="text"
              placeholder="Tìm theo tên, địa điểm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 32px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '12.5px',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* BẢNG DANH SÁCH SỰ KIỆN */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#0D9488' }}>
              <i className="ti ti-loader animate-spin" style={{ fontSize: '28px', display: 'block', margin: '0 auto 8px' }}></i>
              Đang tải danh sách sự kiện...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B', fontSize: '13.5px' }}>
              Chưa có sự kiện nào phù hợp.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
                    <th style={{ padding: '12px 16px', fontWeight: '700' }}>Ảnh bìa</th>
                    <th style={{ padding: '12px 16px', fontWeight: '700' }}>Tên sự kiện & Thời gian</th>
                    <th style={{ padding: '12px 16px', fontWeight: '700' }}>Địa điểm</th>
                    <th style={{ padding: '12px 16px', fontWeight: '700' }}>Vé & Giá</th>
                    <th style={{ padding: '12px 16px', fontWeight: '700' }}>Đăng ký / Check-in</th>
                    <th style={{ padding: '12px 16px', fontWeight: '700' }}>Trạng thái</th>
                    <th style={{ padding: '12px 16px', fontWeight: '700', textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((evt) => {
                    const isPaid = Number(evt.is_paid) === 1;
                    const registered = Number(evt.registered_count) || 0;
                    const checkedIn = Number(evt.checked_in_count) || 0;
                    const capacity = Number(evt.capacity) || 0;

                    return (
                      <tr key={evt.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '12px 16px', width: '90px' }}>
                          <img
                            src={evt.image_url || 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=200&q=80'}
                            alt={evt.title}
                            style={{ width: '80px', height: '52px', objectFit: 'cover', borderRadius: '6px', backgroundColor: '#E2E8F0' }}
                          />
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: '700', color: '#0F172A', fontSize: '13.5px' }}>{evt.title}</div>
                          <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                            <i className="ti ti-calendar" style={{ marginRight: '4px' }}></i>
                            {new Date(evt.event_date).toLocaleString('vi-VN')}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#475569' }}>
                          {evt.location || 'Chưa xác định'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {isPaid ? (
                            <span style={{ color: '#B45309', fontWeight: '700' }}>
                              {Number(evt.price).toLocaleString('vi-VN')} đ
                            </span>
                          ) : (
                            <span style={{ color: '#0D9488', fontWeight: '700' }}>Miễn phí</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div>
                            <strong>{registered}</strong> / {capacity > 0 ? capacity : '∞'} vé
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#16A34A', marginTop: '2px' }}>
                            Đã check-in: <strong>{checkedIn}</strong>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '11.5px',
                            fontWeight: '600',
                            backgroundColor: evt.status === 'upcoming' ? '#E0F2FE' : evt.status === 'ongoing' ? '#DCFCE7' : '#F1F5F9',
                            color: evt.status === 'upcoming' ? '#0369A1' : evt.status === 'ongoing' ? '#15803D' : '#64748B'
                          }}>
                            {evt.status === 'upcoming' ? 'Sắp diễn ra' : evt.status === 'ongoing' ? 'Đang diễn ra' : 'Đã kết thúc'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              onClick={() => handleOpenRegistrationsModal(evt)}
                              title="Xem danh sách người đăng ký vé"
                              style={{
                                padding: '6px 10px',
                                backgroundColor: '#F0FDFA',
                                color: '#0D9488',
                                border: '1px solid #CCFBF1',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              <i className="ti ti-users"></i> Vé ({registered})
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(evt)}
                              title="Sửa sự kiện"
                              style={{
                                padding: '6px 10px',
                                backgroundColor: '#F8FAFC',
                                color: '#334155',
                                border: '1px solid #CBD5E1',
                                borderRadius: '6px',
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              <i className="ti ti-edit"></i>
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(evt.id, evt.title)}
                              title="Xóa sự kiện"
                              style={{
                                padding: '6px 10px',
                                backgroundColor: '#FEF2F2',
                                color: '#DC2626',
                                border: '1px solid #FECACA',
                                borderRadius: '6px',
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              <i className="ti ti-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>

      {/* MODAL THÊM / SỬA SỰ KIỆN */}
      {modalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1.5rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: '#0F172A' }}>
                {editingEventId ? 'Chỉnh sửa sự kiện' : 'Thêm sự kiện mới'}
              </h3>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '18px', color: '#64748B', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitEvent} style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Tiêu đề sự kiện *</label>
                <input
                  type="text"
                  required
                  placeholder="Nhập tên sự kiện..."
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Mô tả ngắn</label>
                <input
                  type="text"
                  placeholder="Tóm tắt ngắn gọn sự kiện..."
                  value={formData.short_desc}
                  onChange={(e) => setFormData(prev => ({ ...prev, short_desc: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>URL Ảnh bìa sự kiện</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={formData.image_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Thời gian bắt đầu *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.event_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, event_date: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Thời gian kết thúc</label>
                  <input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Địa điểm tổ chức</label>
                  <input
                    type="text"
                    placeholder="VD: Trực tuyến / Trung tâm Hội nghị..."
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Sức chứa (vé tối đa)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 = Không giới hạn"
                    value={formData.capacity}
                    onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: '700', cursor: 'pointer', marginTop: '6px' }}>
                    <input
                      type="checkbox"
                      checked={formData.is_paid}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_paid: e.target.checked }))}
                    />
                    Sự kiện có thu phí vé
                  </label>
                </div>
                {formData.is_paid && (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Giá vé (VNĐ)</label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #CBD5E1', background: 'none', cursor: 'pointer', fontSize: '13px' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', backgroundColor: '#0D9488', color: '#fff', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}
                >
                  {submitting ? 'Đang lưu...' : 'Lưu sự kiện'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DANH SÁCH VÉ ĐĂNG KÝ */}
      {registrationsModalOpen && selectedEventForRegs && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1.5rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '880px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: '#0F172A' }}>
                  Danh sách vé đăng ký: {selectedEventForRegs.title}
                </h3>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                  Tổng cộng: <strong>{registrationsList.reduce((acc, cur) => acc + (cur.quantity || 1), 0)} vé</strong> | Đã check-in: <strong>{registrationsList.filter(r => r.checkin_status === 'checked_in').reduce((acc, cur) => acc + (cur.quantity || 1), 0)}</strong>
                </div>
              </div>
              <button onClick={() => setRegistrationsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '18px', color: '#64748B', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>
              {loadingRegs ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#0D9488' }}>Đang tải danh sách vé...</div>
              ) : registrationsList.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>Chưa có lượt đăng ký nào cho sự kiện này.</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#475569' }}>
                        <th style={{ padding: '10px' }}>Khách tham dự</th>
                        <th style={{ padding: '10px' }}>Liên hệ</th>
                        <th style={{ padding: '10px' }}>Mã vé</th>
                        <th style={{ padding: '10px' }}>Số vé</th>
                        <th style={{ padding: '10px' }}>Thanh toán</th>
                        <th style={{ padding: '10px' }}>Check-in</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registrationsList.map(r => (
                        <tr key={r.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '10px' }}>
                            <div style={{ fontWeight: '700' }}>{r.full_name}</div>
                            {r.company && <div style={{ fontSize: '11px', color: '#64748B' }}>{r.company}</div>}
                          </td>
                          <td style={{ padding: '10px' }}>
                            <div>{r.phone}</div>
                            {r.email && <div style={{ fontSize: '11px', color: '#64748B' }}>{r.email}</div>}
                          </td>
                          <td style={{ padding: '10px' }}>
                            <code style={{ background: '#F1F5F9', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>{r.ticket_code}</code>
                          </td>
                          <td style={{ padding: '10px', fontWeight: '700' }}>{r.quantity} vé</td>
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
                          </td>
                          <td style={{ padding: '10px' }}>
                            {r.checkin_status === 'checked_in' ? (
                              <span style={{ color: '#16A34A', fontWeight: '700', fontSize: '11.5px' }}>
                                ✓ Đã vào ({new Date(r.checkin_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })})
                              </span>
                            ) : (
                              <button
                                onClick={() => handleCheckinDirect(r.ticket_code)}
                                style={{
                                  padding: '4px 10px',
                                  backgroundColor: '#0D9488',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontSize: '11.5px',
                                  fontWeight: '600',
                                  cursor: 'pointer'
                                }}
                              >
                                Check-in
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default OrganizerDashboard;
