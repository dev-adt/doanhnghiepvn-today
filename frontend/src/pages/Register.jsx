import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useTranslation } from '../contexts/LanguageContext';

export const Register = () => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    industry: '',
    size: '',
    tax_code: '',
    city: '',
    address: '',
    zip: '',
    social: '',
    description: '',
    contact_name: '',
    contact_pos: '',
    email: '',
    phone: '',
    preferred_login: 'email',
    goal: '',
    referral: '',
    password: '',
    tier: 'Silver'
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const getPrimaryUsername = () => {
    if (formData.preferred_login === 'phone' && formData.phone) {
      return formData.phone;
    }
    return formData.email || formData.phone || '';
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    // Map r-field to key in formData
    const key = id.replace('r-', '');
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSelectTier = (tierName) => {
    setFormData(prev => ({
      ...prev,
      tier: tierName
    }));
  };

  const validateStep1 = () => {
    if (!formData.name) return t('err_fill_company_name');
    if (!formData.industry) return t('err_select_industry');
    if (!formData.size) return t('err_select_scale');
    if (!formData.tax_code) return t('err_fill_tax_code');
    if (!formData.city) return t('err_select_city');
    if (!formData.address) return t('err_fill_address');
    if (!formData.description) return t('err_fill_description');
    return null;
  };

  const validateStep2 = () => {
    if (!formData.contact_name) return t('err_fill_rep_name');
    if (!formData.contact_pos) return t('err_fill_rep_position');
    if (!formData.email && !formData.phone) {
      return t('currentLang') === 'vi' 
        ? 'Vui lòng nhập Email hoặc Số điện thoại để làm tài khoản đăng nhập.' 
        : 'Please enter at least an Email or Phone number for your login account.';
    }
    return null;
  };

  const validateStep3 = () => {
    if (!formData.password) return t('err_fill_password');
    if (formData.password.length < 8) return t('err_password_min_8');
    if (formData.password !== confirmPassword) {
      return t('currentLang') === 'vi' ? 'Mật khẩu xác nhận không khớp.' : 'Passwords do not match.';
    }
    return null;
  };

  const handleNext = (nextStep) => {
    setError('');
    if (step === 1) {
      const err = validateStep1();
      if (err) {
        setError(err);
        return;
      }
    } else if (step === 2) {
      const err = validateStep2();
      if (err) {
        setError(err);
        return;
      }
    }
    setStep(nextStep);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const err = validateStep3();
    if (err) {
      setError(err);
      return;
    }

    setSubmitting(true);

    try {
      // Chuẩn bị dữ liệu gửi lên backend
      const payload = {
        ...formData,
        license: formData.tax_code // Dùng tax_code thay thế giấy phép nếu cần
      };

      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || t('error_occurred'));
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message || t('error_occurred'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="public-body">
      <Navbar />

      <div className="register-split-layout">
        
        {/* Left Side Sidebar */}
        <div className="register-sidebar">
          <div className="circular-text-wrap">
            <svg className="circular-svg" viewBox="0 0 300 300">
              <path id="textCircle" d="M 150,150 m -115,0 a 115,115 0 1,1 230,0 a 115,115 0 1,1 -230,0" fill="none" />
              <text fill="rgba(255, 255, 255, 0.75)" fontSize="9.5" fontFamily="var(--font-title)" fontWeight="600" letterSpacing="0.065em">
                <textPath href="#textCircle">
                  {t('register_sidebar_circular_text')}
                </textPath>
              </text>
            </svg>
            <img src="/images/hero_network.png" className="circular-inner-img" alt="Digital connections" />
          </div>
          
          <div className="register-sidebar-text">
            <h2>DoanhNghiepVN.today Ecosystem</h2>
            <p>{t('register_sidebar_desc')}</p>
          </div>
        </div>

        {/* Right Side Form Wizard Panel */}
        <div className="register-form-panel" style={{ textAlign: 'left' }}>
          
          {!success ? (
            <>
              <div className="reg-wizard-header">
                <div style={{ fontFamily: 'var(--font-title)', fontSize: '22px', fontWeight: 700, color: '#0F172A' }}>{t('register_card_title')}</div>
                
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div className={`reg-step-item ${step === 1 ? 'active' : step > 1 ? 'completed' : ''}`}>
                    <div className="reg-step-num">1</div>
                    <span>{t('step_company')}</span>
                  </div>
                  <div className={`reg-step-item ${step === 2 ? 'active' : step > 2 ? 'completed' : ''}`}>
                    <div className="reg-step-num">2</div>
                    <span>{t('step_representative')}</span>
                  </div>
                  <div className={`reg-step-item ${step === 3 ? 'active' : ''}`}>
                    <div className="reg-step-num">3</div>
                    <span>{t('step_account')}</span>
                  </div>
                </div>
              </div>

              {error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#B91C1C', padding: '10px 14px', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="ti ti-circle-x" style={{ fontSize: '16px' }}></i>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleRegisterSubmit}>
                
                {/* STEP 1: Thông tin Doanh nghiệp */}
                {step === 1 && (
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: '#1E293B', marginBottom: '1.25rem' }}><i className="ti ti-building" style={{ color: 'var(--primary)' }}></i> {t('step_1_title')}</div>
                    
                    <div className="fg" style={{ marginBottom: '1.25rem' }}>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px', display: 'block' }}>{t('label_company_name')} <span style={{ color: 'var(--rose)' }}>*</span></label>
                      <input type="text" id="r-name" value={formData.name} onChange={handleInputChange} placeholder={t('placeholder_company_name')} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #D8E2EF', fontSize: '13px', outline: 'none' }} />
                    </div>
                    
                    <div className="fg" style={{ marginBottom: '1.25rem' }}>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px', display: 'block' }}>{t('label_website')}</label>
                      <input type="text" id="r-website" value={formData.website} onChange={handleInputChange} placeholder={t('placeholder_website')} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #D8E2EF', fontSize: '13px', outline: 'none' }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                      <div className="fg">
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px', display: 'block' }}>{t('label_industry')} <span style={{ color: 'var(--rose)' }}>*</span></label>
                        <input 
                          type="text" 
                          id="r-industry" 
                          list="industries-list" 
                          value={formData.industry} 
                          onChange={handleInputChange} 
                          placeholder={t('placeholder_industry')}
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #D8E2EF', fontSize: '13px', outline: 'none', backgroundColor: '#fff' }} 
                        />
                        <datalist id="industries-list">
                          <option value="Công nghệ thông tin" />
                          <option value="Xuất nhập khẩu" />
                          <option value="Bất động sản" />
                          <option value="Sản xuất & Chế biến" />
                          <option value="Dịch vụ tài chính" />
                          <option value="Du lịch & Khách sạn" />
                          <option value="Giáo dục & Đào tạo" />
                          <option value="Y tế & Sức khỏe" />
                          <option value="Nông nghiệp" />
                          <option value="Xây dựng" />
                          <option value="Thời trang & May mặc" />
                          <option value="Logistics & Vận tải" />
                          <option value="Năng lượng & Môi trường" />
                          <option value="Thực phẩm & Đồ uống" />
                        </datalist>
                      </div>
                      <div className="fg">
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px', display: 'block' }}>{t('label_employee_scale')} <span style={{ color: 'var(--rose)' }}>*</span></label>
                        <select id="r-size" value={formData.size} onChange={handleInputChange} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #D8E2EF', fontSize: '13px', outline: 'none', backgroundColor: '#fff' }}>
                          <option value="">{t('placeholder_select_scale')}</option>
                          <option value="Dưới 10 người">{t('scale_under_10')}</option>
                          <option value="10 – 50 người">{t('scale_10_50')}</option>
                          <option value="50 – 200 người">{t('scale_50_200')}</option>
                          <option value="200 – 500 người">{t('scale_200_500')}</option>
                          <option value="Trên 500 người">{t('scale_over_500')}</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                      <div className="fg">
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px', display: 'block' }}>{t('label_tax_code')} <span style={{ color: 'var(--rose)' }}>*</span></label>
                        <input type="text" id="r-tax_code" value={formData.tax_code} onChange={handleInputChange} placeholder={t('placeholder_tax_code')} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #D8E2EF', fontSize: '13px', outline: 'none' }} />
                      </div>
                      <div className="fg">
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px', display: 'block' }}>{t('label_city')} <span style={{ color: 'var(--rose)' }}>*</span></label>
                        <input 
                          type="text" 
                          id="r-city" 
                          list="cities-list" 
                          value={formData.city} 
                          onChange={handleInputChange} 
                          placeholder={t('search_members_placeholder')} 
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #D8E2EF', fontSize: '13px', outline: 'none', backgroundColor: '#fff' }}
                        />
                        <datalist id="cities-list">
                          <option value="Hà Nội" />
                          <option value="TP. Hồ Chí Minh" />
                          <option value="Đà Nẵng" />
                          <option value="Bình Dương" />
                          <option value="Đồng Nai" />
                          <option value="Hải Phòng" />
                          <option value="Cần Thơ" />
                          <option value="An Giang" />
                          <option value="Bà Rịa - Vũng Tàu" />
                          <option value="Bắc Giang" />
                          <option value="Bắc Kạn" />
                          <option value="Bạc Liêu" />
                          <option value="Bắc Ninh" />
                          <option value="Bến Tre" />
                          <option value="Bình Định" />
                          <option value="Bình Phước" />
                          <option value="Bình Thuận" />
                          <option value="Cà Mau" />
                          <option value="Cao Bằng" />
                          <option value="Đắk Lắk" />
                          <option value="Đắk Nông" />
                          <option value="Điện Biên" />
                          <option value="Đồng Tháp" />
                          <option value="Gia Lai" />
                          <option value="Hà Giang" />
                          <option value="Hà Nam" />
                          <option value="Hà Tĩnh" />
                          <option value="Hải Dương" />
                          <option value="Hậu Giang" />
                          <option value="Hòa Bình" />
                          <option value="Hưng Yên" />
                          <option value="Khánh Hòa" />
                          <option value="Kiên Giang" />
                          <option value="Kon Tum" />
                          <option value="Lai Châu" />
                          <option value="Lâm Đồng" />
                          <option value="Lạng Sơn" />
                          <option value="Lào Cai" />
                          <option value="Long An" />
                          <option value="Nam Định" />
                          <option value="Nghệ An" />
                          <option value="Ninh Bình" />
                          <option value="Ninh Thuận" />
                          <option value="Phú Thọ" />
                          <option value="Phú Yên" />
                          <option value="Quảng Bình" />
                          <option value="Quảng Nam" />
                          <option value="Quảng Ngãi" />
                          <option value="Quảng Ninh" />
                          <option value="Quảng Trị" />
                          <option value="Sóc Trăng" />
                          <option value="Sơn La" />
                          <option value="Tây Ninh" />
                          <option value="Thái Bình" />
                          <option value="Thái Nguyên" />
                          <option value="Thanh Hóa" />
                          <option value="Thừa Thiên Huế" />
                          <option value="Tiền Giang" />
                          <option value="Trà Vinh" />
                          <option value="Tuyên Quang" />
                          <option value="Vĩnh Long" />
                          <option value="Vĩnh Phúc" />
                          <option value="Yên Bái" />
                        </datalist>
                      </div>
                    </div>

                    <div className="fg" style={{ marginBottom: '1.25rem' }}>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px', display: 'block' }}>{t('label_address')} <span style={{ color: 'var(--rose)' }}>*</span></label>
                      <input type="text" id="r-address" value={formData.address} onChange={handleInputChange} placeholder="Ví dụ: 45 Lý Thường Kiệt, Hoàn Kiếm, Hà Nội" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #D8E2EF', fontSize: '13px', outline: 'none' }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                      <div className="fg">
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px', display: 'block' }}>{t('currentLang') === 'vi' ? 'Mã Bưu điện (ZIP code)' : 'ZIP / Postal Code'}</label>
                        <input type="text" id="r-zip" value={formData.zip} onChange={handleInputChange} placeholder="Ví dụ: 100000" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #D8E2EF', fontSize: '13px', outline: 'none' }} />
                      </div>
                      <div className="fg">
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px', display: 'block' }}>{t('label_social_media')}</label>
                        <input type="text" id="r-social" value={formData.social} onChange={handleInputChange} placeholder="facebook.com/company" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #D8E2EF', fontSize: '13px', outline: 'none' }} />
                      </div>
                    </div>

                    <div className="fg" style={{ marginBottom: '1.5rem' }}>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px', display: 'block' }}>{t('label_description')} <span style={{ color: 'var(--rose)' }}>*</span></label>
                      <textarea id="r-description" rows="3" value={formData.description} onChange={handleInputChange} placeholder={t('placeholder_description')} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #D8E2EF', fontSize: '13px', outline: 'none', resize: 'vertical' }}></textarea>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button type="button" className="btn btn-primary" onClick={() => handleNext(2)}>{t('btn_continue')} <i className="ti ti-chevron-right"></i></button>
                    </div>
                  </div>
                )}

                {/* STEP 2: Người đại diện */}
                {step === 2 && (
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: '#1E293B', marginBottom: '1.25rem' }}><i className="ti ti-user" style={{ color: 'var(--primary)' }}></i> {t('step_2_title')}</div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                      <div className="fg">
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px', display: 'block' }}>{t('label_contact_person')} <span style={{ color: 'var(--rose)' }}>*</span></label>
                        <input type="text" id="r-contact_name" value={formData.contact_name} onChange={handleInputChange} placeholder={t('placeholder_rep_name')} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #D8E2EF', fontSize: '13px', outline: 'none' }} />
                      </div>
                      <div className="fg">
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px', display: 'block' }}>{t('label_contact_position')} <span style={{ color: 'var(--rose)' }}>*</span></label>
                        <input type="text" id="r-contact_pos" value={formData.contact_pos} onChange={handleInputChange} placeholder={t('placeholder_rep_position')} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #D8E2EF', fontSize: '13px', outline: 'none' }} />
                      </div>
                    </div>

                    {/* Khung nhập Tài khoản đăng nhập (Email hoặc SĐT) */}
                    <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px', marginBottom: '1.25rem' }}>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0F172A', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className="ti ti-key" style={{ color: 'var(--primary)' }}></i>
                        Tài khoản đăng nhập (Nhập Email hoặc Số điện thoại) <span style={{ color: 'var(--rose)' }}>*</span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                        <div className="fg">
                          <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px', display: 'block' }}>
                            Email đăng nhập (Mặc định ưu tiên)
                          </label>
                          <input type="email" id="r-email" value={formData.email} onChange={handleInputChange} placeholder="email@company.vn (Tùy chọn)..." style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #D8E2EF', fontSize: '13px', outline: 'none', backgroundColor: '#fff' }} />
                        </div>
                        <div className="fg">
                          <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px', display: 'block' }}>
                            Số điện thoại
                          </label>
                          <input type="tel" id="r-phone" value={formData.phone} onChange={handleInputChange} placeholder="Nhập số điện thoại di động..." style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #D8E2EF', fontSize: '13px', outline: 'none', backgroundColor: '#fff' }} />
                        </div>
                      </div>

                      {/* Bộ chọn tài khoản đăng nhập chính nếu người dùng nhập cả 2 */}
                      {formData.email && formData.phone && (
                        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                            Chọn tài khoản làm Username đăng nhập chính:
                          </span>
                          <div style={{ display: 'flex', gap: '16px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 600, cursor: 'pointer', color: formData.preferred_login !== 'phone' ? 'var(--primary)' : '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <input 
                                type="radio" 
                                name="pref_login" 
                                checked={formData.preferred_login !== 'phone'} 
                                onChange={() => setFormData(prev => ({ ...prev, preferred_login: 'email' }))} 
                              />
                              Email ({formData.email}) ★ Ưu tiên
                            </label>
                            <label style={{ fontSize: '12px', fontWeight: 600, cursor: 'pointer', color: formData.preferred_login === 'phone' ? 'var(--primary)' : '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <input 
                                type="radio" 
                                name="pref_login" 
                                checked={formData.preferred_login === 'phone'} 
                                onChange={() => setFormData(prev => ({ ...prev, preferred_login: 'phone' }))} 
                              />
                              Số điện thoại ({formData.phone})
                            </label>
                          </div>
                        </div>
                      )}
                      
                      <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '8px' }}>
                        💡 Hệ thống mặc định ưu tiên Email làm tài khoản đăng nhập chính. Nếu nhập cả Email và SĐT, bạn có thể tự chọn 1 trong 2 làm Username chính.
                      </div>
                    </div>

                    <div className="fg" style={{ marginBottom: '1.25rem' }}>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px', display: 'block' }}>{t('label_joining_goal')}</label>
                      <input type="text" id="r-goal" value={formData.goal} onChange={handleInputChange} placeholder={t('placeholder_joining_goal')} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #D8E2EF', fontSize: '13px', outline: 'none' }} />
                    </div>

                    <div className="fg" style={{ marginBottom: '1.5rem' }}>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px', display: 'block' }}>{t('label_referral')}</label>
                      <select id="r-referral" value={formData.referral} onChange={handleInputChange} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #D8E2EF', fontSize: '13px', outline: 'none', backgroundColor: '#fff' }}>
                        <option value="">{t('placeholder_referral')}</option>
                        <option value="Mạng xã hội (Facebook, LinkedIn...)">Mạng xã hội (Facebook, LinkedIn...)</option>
                        <option value="Báo chí, truyền thông">Báo chí, truyền thông</option>
                        <option value="Được hội viên DoanhNghiepVN.today giới thiệu">Được hội viên DoanhNghiepVN.today giới thiệu</option>
                        <option value="Tìm kiếm Google">Tìm kiếm Google</option>
                        <option value="Hội thảo, sự kiện">Hội thảo, sự kiện</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <button type="button" className="btn" onClick={() => setStep(1)}><i className="ti ti-chevron-left"></i> {t('btn_back')}</button>
                      <button type="button" className="btn btn-primary" onClick={() => handleNext(3)}>{t('btn_continue')} <i className="ti ti-chevron-right"></i></button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Tài khoản & Chọn Gói */}
                {step === 3 && (
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: '#1E293B', marginBottom: '1.25rem' }}><i className="ti ti-lock" style={{ color: 'var(--primary)' }}></i> {t('step_3_title')}</div>

                    <div className="fg" style={{ marginBottom: '1.25rem' }}>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px', display: 'block' }}>
                        Tài khoản đăng nhập (Username) <span style={{ color: 'var(--rose)' }}>*</span>
                      </label>
                      
                      {formData.email && formData.phone ? (
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, preferred_login: 'email' }))}
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: formData.preferred_login !== 'phone' ? '2px solid var(--primary)' : '1px solid #CBD5E1',
                              backgroundColor: formData.preferred_login !== 'phone' ? '#E0F2FE' : '#FFFFFF',
                              color: formData.preferred_login !== 'phone' ? '#0369A1' : '#475569',
                              fontWeight: 700,
                              fontSize: '12.5px',
                              cursor: 'pointer'
                            }}
                          >
                            ✉️ Email ({formData.email}) ★ Ưu tiên
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, preferred_login: 'phone' }))}
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: formData.preferred_login === 'phone' ? '2px solid var(--primary)' : '1px solid #CBD5E1',
                              backgroundColor: formData.preferred_login === 'phone' ? '#E0F2FE' : '#FFFFFF',
                              color: formData.preferred_login === 'phone' ? '#0369A1' : '#475569',
                              fontWeight: 700,
                              fontSize: '12.5px',
                              cursor: 'pointer'
                            }}
                          >
                            📞 Số điện thoại ({formData.phone})
                          </button>
                        </div>
                      ) : (
                        <input type="text" value={getPrimaryUsername()} disabled style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #D8E2EF', fontSize: '13px', backgroundColor: '#F1F5F9', color: '#0F172A', fontWeight: 600 }} />
                      )}

                      <div style={{ fontSize: '11px', color: 'var(--text-light-muted)', marginTop: '4px' }}>
                        💡 Bạn sẽ sử dụng <strong>{getPrimaryUsername()}</strong> và mật khẩu bên dưới để đăng nhập vào hệ thống.
                      </div>
                    </div>

                    <div className="fg" style={{ marginBottom: '1.25rem' }}>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px', display: 'block' }}>{t('label_setup_password')} <span style={{ color: 'var(--rose)' }}>*</span></label>
                      <div style={{ position: 'relative' }}>
                        <input 
                          type={showPassword ? 'text' : 'password'} 
                          id="r-password" 
                          value={formData.password} 
                          onChange={handleInputChange} 
                          placeholder={t('placeholder_setup_password')} 
                          style={{ width: '100%', padding: '9px 40px 9px 12px', borderRadius: '8px', border: '1px solid #D8E2EF', fontSize: '13px', outline: 'none' }} 
                        />
                        <button 
                          type="button" 
                          onClick={() => setShowPassword(!showPassword)} 
                          style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', outline: 'none', display: 'flex', alignItems: 'center', color: '#64748B' }}
                        >
                          <i className={showPassword ? "ti ti-eye-off" : "ti ti-eye"} style={{ fontSize: '16px' }}></i>
                        </button>
                      </div>
                    </div>

                    <div className="fg" style={{ marginBottom: '1.5rem' }}>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px', display: 'block' }}>
                        {t('currentLang') === 'vi' ? 'Xác nhận mật khẩu' : 'Confirm Password'} <span style={{ color: 'var(--rose)' }}>*</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input 
                          type={showPassword ? 'text' : 'password'} 
                          id="r-confirm-password" 
                          value={confirmPassword} 
                          onChange={(e) => setConfirmPassword(e.target.value)} 
                          placeholder={t('currentLang') === 'vi' ? 'Nhập lại mật khẩu...' : 'Re-enter password...'} 
                          style={{ width: '100%', padding: '9px 40px 9px 12px', borderRadius: '8px', border: '1px solid #D8E2EF', fontSize: '13px', outline: 'none' }} 
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '10px', display: 'block' }}>{t('label_choose_tier')}</label>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                        <div 
                          onClick={() => handleSelectTier('Silver')}
                          style={{
                            border: formData.tier === 'Silver' ? '2px solid var(--primary)' : '1px solid #D8E2EF',
                            borderRadius: '10px',
                            padding: '12px',
                            cursor: 'pointer',
                            textAlign: 'center',
                            backgroundColor: formData.tier === 'Silver' ? 'rgba(30,136,229,0.04)' : '#fff',
                            position: 'relative'
                          }}
                        >
                          <span style={{ position: 'absolute', top: '-8px', right: '8px', fontSize: '9px', background: '#10B981', color: '#fff', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                            TỰ ĐỘNG DUYỆT
                          </span>
                          <div style={{ fontWeight: '700', fontSize: '13px', color: '#0F172A' }}>🪙 {t('tier_silver')}</div>
                          <div style={{ fontSize: '11px', color: '#16A34A', fontWeight: 600, marginTop: '4px' }}>{t('price_free')} · Kích hoạt ngay</div>
                        </div>

                        <div 
                          onClick={() => handleSelectTier('Gold')}
                          style={{
                            border: formData.tier === 'Gold' ? '2px solid var(--amber)' : '1px solid #D8E2EF',
                            borderRadius: '10px',
                            padding: '12px',
                            cursor: 'pointer',
                            textAlign: 'center',
                            backgroundColor: formData.tier === 'Gold' ? 'rgba(245,158,11,0.03)' : '#fff'
                          }}
                        >
                          <div style={{ fontWeight: '700', fontSize: '13px', color: '#0F172A' }}>🏅 {t('tier_gold')}</div>
                          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>{t('price_gold_val')}/{t('pricing_per_year')}</div>
                        </div>

                        <div 
                          onClick={() => handleSelectTier('Platinum')}
                          style={{
                            border: formData.tier === 'Platinum' ? '2px solid var(--primary-light)' : '1px solid #D8E2EF',
                            borderRadius: '10px',
                            padding: '12px',
                            cursor: 'pointer',
                            textAlign: 'center',
                            backgroundColor: formData.tier === 'Platinum' ? 'rgba(99,102,241,0.03)' : '#fff'
                          }}
                        >
                          <div style={{ fontWeight: '700', fontSize: '13px', color: '#0F172A' }}>💎 {t('tier_platinum')}</div>
                          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>{t('price_platinum_val')}/{t('pricing_per_year')}</div>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <button type="button" className="btn" onClick={() => setStep(2)}><i className="ti ti-chevron-left"></i> {t('btn_back')}</button>
                      <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? (
                          <>
                            <i className="ti ti-loader animate-spin"></i> {t('btn_registering')}
                          </>
                        ) : (
                          <>
                            <i className="ti ti-circle-check"></i> {t('btn_register')}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 2rem' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(16,185,129,0.1)', color: 'var(--emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 1.5rem' }}>
                <i className="ti ti-circle-check"></i>
              </div>
              <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '22px', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>
                {formData.tier === 'Silver' ? 'Kích hoạt tài khoản thành công!' : t('register_success_title')}
              </h2>
              <p style={{ fontSize: '13.5px', color: '#64748B', lineHeight: '1.6', maxWidth: '460px', margin: '0 auto 1.5rem' }}>
                {formData.tier === 'Silver'
                  ? `Tài khoản Hội viên Bạc (Miễn phí) của doanh nghiệp ${formData.name} đã được HỆ THỐNG TỰ ĐỘNG XÉT DUYỆT VÀ KÍCH HOẠT THÀNH CÔNG! Bạn có thể đăng nhập ngay bây giờ để bắt đầu kết nối giao thương.`
                  : t('register_success_desc')(formData.name, formData.email || formData.phone)}
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <Link to="/" className="btn" style={{ textDecoration: 'none' }}>{t('btn_back_home')}</Link>
                <Link to="/login" className="btn btn-primary" style={{ textDecoration: 'none' }}><i className="ti ti-login"></i> {t('login_now')}</Link>
              </div>
            </div>
          )}

        </div>

      </div>

      <Footer />
    </div>
  );
};
export default Register;
