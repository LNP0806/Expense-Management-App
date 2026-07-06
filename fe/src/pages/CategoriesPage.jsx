/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react';
import { Tag, Plus, Pencil, Trash } from '@phosphor-icons/react';
import { categoriesApi } from '../api/categories.api';
import { useToast } from '../context/ToastContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';

export default function CategoriesPage() {
  const { addToast } = useToast();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Form State for Create/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null); // null for create
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const res = await categoriesApi.getAll({ limit: 100 });
      if (res.data.success) {
        const rawData = res.data.data;
        const list = Array.isArray(rawData) ? rawData : (rawData?.data || []);
        setCategories(list);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(true);
      addToast('Lỗi khi tải danh sách danh mục', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openCreateModal = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openDeleteModal = (cat) => {
    setDeletingCategory(cat);
    setIsDeleteModalOpen(true);
  };

  const validate = () => {
    const errors = {};
    if (!name.trim()) {
      errors.name = 'Vui lòng nhập tên danh mục';
    } else if (name.trim().length > 50) {
      errors.name = 'Tên danh mục không được vượt quá 50 ký tự';
    }
    if (description.trim().length > 200) {
      errors.description = 'Mô tả không được vượt quá 200 ký tự';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
      };

      if (editingCategory) {
        // Update
        const res = await categoriesApi.update(editingCategory.id, payload);
        if (res.data.success) {
          addToast('Cập nhật danh mục thành công!', 'success');
          const rawCat = res.data.data;
          const categoryObj = rawCat?.updatedCategory || rawCat?.updated_category || rawCat;
          setCategories(prev => prev.map(c => c.id === editingCategory.id ? categoryObj : c));
        }
      } else {
        // Create
        const res = await categoriesApi.create(payload);
        if (res.data.success) {
          addToast('Thêm danh mục thành công!', 'success');
          const rawCat = res.data.data;
          const categoryObj = rawCat?.newCategory || rawCat?.new_category || rawCat;
          setCategories(prev => [...prev, categoryObj]);
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving category:', err);
      const msg = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi lưu';
      addToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    setDeleting(true);
    try {
      await categoriesApi.delete(deletingCategory.id);
      addToast('Xóa danh mục thành công!', 'success');
      setCategories(prev => prev.filter(c => c.id !== deletingCategory.id));
      setIsDeleteModalOpen(false);
    } catch (err) {
      console.error('Error deleting category:', err);
      const msg = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi xóa';
      addToast(msg, 'error');
    } finally {
      setDeleting(false);
      setDeletingCategory(null);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-[800px] mx-auto flex flex-col gap-6 pb-24 md:pb-8 animate-fade-in">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-left">
          <Tag size={24} className="text-accent-green" />
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Danh mục chi tiêu</h1>
        </div>
        <Button
          variant="primary"
          icon={<Plus size={18} />}
          onClick={openCreateModal}
        >
          Thêm mới
        </Button>
      </header>

      {loading ? (
        <div className="flex flex-col gap-3">
          <div className="h-20 skeleton-shimmer w-full" />
          <div className="h-20 skeleton-shimmer w-full" />
          <div className="h-20 skeleton-shimmer w-full" />
        </div>
      ) : error ? (
        <EmptyState
          title="Không thể tải dữ liệu"
          description="Vui lòng tải lại trang để cập nhật danh sách danh mục."
          action={
            <Button variant="primary" onClick={fetchCategories}>
              Tải lại
            </Button>
          }
        />
      ) : categories.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon={<Tag size={32} />}
            title="Chưa có danh mục nào"
            description="Tạo các danh mục giúp bạn dễ dàng phân loại chi tiêu."
            action={
              <Button variant="primary" onClick={openCreateModal}>
                Tạo danh mục đầu tiên
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {categories.map((cat) => (
            <Card
              key={cat.id}
              padding="md"
              className="flex justify-between items-center bg-secondary-dark border border-border-dark p-4 rounded-xl transition-all duration-200 hover:border-border-dark-light hover:shadow-xs"
            >
              <div className="flex flex-col gap-1 text-left overflow-hidden">
                <span className="text-sm font-semibold text-text-primary truncate">{cat.name}</span>
                <span className="text-xs text-text-muted truncate">
                  {cat.description || 'Không có mô tả'}
                </span>
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => openEditModal(cat)}
                  className="p-2 rounded-lg bg-tertiary-dark text-text-secondary transition-colors duration-150 hover:bg-hover-dark hover:text-text-primary cursor-pointer"
                  aria-label="Sửa danh mục"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => openDeleteModal(cat)}
                  className="p-2 rounded-lg bg-expense-bg text-expense transition-colors duration-150 hover:bg-expense hover:text-white cursor-pointer"
                  aria-label="Xóa danh mục"
                >
                  <Trash size={16} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={submitting}
              disabled={submitting}
              onClick={handleSubmit}
            >
              {editingCategory ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </>
        }
      >
        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <Input
            id="catName"
            type="text"
            label="Tên danh mục"
            placeholder="ví dụ: Ăn uống, Di chuyển..."
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (formErrors.name) setFormErrors(prev => ({ ...prev, name: '' }));
            }}
            error={formErrors.name}
            required
            autoFocus
          />

          <div className="flex flex-col gap-1 text-left">
            <label className="text-[11px] font-medium text-text-secondary uppercase tracking-wider" htmlFor="catDesc">
              Mô tả danh mục (tùy chọn)
            </label>
            <textarea
              id="catDesc"
              className={`w-full bg-secondary-dark border text-text-primary font-sans text-base px-4 py-3 rounded-xl transition-all duration-150 min-h-[80px] focus:outline-hidden focus:bg-tertiary-dark focus:ring-1 resize-none 
                ${formErrors.description 
                  ? 'border-expense focus:border-expense focus:ring-expense' 
                  : 'border-border-dark focus:border-accent-green focus:ring-accent-green'
                }`}
              placeholder="ví dụ: Tiền ăn cơm trưa văn phòng, đi cafe..."
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (formErrors.description) setFormErrors(prev => ({ ...prev, description: '' }));
              }}
            />
            {formErrors.description && <span className="text-[11px] text-expense mt-0.5">{formErrors.description}</span>}
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Xác nhận xóa danh mục"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="danger"
              loading={deleting}
              onClick={handleDelete}
            >
              Xóa danh mục
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-secondary text-left leading-relaxed">
          Bạn có chắc chắn muốn xóa danh mục <strong className="text-text-primary">"{deletingCategory?.name}"</strong> không? 
          <br />
          <span className="text-xs text-expense mt-2 block font-medium">
            * Cảnh báo: Các giao dịch và ngân sách đang liên kết với danh mục này sẽ bị ảnh hưởng (mất liên kết). Hành động này không thể hoàn tác.
          </span>
        </p>
      </Modal>
    </div>
  );
}
