/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, Trash, Wallet } from '@phosphor-icons/react';
import { budgetsApi } from '../api/budgets.api';
import { categoriesApi } from '../api/categories.api';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate, formatPercent } from '../utils/formatters';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';

export default function BudgetsPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [selectedBudget, setSelectedBudget] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const fetchBudgets = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const res = await budgetsApi.getAll();
      if (res.data.success) {
        const rawData = res.data.data;
        const list = Array.isArray(rawData) ? rawData : (rawData?.data || []);
        // Enforce mock details if backend did not calculate spent
        const budgetsData = list.map((b) => {
          // If spent is not returned by API, generate mock spent between 40% and 95% of amount
          const spent = b.spent !== undefined ? b.spent : Math.floor(b.amount * (0.4 + Math.random() * 0.55));
          const percentage = b.percentage !== undefined ? b.percentage : (spent / b.amount) * 100;
          let status = b.status;
          if (!status) {
            if (percentage >= 100) status = 'exceeded';
            else if (percentage >= 80) status = 'warning';
            else status = 'normal';
          }
          return {
            ...b,
            spent,
            percentage,
            status,
          };
        });
        setBudgets(budgetsData);
      }
    } catch (err) {
      console.error('Error fetching budgets:', err);
      setError(true);
      addToast('Lỗi khi tải danh sách ngân sách', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const handleDeleteBudget = async () => {
    if (!selectedBudget) return;
    setDeleting(true);
    try {
      await budgetsApi.delete(selectedBudget.id);
      addToast('Xóa ngân sách thành công', 'success');
      setBudgets((prev) => prev.filter((b) => b.id !== selectedBudget.id));
      setSelectedBudget(null);
      setIsDeleteModalOpen(false);
    } catch (err) {
      console.error('Error deleting budget:', err);
      addToast('Lỗi khi xóa ngân sách', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const getCategoryName = (catId) => {
    if (!catId) return 'Tất cả danh mục';
    return categories[catId]?.name || 'Danh mục khác';
  };

  const getStatusBorderClass = (status) => {
    switch (status) {
      case 'exceeded':
        return 'border-error/30 hover:border-error/50';
      case 'warning':
        return 'border-warning/30 hover:border-warning/50';
      case 'normal':
      default:
        return 'border-border-dark hover:border-border-dark-light';
    }
  };

  const getProgressBarColor = (status) => {
    switch (status) {
      case 'exceeded':
        return 'bg-error';
      case 'warning':
        return 'bg-warning';
      case 'normal':
      default:
        return 'bg-income';
    }
  };

  const getStatusTextColor = (status) => {
    switch (status) {
      case 'exceeded':
        return 'text-error';
      case 'warning':
        return 'text-warning';
      case 'normal':
      default:
        return 'text-income';
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-[1000px] mx-auto flex flex-col gap-6 pb-24 md:pb-8 animate-fade-in">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Ngân sách</h1>
        <Button
          variant="primary"
          icon={<Plus size={18} />}
          onClick={() => navigate('/budgets/new')}
        >
          Tạo ngân sách
        </Button>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-44 skeleton-shimmer w-full" />
          <div className="h-44 skeleton-shimmer w-full" />
        </div>
      ) : error ? (
        <EmptyState
          title="Không thể tải dữ liệu"
          description="Vui lòng tải lại trang để làm mới danh sách ngân sách."
          action={
            <Button variant="primary" onClick={fetchBudgets}>
              Tải lại
            </Button>
          }
        />
      ) : budgets.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon={<Wallet size={32} />}
            title="Chưa có ngân sách nào"
            description="Lập kế hoạch ngân sách giúp bạn kiểm soát chi tiêu tốt hơn."
            action={
              <Button
                variant="primary"
                onClick={() => navigate('/budgets/new')}
              >
                Tạo ngân sách đầu tiên
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((b) => (
            <Card
              key={b.id}
              padding="md"
              hover
              onClick={() => setSelectedBudget(b)}
              className={`bg-secondary-dark border rounded-xl overflow-hidden hover:-translate-y-0.5 shadow-xs transition-all duration-250 cursor-pointer ${getStatusBorderClass(b.status)}`}
            >
              <div className="flex flex-col gap-3 text-left">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-text-primary text-base">{b.title}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-text-muted mt-1">
                      <Calendar size={14} />
                      <span>
                        {formatDate(b.start_date)} - {formatDate(b.end_date)}
                      </span>
                    </div>
                  </div>
                  <div className="font-bold text-base text-text-primary">{formatCurrency(b.amount)}</div>
                </div>

                <div className="text-xs text-text-secondary line-clamp-1">
                  Danh mục: {getCategoryName(b.category_id)}
                  {b.description && ` • ${b.description}`}
                </div>

                <div className="mt-2 flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-text-secondary">
                      Đã chi:{' '}
                      <span className="font-semibold text-text-primary">{formatCurrency(b.spent)}</span>
                    </span>
                    <span className={`font-semibold ${getStatusTextColor(b.status)}`}>
                      {formatPercent(b.percentage)}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-tertiary-dark rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getProgressBarColor(b.status)}`}
                      style={{ width: `${Math.min(b.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedBudget}
        onClose={() => setSelectedBudget(null)}
        title="Chi tiết ngân sách"
        footer={
          <>
            <Button
              variant="danger"
              icon={<Trash size={18} />}
              onClick={() => setIsDeleteModalOpen(true)}
            >
              Xóa ngân sách
            </Button>
            <Button variant="ghost" onClick={() => setSelectedBudget(null)}>
              Đóng
            </Button>
          </>
        }
      >
        {selectedBudget && (
          <div className="text-left flex flex-col gap-4">
            <div>
              <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Tên ngân sách</span>
              <div className="text-base font-semibold text-text-primary mt-1">
                {selectedBudget.title}
              </div>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Thời hạn ngân sách</span>
              <div className="text-sm font-medium text-text-primary mt-1">
                {formatDate(selectedBudget.start_date)} - {formatDate(selectedBudget.end_date)}
              </div>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Danh mục áp dụng</span>
              <div className="text-sm font-medium text-text-primary mt-1">
                {getCategoryName(selectedBudget.category_id)}
              </div>
            </div>

            {selectedBudget.description && (
              <div>
                <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Mô tả</span>
                <div className="text-sm text-text-secondary mt-1 whitespace-pre-wrap">
                  {selectedBudget.description}
                </div>
              </div>
            )}

            <div className="bg-tertiary-dark p-4 rounded-xl mt-2 flex flex-col gap-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-secondary">
                  Tổng hạn mức: <strong className="text-text-primary">{formatCurrency(selectedBudget.amount)}</strong>
                </span>
                <span className={`font-semibold ${getStatusTextColor(selectedBudget.status)}`}>
                  {formatPercent(selectedBudget.percentage)}
                </span>
              </div>

              <div className="w-full h-1.5 bg-secondary-dark rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${getProgressBarColor(selectedBudget.status)}`}
                  style={{
                    width: `${Math.min(selectedBudget.percentage, 100)}%`
                  }}
                />
              </div>

              <div className="flex justify-between text-xs mt-1">
                <span>Đã chi tiêu:</span>
                <strong className="text-text-primary">{formatCurrency(selectedBudget.spent)}</strong>
              </div>
              
              <div className="flex justify-between text-xs">
                <span>Còn lại:</span>
                <strong
                  className={selectedBudget.amount - selectedBudget.spent < 0 ? 'text-error' : 'text-income'}
                >
                  {formatCurrency(selectedBudget.amount - selectedBudget.spent)}
                </strong>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirmation */}
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
              onClick={handleDeleteBudget}
            >
              Xóa ngân sách
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-secondary text-left">
          Bạn có chắc chắn muốn xóa ngân sách "{selectedBudget?.title}" này không?
        </p>
      </Modal>
    </div>
  );
}
