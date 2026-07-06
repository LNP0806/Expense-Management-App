import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Trash, Sparkle, CheckCircle, Robot } from '@phosphor-icons/react';
import { aiApi } from '../api/ai.api';
import { transactionsApi } from '../api/transactions.api';
import { categoriesApi } from '../api/categories.api';
import { useToast } from '../context/ToastContext';
import { getTodayDate } from '../utils/formatters';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Spinner from '../components/common/Spinner';
import Card from '../components/common/Card';

export default function QuickCapturePage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const [step, setStep] = useState(1); // 1: Capture, 2: Parsing, 3: Confirm, 4: Success

  // Step 1 states
  const [caption, setCaption] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  // Step 3 states (prefilled by AI)
  const [type, setType] = useState('EXPENSE');
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(getTodayDate());
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState({});

  // Categories list
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);

  // Load categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await categoriesApi.getAll({ limit: 100 });
        if (res.data.success) {
          const rawData = res.data.data;
          const list = Array.isArray(rawData) ? rawData : (rawData?.data || []);
          setCategories(list.map(c => ({ value: c.id, label: c.name })));
        }
      } catch (err) {
        console.error('Error load categories:', err);
      }
    }
    loadCategories();
  }, []);

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
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
    if (galleryInputRef.current) {
      galleryInputRef.current.value = '';
    }
  };

  // Step 1 -> Step 2 (Trigger AI Parse)
  const handleAnalyze = async () => {
    if (!caption.trim()) {
      addToast('Vui lòng nhập mô tả giao dịch để AI phân tích', 'warning');
      return;
    }

    setStep(2);

    try {
      const res = await aiApi.parseTransaction(caption);
      if (res.data.success) {
        const parsed = res.data.data;
        
        // Pre-fill state
        setType(parsed.type || 'EXPENSE');
        setAmount(parsed.amount ? String(parsed.amount) : '');
        setTitle(parsed.title || '');
        setCategoryId(parsed.category_id || '');
        setDescription(parsed.notes || caption);
        setDate(getTodayDate());
        
        addToast('AI đã phân tích xong!', 'success');
        setStep(3);
      } else {
        throw new Error('AI parsing failed');
      }
    } catch (err) {
      console.error('AI Parse error:', err);
      addToast('AI không thể nhận diện thông tin. Vui lòng tự điền.', 'warning');
      
      // Reset values to blank for manual input
      setType('EXPENSE');
      setAmount('');
      setTitle('');
      setCategoryId('');
      setDescription(caption);
      setDate(getTodayDate());
      
      setStep(3);
    }
  };

  // Step 3 Confirmation & Save
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

  const handleSaveTransaction = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
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

      const res = await transactionsApi.create(formData);
      if (res.data.success) {
        setStep(4);
      }
    } catch (err) {
      console.error('Error saving transaction:', err);
      const msg = err?.response?.data?.message || err?.message || 'Lỗi khi lưu giao dịch';
      addToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const resetFlow = () => {
    setCaption('');
    setImageFile(null);
    setImagePreview('');
    setType('EXPENSE');
    setAmount('');
    setTitle('');
    setCategoryId('');
    setDescription('');
    setDate(getTodayDate());
    setErrors({});
    setStep(1);
  };

  return (
    <div className="p-4 md:p-8 max-w-[600px] mx-auto flex flex-col gap-6 pb-24 md:pb-8 animate-fade-in">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">Quét giao dịch bằng AI</h1>
        
        {/* Step Indicator */}
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full transition-all duration-200 ${
            step >= 1 ? 'bg-accent-green' : 'bg-border-dark'
          } ${step === 1 ? 'scale-125 ring-4 ring-accent-green/20' : ''}`} />
          <span className={`w-2 h-2 rounded-full transition-all duration-200 ${
            step >= 2 ? 'bg-accent-green' : 'bg-border-dark'
          } ${step === 2 ? 'scale-125 ring-4 ring-accent-green/20' : ''}`} />
          <span className={`w-2 h-2 rounded-full transition-all duration-200 ${
            step >= 3 ? 'bg-accent-green' : 'bg-border-dark'
          } ${step === 3 ? 'scale-125 ring-4 ring-accent-green/20' : ''}`} />
          <span className={`w-2 h-2 rounded-full transition-all duration-200 ${
            step >= 4 ? 'bg-accent-green' : 'bg-border-dark'
          } ${step === 4 ? 'scale-125 ring-4 ring-accent-green/20' : ''}`} />
        </div>
      </header>

      {/* Step 1: Capture & Caption */}
      {step === 1 && (
        <div className="flex flex-col gap-6 animate-fade-in">
          {imagePreview ? (
            <div className="relative rounded-2xl overflow-hidden border border-border-dark max-h-[300px]">
              <img src={imagePreview} alt="Biên lai tải lên" className="w-full h-full object-contain max-h-[300px]" />
              <div className="absolute inset-0 bg-primary-dark/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                <button 
                  type="button" 
                  className="w-12 h-12 rounded-full bg-primary-dark/80 text-text-primary border border-border-dark flex items-center justify-center cursor-pointer transition-colors duration-150 hover:bg-expense hover:text-white" 
                  onClick={removeImage}
                >
                  <Trash size={18} />
                </button>
              </div>
            </div>
          ) : (
            <div 
              className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border-dark rounded-2xl py-12 text-text-muted cursor-pointer transition-colors duration-150 hover:border-accent-green hover:text-text-secondary" 
              onClick={() => cameraInputRef.current?.click()}
            >
              <Camera size={44} weight="light" className="text-text-muted" />
              <span className="text-sm font-medium">Chụp ảnh hóa đơn bằng Camera (tùy chọn)</span>
            </div>
          )}

          <div className="text-center -mt-2">
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="text-sm font-semibold text-accent-green hover:text-accent-green-hover transition-colors cursor-pointer hover:underline inline-flex items-center gap-1.5"
            >
              Hoặc chọn ảnh từ thư viện
            </button>
          </div>

          <input
            type="file"
            ref={cameraInputRef}
            style={{ display: 'none' }}
            accept="image/*"
            capture="environment"
            onChange={handleImageChange}
          />

          <input
            type="file"
            ref={galleryInputRef}
            style={{ display: 'none' }}
            accept="image/*"
            onChange={handleImageChange}
          />

          <div className="flex flex-col gap-1 text-left mb-2">
            <label className="text-[11px] font-medium text-text-secondary uppercase tracking-wider" htmlFor="caption">
              Mô tả giao dịch cho AI
            </label>
            <textarea
              id="caption"
              className="w-full bg-secondary-dark border border-border-dark text-text-primary font-sans text-base px-4 py-3 rounded-xl transition-all duration-150 min-h-[100px] focus:outline-hidden focus:border-accent-green focus:bg-tertiary-dark focus:ring-1 focus:ring-accent-green resize-y"
              placeholder="ví dụ: Trưa nay ăn bún chả hết 45k, hoặc: Đóng tiền điện tháng này hết 800k..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              required
            />
          </div>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleAnalyze}
            disabled={!caption.trim()}
            icon={<Sparkle size={18} weight="fill" />}
          >
            Gửi cho AI phân tích
          </Button>
        </div>
      )}

      {/* Step 2: AI Scanning Animation */}
      {step === 2 && (
        <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
          {imagePreview ? (
            <div className="relative rounded-xl overflow-hidden border border-accent-green/50 shadow-[0_0_30px_rgba(16,185,129,0.15)] max-w-[280px] mb-8">
              <div className="absolute left-0 right-0 h-0.5 bg-accent-green shadow-[0_0_8px_#10b981] animate-scan z-10" />
              <img src={imagePreview} alt="Quét hóa đơn" className="w-full object-contain" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-accent-subtle text-accent-green flex items-center justify-center mb-8 animate-pulse">
              <Robot size={64} />
            </div>
          )}
          
          <div className="flex items-center gap-3 text-sm text-text-secondary">
            <Spinner size="md" />
            <span>Trí tuệ nhân tạo đang phân tích giao dịch...</span>
          </div>
        </div>
      )}

      {/* Step 3: Confirmation Form */}
      {step === 3 && (
        <div className="flex flex-col gap-6 animate-fade-in">
          <h2 className="text-lg font-semibold text-text-primary text-left">
            Xác nhận giao dịch
          </h2>
          
          {imagePreview && (
            <Card padding="sm" className="mb-2">
              <img
                src={imagePreview}
                alt="Hóa đơn"
                className="w-full max-h-[180px] object-contain block rounded-lg"
              />
            </Card>
          )}

          <form className="flex flex-col gap-6" onSubmit={handleSaveTransaction}>
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

            <Card padding="lg" className="flex flex-col gap-4">
              <Input
                id="amount"
                type="number"
                label="Số tiền (đ)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                error={errors.amount}
                required
              />

              <Input
                id="title"
                label="Tiêu đề"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                error={errors.title}
                required
              />

              <Select
                id="categoryId"
                label="Danh mục (tùy chọn)"
                options={categories}
                placeholder="Chọn danh mục"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                error={errors.categoryId}
              />

              <Input
                id="date"
                type="date"
                label="Ngày thực hiện"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                error={errors.date}
                required
              />

              <div className="flex flex-col gap-1 text-left mb-2">
                <label className="text-[11px] font-medium text-text-secondary uppercase tracking-wider" htmlFor="description">
                  Mô tả chi tiết
                </label>
                <textarea
                  id="description"
                  className="w-full bg-secondary-dark border border-border-dark text-text-primary font-sans text-base px-4 py-3 rounded-xl transition-all duration-150 min-h-[80px] focus:outline-hidden focus:border-accent-green focus:bg-tertiary-dark focus:ring-1 focus:ring-accent-green resize-y"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </Card>

            <div className="flex gap-4 mt-2">
              <Button variant="ghost" className="flex-1" onClick={resetFlow}>
                Hủy
              </Button>
              <Button type="submit" variant="primary" className="flex-1" loading={saving} disabled={saving}>
                Xác nhận & Lưu
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Step 4: Success Message */}
      {step === 4 && (
        <div className="flex flex-col items-center justify-center py-12 text-center max-w-[400px] mx-auto animate-fade-in">
          <div className="text-accent-green animate-scale-up mb-6">
            <CheckCircle size={80} weight="fill" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Giao dịch đã được lưu!</h2>
          <p className="text-sm text-text-muted mb-8">
            Thông tin giao dịch của bạn đã được lưu trữ thành công vào hệ thống.
          </p>

          <div className="flex flex-col gap-4 w-full">
            <Button variant="primary" size="lg" onClick={() => navigate('/dashboard')}>
              Quay lại trang chủ
            </Button>
            <Button variant="ghost" size="md" onClick={resetFlow}>
              Quét thêm giao dịch khác
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
