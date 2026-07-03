import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Sparkle, EnvelopeSimple, Lock } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated && !authLoading) {
    return <Navigate to="/dashboard" replace />;
  }

  const validate = () => {
    const newErrors = {};
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
      await login(formData.email, formData.password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || 'Đăng nhập thất bại';
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

        <h1 className="text-2xl font-bold text-text-primary text-center mb-1">Chào mừng trở lại</h1>
        <p className="text-sm text-text-secondary text-center mb-8">Đăng nhập để quản lý tài chính của bạn</p>

        <form className="flex flex-col" onSubmit={handleSubmit} noValidate>
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
            autoComplete="current-password"
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
              Đăng nhập
            </Button>
          </div>
        </form>

        <p className="text-sm text-text-secondary text-center mt-6">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-accent-green font-medium hover:text-accent-green-hover hover:underline">
            Đăng ký
          </Link>
        </p>
      </div>
    </div>
  );
}
