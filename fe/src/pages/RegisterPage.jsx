import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Sparkle, User, EnvelopeSimple, Lock, LockKey } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isAuthenticated, loading: authLoading } = useAuth();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated && !authLoading) {
    return <Navigate to="/dashboard" replace />;
  }

  const validate = () => {
    const newErrors = {};
    if (!formData.fullname.trim()) {
      newErrors.fullname = 'Họ và tên không được để trống';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email không được để trống';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    if (!formData.password) {
      newErrors.password = 'Mật khẩu không được để trống';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (errors[id]) {
      setErrors((prev) => ({ ...prev, [id]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await register(formData.fullname, formData.email, formData.password);
      addToast('Đăng ký thành công!', 'success');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || 'Đăng ký thất bại';
      addToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-dark p-6 animate-fade-in">
      <div className="w-full max-w-[420px] bg-secondary-dark border border-border-dark p-8 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-center gap-2 text-accent-green font-bold text-2xl mb-8">
          <div className="w-10 h-10 rounded-xl bg-accent-subtle flex items-center justify-center text-accent-green">
            <Sparkle size={24} weight="fill" />
          </div>
          <span>SmartSpend AI</span>
        </div>

        <h1 className="text-2xl font-bold text-text-primary text-center mb-1">Tạo tài khoản</h1>
        <p className="text-sm text-text-secondary text-center mb-8">Bắt đầu quản lý chi tiêu thông minh</p>

        <form className="flex flex-col" onSubmit={handleSubmit} noValidate>
          <Input
            id="fullname"
            type="text"
            label="Họ và tên"
            icon={<User size={18} />}
            value={formData.fullname}
            onChange={handleChange}
            error={errors.fullname}
            autoComplete="name"
          />

          <Input
            id="email"
            type="email"
            label="Email"
            icon={<EnvelopeSimple size={18} />}
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            autoComplete="email"
          />

          <Input
            id="password"
            type="password"
            label="Mật khẩu"
            icon={<Lock size={18} />}
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            autoComplete="new-password"
          />

          <Input
            id="confirmPassword"
            type="password"
            label="Xác nhận mật khẩu"
            icon={<LockKey size={18} />}
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            autoComplete="new-password"
          />

          <div className="mt-6">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={submitting}
              disabled={submitting}
            >
              Đăng ký
            </Button>
          </div>
        </form>

        <p className="text-sm text-text-secondary text-center mt-6">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-accent-green font-medium hover:text-accent-green-hover hover:underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
