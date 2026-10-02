import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AdminLayout from '../components/AdminLayout';

export const AdminOrganizers = () => {
  const { getAuthHeaders } = useAuth();

  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOrgId, setEditingOrgId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    phone: '',
    email: '',
    status: 'active'
  });
  const [submitting, setSubmitting] = useState(false);

  const loadOrganizers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/organizers', { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Không thể tải danh sách Ban tổ chức.');
      const data = await res.json();
      if (data.success) {
        setOrganizers(data.data || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrganizers();
  }, []);

  const handleOpenAddModal = () => {
    setEditingOrgId(null);
    setFormData({
      name: '',
      username: '',
      password: '',
      phone: '',
      email: '',
      status: 'active'
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (org) => {
    setEditingOrgId(org.id);
    setFormData({
      name: org.name || '',
      username: org.username || '',
      password: '', // Bỏ trống nếu không đổi
      phone: org.phone || '',
      email: org.email || '',
      status: org.status || 'active'
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.username.trim()) {
      alert('Vui lòng điền Tên và Tên đăng nhập.');
      return;
    }

    if (!editingOrgId && !formData.password.trim()) {
      alert('Vui lòng nhập Mật khẩu cho tài khoản mới.');
      return;
    }

    setSubmitting(true);
    try {
      const url = editingOrgId ? `/api/admin/organizers/${editingOrgId}` : '/api/admin/organizers';
      const method = editingOrgId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Có lỗi xảy ra.');
      }

      setModalOpen(false);
      loadOrganizers();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản Ban tổ chức "${name}" không?`)) return;

    try {
      const res = await fetch(`/api/admin/organizers/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Không thể xóa tài khoản.');
      }
      loadOrganizers();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <AdminLayout title="Quản lý Ban tổ chức Sự kiện">
      <div style={{ padding: '0.5rem 0' }}>
        
        {/* Header Section */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="ti ti-id-badge-2" style={{ color: '#0D9488' }}></i>
              Tài khoản Ban tổ chức Sự kiện
            </h2>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0' }}>
              Tạo và phân quyền tài khoản chuyên trách Quản lý sự kiện, theo dõi danh sách đăng ký và Check-in vé.
            </p>
          </div>

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
            <i className="ti ti-user-plus"></i>
            Thêm Ban tổ chức
          </button>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#FEF2F2',
            color: '#B91C1C',
            borderRadius: '8px',
            fontSize: '13px',
            marginBottom: '1.5rem',
            border: '1px solid #FECACA'
          }}>
            {error}
          </div>
        )}

        {/* Danh sách Ban tổ chức */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          {loading ? (
            <div style={{ padding: '3.5rem', textAlign: 'center', color: '#0D9488' }}>
              <i className="ti ti-loader animate-spin" style={{ fontSize: '24px', display: 'block', margin: '0 auto 8px' }}></i>
              Đang tải danh sách tài khoản...
            </div>
          ) : organizers.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B', fontSize: '13.5px' }}>
              Chưa có tài khoản Ban tổ chức nào. Nhấn <strong>Thêm Ban tổ chức</strong> để khởi tạo.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
                    <th style={{ padding: '12px 16px', fontWeight: '700' }}>Tên Ban tổ chức / Đại diện</th>
                    <th style={{ padding: '12px 16px', fontWeight: '700' }}>Tên đăng nhập</th>
                    <th style={{ padding: '12px 16px', fontWeight: '700' }}>Số điện thoại</th>
                    <th style={{ padding: '12px 16px', fontWeight: '700' }}>Email</th>
                    <th style={{ padding: '12px 16px', fontWeight: '700' }}>Trạng thái</th>
                    <th style={{ padding: '12px 16px', fontWeight: '700' }}>Ngày tạo</th>
                    <th style={{ padding: '12px 16px', fontWeight: '700', textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {organizers.map((org) => (
                    <tr key={org.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: '700', color: '#0F172A' }}>
                        {org.name}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <code style={{ backgroundColor: '#F1F5F9', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>
                          {org.username}
                        </code>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>
                        {org.phone || '—'}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>
                        {org.email || '—'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '11.5px',
                          fontWeight: '700',
                          backgroundColor: org.status === 'active' ? '#DCFCE7' : '#FEF2F2',
                          color: org.status === 'active' ? '#15803D' : '#B91C1C'
                        }}>
                          {org.status === 'active' ? 'Hoạt động' : 'Tạm khóa'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748B', fontSize: '12px' }}>
                        {org.created_at ? new Date(org.created_at).toLocaleDateString('vi-VN') : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            onClick={() => handleOpenEditModal(org)}
                            title="Chỉnh sửa"
                            style={{
                              padding: '5px 10px',
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
                            onClick={() => handleDelete(org.id, org.name)}
                            title="Xóa"
                            style={{
                              padding: '5px 10px',
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* MODAL THÊM / SỬA BAN TỔ CHỨC */}
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
              maxWidth: '500px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
            }}>
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: '#0F172A' }}>
                  {editingOrgId ? 'Chỉnh sửa tài khoản Ban tổ chức' : 'Thêm tài khoản Ban tổ chức'}
                </h3>
                <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '18px', color: '#64748B', cursor: 'pointer' }}>
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Tên Ban tổ chức / Người đại diện *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Ban tổ chức Hội thảo Doanh nghiệp..."
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Tên đăng nhập (Username) *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: bantochuc, eventadmin..."
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>
                    {editingOrgId ? 'Mật khẩu mới (bỏ trống nếu giữ nguyên)' : 'Mật khẩu *'}
                  </label>
                  <input
                    type="password"
                    placeholder={editingOrgId ? '••••••••' : 'Nhập mật khẩu (tối thiểu 6 ký tự)...'}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Số điện thoại</label>
                    <input
                      type="text"
                      placeholder="09..."
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Email</label>
                    <input
                      type="email"
                      placeholder="event@..."
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Trạng thái tài khoản</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  >
                    <option value="active">Hoạt động (Được phép đăng nhập)</option>
                    <option value="inactive">Tạm khóa (Vô hiệu hóa đăng nhập)</option>
                  </select>
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
                    {submitting ? 'Đang lưu...' : 'Lưu tài khoản'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};

export default AdminOrganizers;
