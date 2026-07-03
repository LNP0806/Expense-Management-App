import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Trash } from '@phosphor-icons/react';
import { transactionsApi } from '../api/transactions.api';
import { categoriesApi } from '../api/categories.api';
import { useToast } from '../context/ToastContext';
import { getTodayDate, formatCurrency } from '../utils/formatters';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';

export default function CreateTransactionPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const fileInputRef = useRef(null);

  const [type, setType] = useState('EXPENSE'); // INCOME or EXPENSE
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(getTodayDate());
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

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
        console.error('Error fetching categories:', err);
        addToast('Lỗi khi tải danh mục', 'error');
      } finally {
        setLoadingCategories(false);
      }
    }
    loadCategories();
  }, [addToast]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        addToast('Ảnh không được vượt quá 5MB', 'warning');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!amount || Number(amount) <= 0) {
      newErrors.amount = 'Vui lòng nhập số tiền hợp lệ';
    }
    if (!title.trim()) {
      newErrors.title = 'Vui lòng nhập tiêu đề giao dịch';
    }
    if (!date) {
      newErrors.date = 'Vui lòng chọn ngày giao dịch';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('type', type);
      formData.append('amount', amount);
      
      if (categoryId) {
        formData.append('category_id', categoryId);
      }
      if (date) {
        formData.append('transaction_date', date);
      }
      if (description && description.trim()) {
        formData.append('description', description.trim());
      }

      if (imageFile) {
        formData.append('image', imageFile);
      }

      await transactionsApi.create(formData);
      addToast('Tạo giao dịch thành công!', 'success');
      navigate('/transactions');
    } catch (err) {
      console.error('Error creating transaction:', err);
      const msg = err?.response?.data?.message || err?.message || 'Lỗi khi tạo giao dịch';
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
        <h1 className="text-xl font-bold text-text-primary">Thêm giao dịch</h1>
        <div className="w-9" />
      </header>

      <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
        {/* Toggle Type */}
        <div className="flex justify-center mb-2">
          <div className="flex bg-secondary-dark p-1 rounded-2xl border border-border-dark w-full max-w-[320px]">
            <button
              type="button"
              className={`flex-1 py-3 text-sm font-semibold rounded-xl cursor-pointer transition-all duration-200 ${
                type === 'INCOME' 
                  ? 'bg-income-bg text-income' 
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              onClick={() => setType('INCOME')}
            >
              Thu nhập
            </button>
            <button
              type="button"
              className={`flex-1 py-3 text-sm font-semibold rounded-xl cursor-pointer transition-all duration-200 ${
                type === 'EXPENSE' 
                  ? 'bg-expense-bg text-expense' 
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              onClick={() => setType('EXPENSE')}
            >
              Chi tiêu
            </button>
          </div>
        </div>

        {/* Amount Input */}
        <div className="flex flex-col items-center relative py-6 text-center">
          <span className={`absolute left-[10%] top-[40%] text-3xl font-semibold select-none ${
            type === 'INCOME' ? 'text-income' : 'text-expense'
          }`}>
            {type === 'INCOME' ? '+' : '-'}
          </span>
          <input
            type="number"
            placeholder="0"
            className="w-[80%] mx-auto bg-transparent border-none text-center text-4xl md:text-5xl font-bold text-text-primary focus:outline-hidden placeholder:text-text-muted [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            autoFocus
          />
          <span className="absolute right-[10%] top-[40%] text-xl font-semibold text-text-secondary select-none">đ</span>
          {amount && (
            <div className="text-sm text-text-muted mt-2 font-medium">
              {formatCurrency(amount)}
            </div>
          )}
          {errors.amount && <span className="text-xs text-expense mt-1">{errors.amount}</span>}
        </div>

        <div className="bg-secondary-dark border border-border-dark p-6 rounded-2xl flex flex-col gap-4">
          <Input
            id="title"
            label="Tiêu đề"
            placeholder="ví dụ: Ăn trưa, Tiền lương..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={errors.title}
            required
          />

          <Select
            id="categoryId"
            label="Danh mục (tùy chọn)"
            options={categories}
            placeholder={loadingCategories ? 'Đang tải danh mục...' : 'Chọn danh mục'}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            error={errors.categoryId}
          />

          <Input
            id="date"
            type="date"
            label="Ngày giao dịch"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            error={errors.date}
            required
          />

          <div className="flex flex-col gap-1 text-left mb-2">
            <label className="text-[11px] font-medium text-text-secondary uppercase tracking-wider" htmlFor="description">
              Mô tả (tùy chọn)
            </label>
            <textarea
              id="description"
              className="w-full bg-secondary-dark border border-border-dark text-text-primary font-sans text-base px-4 py-3 rounded-xl transition-all duration-150 min-h-[80px] focus:outline-hidden focus:border-accent-green focus:bg-tertiary-dark focus:ring-1 focus:ring-accent-green resize-y"
              placeholder="Nhập ghi chú chi tiết..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Image Upload Component */}
          <div className="flex flex-col gap-2 text-left mt-2">
            <span className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">
              Ảnh hóa đơn / Biên lai (tùy chọn)
            </span>

            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-border-dark max-h-[240px]">
                <img src={imagePreview} alt="Xem trước hóa đơn" className="w-full h-full object-contain max-h-[240px]" />
                <button 
                  type="button" 
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-primary-dark/80 text-text-primary border border-border-dark flex items-center justify-center cursor-pointer transition-colors duration-150 hover:bg-expense hover:text-white" 
                  onClick={removeImage}
                >
                  <Trash size={16} />
                </button>
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border-dark rounded-xl py-8 text-text-muted cursor-pointer transition-colors duration-150 hover:border-accent-green hover:text-text-secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera size={32} />
                <span className="text-sm font-medium">Chụp hoặc tải ảnh hóa đơn</span>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="image/*"
              onChange={handleImageChange}
            />
          </div>
        </div>

        <div className="mt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={submitting}
            disabled={submitting}
          >
            Lưu giao dịch
          </Button>
        </div>
      </form>
    </div>
  );
}
