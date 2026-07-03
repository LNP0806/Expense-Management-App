import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import { budgetsApi } from '../api/budgets.api';
import { categoriesApi } from '../api/categories.api';
import { useToast } from '../context/ToastContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Card from '../components/common/Card';

export default function CreateBudgetPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const getFirstDayOfMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  };

  const getLastDayOfMonth = () => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  };

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [startDate, setStartDate] = useState(getFirstDayOfMonth());
  const [endDate, setEndDate] = useState(getLastDayOfMonth());
  const [description, setDescription] = useState('');

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    async function loadCategories() {
      try {
        setLoadingCategories(true);
        const res = await categoriesApi.getAll({ limit: 100 });
        if (res.data.success) {
          const rawData = res.data.data;
          const list = Array.isArray(rawData) ? rawData : (rawData?.data || []);
          setCategories(list.map(c => ({ value: c.id, label: c.name })));
        }
      } catch (err) {
        console.error('Error load categories:', err);
        addToast('Lỗi khi tải danh mục', 'error');
      } finally {
        setLoadingCategories(false);
      }
    }
    loadCategories();
  }, [addToast]);

  const validate = () => {
    const newErrors = {};
    if (!title.trim()) {
      newErrors.title = 'Vui lòng nhập tiêu đề ngân sách';
    }
    if (!amount || Number(amount) <= 0) {
      newErrors.amount = 'Vui lòng nhập số tiền ngân sách hợp lệ';
    }
    if (!startDate) {
      newErrors.startDate = 'Vui lòng chọn ngày bắt đầu';
    }
    if (!endDate) {
      newErrors.endDate = 'Vui lòng chọn ngày kết thúc';
    }
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      newErrors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const budgetData = {
        title: title.trim(),
        amount: Number(amount),
        start_date: startDate,
        end_date: endDate,
      };

      if (description && description.trim()) {
        budgetData.description = description.trim();
      }

      if (categoryId) {
        budgetData.category_id = categoryId;
      }

      await budgetsApi.create(budgetData);
      addToast('Tạo ngân sách thành công!', 'success');
      navigate('/budgets');
    } catch (err) {
      console.error('Error creating budget:', err);
      const msg = err?.response?.data?.message || err?.message || 'Lỗi khi tạo ngân sách';
      addToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-[600px] mx-auto flex flex-col gap-6 pb-24 md:pb-8 animate-fade-in">
      <header className="flex items-center justify-between">
        <button 
          className="bg-transparent border-none text-text-secondary cursor-pointer flex p-2 rounded-lg transition-colors duration-150 hover:bg-tertiary-dark hover:text-text-primary" 
          onClick={() => navigate(-1)} 
          aria-label="Quay lại"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-text-primary">Tạo ngân sách</h1>
        <div className="w-9" />
      </header>

      <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
        <Card padding="lg" className="flex flex-col gap-4">
          <Input
            id="title"
            label="Tiêu đề ngân sách"
            placeholder="ví dụ: Ăn uống tháng 7, Mua sắm..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={errors.title}
            required
          />

          <Input
            id="amount"
            type="number"
            label="Số tiền hạn mức"
            placeholder="Nhập số tiền..."
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            error={errors.amount}
            required
          />

          <Select
            id="categoryId"
            label="Danh mục áp dụng (tùy chọn)"
            options={categories}
            placeholder={loadingCategories ? 'Đang tải danh mục...' : 'Áp dụng cho tất cả'}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            error={errors.categoryId}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="startDate"
              type="date"
              label="Ngày bắt đầu"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              error={errors.startDate}
              required
            />

            <Input
              id="endDate"
              type="date"
              label="Ngày kết thúc"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              error={errors.endDate}
              required
            />
          </div>

          <div className="flex flex-col gap-1 text-left mb-2">
            <label className="text-[11px] font-medium text-text-secondary uppercase tracking-wider" htmlFor="description">
              Mô tả (tùy chọn)
            </label>
            <textarea
              id="description"
              className="w-full bg-secondary-dark border border-border-dark text-text-primary font-sans text-base px-4 py-3 rounded-xl transition-all duration-150 min-h-[80px] focus:outline-hidden focus:border-accent-green focus:bg-tertiary-dark focus:ring-1 focus:ring-accent-green resize-y"
              placeholder="Nhập ghi chú hoặc mô tả..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </Card>

        <div className="mt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={submitting}
            disabled={submitting}
          >
            Tạo ngân sách
          </Button>
        </div>
      </form>
    </div>
  );
}
