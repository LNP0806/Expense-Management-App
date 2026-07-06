/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Plus, MagnifyingGlass, Trash, Pencil, ArrowsLeftRight, Tag } from '@phosphor-icons/react';
import { transactionsApi } from '../api/transactions.api';
import { categoriesApi } from '../api/categories.api';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate, getTodayDate } from '../utils/formatters';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';

export default function TransactionsPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();

  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  
  // Pagination & Filtering
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [typeFilter, setTypeFilter] = useState('ALL'); // ALL, INCOME, EXPENSE
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Detail Modal
  const [selectedTx, setSelectedTx] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Edit Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    amount: '',
    type: 'EXPENSE',
    categoryId: '',
    date: '',
    description: '',
  });
  const [editErrors, setEditErrors] = useState({});
  const [updating, setUpdating] = useState(false);
  
  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch categories to map ID -> Name
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await categoriesApi.getAll({ limit: 100 });
        if (res.data.success) {
          const rawData = res.data.data;
          const list = Array.isArray(rawData) ? rawData : (rawData?.data || []);
          const catMap = {};
          list.forEach((c) => {
            catMap[c.id] = c;
          });
          setCategories(catMap);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    }
    fetchCategories();
  }, []);

  // Fetch transactions function
  const fetchTransactions = useCallback(async (pageNum, filterVal, searchVal, isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(false);

      const params = {
        page: pageNum,
        limit: 10,
      };

      if (filterVal !== 'ALL') {
        params.type = filterVal;
      }

      if (searchVal.trim()) {
        params.keyword = searchVal;
      }

      const res = await transactionsApi.getAll(params);
      
      if (res.data.success) {
        const rawData = res.data.data;
        const dataList = Array.isArray(rawData) ? rawData : (rawData?.data || []);
        setTransactions(prev => isLoadMore ? [...prev, ...dataList] : dataList);
        
        const meta = res.data.metadata;
        if (meta) {
          setTotalPages(meta.total_pages || 1);
        }
      }
    } catch (err) {
      console.error('Error loading transactions:', err);
      setError(true);
      addToast('Lỗi khi tải danh sách giao dịch', 'error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [addToast]);

  // Handle filter changes
  useEffect(() => {
    setPage(1);
    fetchTransactions(1, typeFilter, debouncedSearch, false);
  }, [typeFilter, debouncedSearch, fetchTransactions]);

  // Load more
  const handleLoadMore = () => {
    if (page < totalPages) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchTransactions(nextPage, typeFilter, debouncedSearch, true);
    }
  };

  // Open modal if direct ID is passed in query params
  useEffect(() => {
    const txId = searchParams.get('id');
    if (txId && transactions.length > 0) {
      const tx = transactions.find((t) => t.id === txId);
      if (tx) setSelectedTx(tx);
    }
  }, [searchParams, transactions]);

  // Delete transaction
  const handleDeleteTx = async () => {
    if (!selectedTx) return;
    setDeleting(true);
    try {
      await transactionsApi.delete(selectedTx.id);
      addToast('Xóa giao dịch thành công', 'success');
      setTransactions(prev => prev.filter(t => t.id !== selectedTx.id));
      setSelectedTx(null);
      setIsDeleteModalOpen(false);
    } catch (err) {
      console.error('Error deleting transaction:', err);
      addToast('Lỗi khi xóa giao dịch', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenEdit = () => {
    if (!selectedTx) return;
    
    // Convert UTC date from API to local YYYY-MM-DD format to prevent timezone offset shifts
    const toLocalYYYYMMDD = (dateStr) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    setEditFormData({
      title: selectedTx.title || '',
      amount: selectedTx.amount ? String(selectedTx.amount) : '',
      type: selectedTx.type || 'EXPENSE',
      categoryId: selectedTx.category_id || '',
      date: toLocalYYYYMMDD(selectedTx.transaction_date) || getTodayDate(),
      description: selectedTx.description || '',
    });
    setEditErrors({});
    setIsEditModalOpen(true);
  };

  const handleUpdateTx = async (e) => {
    e.preventDefault();
    
    // Validate edit form
    const newErrors = {};
    if (!editFormData.title.trim()) {
      newErrors.title = 'Vui lòng nhập tiêu đề';
    }
    if (!editFormData.amount || Number(editFormData.amount) <= 0) {
      newErrors.amount = 'Vui lòng nhập số tiền hợp lệ';
    }
    if (!editFormData.date) {
      newErrors.date = 'Vui lòng chọn ngày giao dịch';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setEditErrors(newErrors);
      return;
    }
    
    setUpdating(true);
    try {
      const payload = {
        title: editFormData.title.trim(),
        amount: Number(editFormData.amount),
        type: editFormData.type,
        transaction_date: editFormData.date,
        description: editFormData.description.trim() || null,
      };
      
      if (editFormData.categoryId) {
        payload.category_id = editFormData.categoryId;
      }
      
      const res = await transactionsApi.update(selectedTx.id, payload);
      if (res.data.success) {
        const rawTx = res.data.data;
        const updated = rawTx?.updatedTransaction || rawTx?.updated_transaction || rawTx;
        addToast('Cập nhật giao dịch thành công', 'success');
        
        // Update local state
        setTransactions(prev => prev.map(t => t.id === selectedTx.id ? { ...t, ...updated } : t));
        setSelectedTx(null);
        setIsEditModalOpen(false);
      }
    } catch (err) {
      console.error('Error updating transaction:', err);
      const msg = err?.response?.data?.message || err?.message || 'Lỗi khi cập nhật giao dịch';
      addToast(msg, 'error');
    } finally {
      setUpdating(false);
    }
  };

  const getCategoryName = (catId) => {
    if (!catId) return 'Chưa phân loại';
    return categories[catId]?.name || 'Danh mục khác';
  };

  return (
    <div className="p-4 md:p-8 max-w-[800px] mx-auto flex flex-col gap-6 pb-24 md:pb-8 animate-fade-in">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Lịch sử giao dịch</h1>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            icon={<Tag size={18} />}
            onClick={() => navigate('/categories')}
          >
            Danh mục
          </Button>
          <Button
            variant="primary"
            icon={<Plus size={18} />}
            onClick={() => navigate('/transactions/new')}
          >
            Thêm mới
          </Button>
        </div>
      </header>

      {/* Filter Options */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex bg-secondary-dark p-1 rounded-xl border border-border-dark self-start">
          <button
            className={`px-4 py-2 text-xs font-semibold rounded-lg cursor-pointer transition-all duration-150 ${
              typeFilter === 'ALL' ? 'bg-tertiary-dark text-accent-green' : 'text-text-secondary hover:text-text-primary'
            }`}
            onClick={() => setTypeFilter('ALL')}
          >
            Tất cả
          </button>
          <button
            className={`px-4 py-2 text-xs font-semibold rounded-lg cursor-pointer transition-all duration-150 ${
              typeFilter === 'INCOME' ? 'bg-tertiary-dark text-accent-green' : 'text-text-secondary hover:text-text-primary'
            }`}
            onClick={() => setTypeFilter('INCOME')}
          >
            Thu nhập
          </button>
          <button
            className={`px-4 py-2 text-xs font-semibold rounded-lg cursor-pointer transition-all duration-150 ${
              typeFilter === 'EXPENSE' ? 'bg-tertiary-dark text-accent-green' : 'text-text-secondary hover:text-text-primary'
            }`}
            onClick={() => setTypeFilter('EXPENSE')}
          >
            Chi tiêu
          </button>
        </div>

        <Input
          id="search"
          placeholder="Tìm kiếm giao dịch..."
          icon={<MagnifyingGlass size={18} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="sm:max-w-[280px] mb-0"
        />
      </div>

      {/* Transaction List */}
      <div className="flex flex-col gap-2">
        {loading && page === 1 ? (
          <>
            <div className="h-16 skeleton-shimmer w-full" />
            <div className="h-16 skeleton-shimmer w-full" />
            <div className="h-16 skeleton-shimmer w-full" />
          </>
        ) : error ? (
          <EmptyState
            title="Đã xảy ra lỗi"
            description="Vui lòng thử lại để cập nhật danh sách."
            action={
              <Button variant="primary" onClick={() => fetchTransactions(1, typeFilter, debouncedSearch)}>
                Tải lại
              </Button>
            }
          />
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={<ArrowsLeftRight size={32} />}
            title="Không tìm thấy giao dịch"
            description="Hãy thử thay đổi bộ lọc hoặc thêm giao dịch mới."
          />
        ) : (
          <>
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex justify-between items-center bg-secondary-dark border border-border-dark p-4 rounded-xl cursor-pointer transition-all duration-200 hover:bg-hover-dark hover:border-border-dark-light hover:-translate-y-0.5"
                onClick={() => setSelectedTx(tx)}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor:
                        tx.type === 'INCOME' ? 'var(--color-income)' : 'var(--color-expense)',
                    }}
                  />
                  <div className="flex flex-col overflow-hidden text-left">
                    <span className="text-sm font-semibold text-text-primary truncate">{tx.title}</span>
                    <span className="text-xs text-text-muted mt-0.5">
                      {getCategoryName(tx.category_id)} • {formatDate(tx.transaction_date || tx.created_at)}
                    </span>
                  </div>
                </div>
                <div
                  className={`font-semibold text-sm ${
                    tx.type === 'INCOME' ? 'text-income' : 'text-expense'
                  }`}
                >
                  {tx.type === 'INCOME' ? '+' : '-'}
                  {formatCurrency(tx.amount)}
                </div>
              </div>
            ))}

            {page < totalPages && (
              <div className="flex justify-center mt-6">
                <Button
                  variant="secondary"
                  onClick={handleLoadMore}
                  loading={loadingMore}
                >
                  Tải thêm
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        title="Chi tiết giao dịch"
        footer={
          <>
            <Button
              variant="danger"
              icon={<Trash size={18} />}
              onClick={() => setIsDeleteModalOpen(true)}
            >
              Xóa
            </Button>
            <Button
              variant="secondary"
              icon={<Pencil size={18} />}
              onClick={handleOpenEdit}
            >
              Chỉnh sửa
            </Button>
          </>
        }
      >
        {selectedTx && (
          <div className="text-left flex flex-col gap-5">
            <div
              className={`text-3xl font-bold text-center mb-2 ${
                selectedTx.type === 'INCOME' ? 'text-income' : 'text-expense'
              }`}
            >
              {selectedTx.type === 'INCOME' ? '+' : '-'}
              {formatCurrency(selectedTx.amount)}
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Tiêu đề</span>
                <div className="text-sm font-semibold text-text-primary mt-1">{selectedTx.title}</div>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Loại giao dịch</span>
                <div className="text-sm font-semibold text-text-primary mt-1">
                  {selectedTx.type === 'INCOME' ? 'Thu nhập' : 'Chi tiêu'}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Danh mục</span>
                <div className="text-sm font-semibold text-text-primary mt-1">{getCategoryName(selectedTx.category_id)}</div>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Ngày thực hiện</span>
                <div className="text-sm font-semibold text-text-primary mt-1">
                  {formatDate(selectedTx.transaction_date || selectedTx.created_at)}
                </div>
              </div>

              {selectedTx.description && (
                <div>
                  <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Ghi chú / Mô tả</span>
                  <div className="text-sm text-text-secondary mt-1 whitespace-pre-wrap">
                    {selectedTx.description}
                  </div>
                </div>
              )}

              {selectedTx.image_url && (
                <div>
                  <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Ảnh đính kèm</span>
                  <div className="mt-2">
                    <img
                      src={selectedTx.image_url}
                      alt="Hóa đơn"
                      className="w-full rounded-xl max-h-[300px] object-contain border border-border-dark"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Xác nhận xóa"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="danger"
              loading={deleting}
              onClick={handleDeleteTx}
            >
              Xóa giao dịch
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-secondary text-left">
          Bạn có chắc chắn muốn xóa giao dịch này không? Hành động này không thể hoàn tác.
        </p>
      </Modal>

      {/* Edit Transaction Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Chỉnh sửa giao dịch"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="primary"
              loading={updating}
              onClick={handleUpdateTx}
            >
              Lưu thay đổi
            </Button>
          </>
        }
      >
        <form className="flex flex-col gap-4 text-left font-sans" onSubmit={handleUpdateTx}>
          {/* Type Toggle */}
          <div className="flex bg-secondary-dark p-1 rounded-xl border border-border-dark self-center mb-2">
            <button
              type="button"
              className={`px-6 py-2 text-sm font-semibold rounded-lg cursor-pointer transition-all duration-150 ${
                editFormData.type === 'EXPENSE'
                  ? 'bg-expense text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              onClick={() => setEditFormData(prev => ({ ...prev, type: 'EXPENSE' }))}
            >
              Chi tiêu
            </button>
            <button
              type="button"
              className={`px-6 py-2 text-sm font-semibold rounded-lg cursor-pointer transition-all duration-150 ${
                editFormData.type === 'INCOME'
                  ? 'bg-income text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              onClick={() => setEditFormData(prev => ({ ...prev, type: 'INCOME' }))}
            >
              Thu nhập
            </button>
          </div>

          <Input
            id="edit-title"
            label="Tiêu đề"
            value={editFormData.title}
            onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
            error={editErrors.title}
          />

          <Input
            id="edit-amount"
            label="Số tiền"
            type="number"
            value={editFormData.amount}
            onChange={(e) => setEditFormData(prev => ({ ...prev, amount: e.target.value }))}
            error={editErrors.amount}
          />

          <Select
            id="edit-category"
            label="Danh mục"
            value={editFormData.categoryId}
            onChange={(e) => setEditFormData(prev => ({ ...prev, categoryId: e.target.value }))}
            options={Object.values(categories).map(c => ({ value: c.id, label: c.name }))}
            placeholder="Chưa phân loại"
          />

          <Input
            id="edit-date"
            label="Ngày giao dịch"
            type="date"
            value={editFormData.date}
            onChange={(e) => setEditFormData(prev => ({ ...prev, date: e.target.value }))}
            error={editErrors.date}
          />

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider" htmlFor="edit-desc">
              Ghi chú / Mô tả
            </label>
            <textarea
              id="edit-desc"
              className="w-full bg-secondary-dark border border-border-dark text-text-primary font-sans text-sm px-4 py-2.5 rounded-xl transition-all duration-150 focus:outline-hidden focus:border-accent-green focus:bg-tertiary-dark focus:ring-1 focus:ring-accent-green resize-y min-h-[80px]"
              value={editFormData.description}
              onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
