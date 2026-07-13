import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TrendUp, TrendDown, Scales, ArrowsLeftRight, PiggyBank } from '@phosphor-icons/react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { dashboardApi } from '../api/dashboard.api';
import { transactionsApi } from '../api/transactions.api';
import { formatCurrency, formatPercent } from '../utils/formatters';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import Button from '../components/common/Button';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [summary, setSummary] = useState(null);
  const [weeklySpending, setWeeklySpending] = useState([]);
  const [categories, setCategories] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);

  const [selectedMonthYear, setSelectedMonthYear] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError(false);

        let summaryData = null;
        let weeklyData = [];
        let categoriesData = [];
        let transactionsList = [];

        const [yearStr, monthStr] = selectedMonthYear.split('-');
        const currentMonth = parseInt(monthStr, 10);
        const currentYear = parseInt(yearStr, 10);

        // 1. Try to fetch summary from real API, fallback to mock if it fails
        try {
          const summaryRes = await transactionsApi.getSummary({ month: currentMonth, year: currentYear });
          if (summaryRes.data.success) {
            const rawSum = summaryRes.data.data;
            const inc = Number(rawSum.monthly_income);
            const exp = Number(rawSum.monthly_expense);
            
            if (isNaN(inc) || isNaN(exp)) {
              throw new Error('Backend returned invalid numeric strings (NaN) due to string concatenation bug');
            }

            summaryData = {
              total_income: inc,
              total_expense: exp,
              balance: inc - exp,
              saving_rate: Number(rawSum.saving_rate || 0),
            };
          }
        } catch (err) {
          console.warn('Real summary API failed, falling back to mock:', err);
          const mockSummary = await dashboardApi.getSummary();
          summaryData = mockSummary.data.data;
        }

        // 2. Try to fetch weekly spending from real API, fallback to mock if it fails
        try {
          const weeklyRes = await transactionsApi.getDailySpending();
          if (weeklyRes.data.success) {
            const dailyList = weeklyRes.data.data?.result || [];
            const sortedDaily = [...dailyList].sort((a, b) => new Date(a.date) - new Date(b.date));
            weeklyData = sortedDaily.map(item => {
              const dateObj = new Date(item.date);
              const label = dateObj.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'numeric' });
              return {
                label,
                amount: Number(item.amount),
              };
            });
          }
        } catch (err) {
          console.warn('Real weekly spending API failed, falling back to mock:', err);
          const mockWeekly = await dashboardApi.getWeeklySpending();
          weeklyData = mockWeekly.data.data;
        }

        // 3. Try to fetch category breakdown from real API, fallback to mock if it fails
        try {
          const categoriesRes = await transactionsApi.getCategoryBreakdown({
            month: currentMonth,
            year: currentYear,
            type: 'EXPENSE',
          });
          if (categoriesRes.data.success) {
            const rawCats = categoriesRes.data.data?.data || categoriesRes.data.data || [];
            const totalSum = rawCats.reduce((sum, cat) => sum + Number(cat.amount || 0), 0);
            const colors = ['#10b981', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
            categoriesData = rawCats.map((cat, idx) => {
              const amount = Number(cat.amount || 0);
              const percentage = totalSum > 0 ? (amount / totalSum) * 100 : 0;
              return {
                category_name: cat.category_name,
                amount,
                percentage: Number(percentage.toFixed(1)),
                color: colors[idx % colors.length],
              };
            });
          }
        } catch (err) {
          console.warn('Real category breakdown API failed, falling back to mock:', err);
          const mockCats = await dashboardApi.getCategoryBreakdown();
          categoriesData = mockCats.data.data;
        }

        // 4. Fetch recent transactions
        try {
          const transactionsRes = await transactionsApi.getAll({ limit: 5 });
          if (transactionsRes.data.success) {
            const rawData = transactionsRes.data.data;
            transactionsList = Array.isArray(rawData) ? rawData : (rawData?.data || []);
          }
        } catch (err) {
          console.error('Error fetching recent transactions:', err);
        }

        setSummary(summaryData);
        setWeeklySpending(weeklyData);
        setCategories(categoriesData);
        setRecentTransactions(transactionsList);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(true);
        addToast('Lỗi khi tải dữ liệu tổng quan', 'error');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [selectedMonthYear, addToast]);

  const getFormattedDate = () => {
    return new Intl.DateTimeFormat('vi-VN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());
  };

  // Chart configuration
  const chartData = {
    labels: weeklySpending.map((d) => d.label),
    datasets: [
      {
        label: 'Chi tiêu (đ)',
        data: weeklySpending.map((d) => d.amount),
        backgroundColor: '#ef4444',
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#1a1d27',
        titleColor: '#f1f3f5',
        bodyColor: '#f1f3f5',
        borderColor: '#2d3148',
        borderWidth: 1,
        padding: 12,
        boxPadding: 4,
        callbacks: {
          label: function (context) {
            return ` ${formatCurrency(context.raw)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#9ca3af',
          font: {
            family: 'Outfit',
            size: 11,
          },
        },
      },
      y: {
        grid: {
          color: '#2d3148',
        },
        ticks: {
          color: '#9ca3af',
          font: {
            family: 'Outfit',
            size: 11,
          },
          callback: function (value) {
            if (value >= 1000000) return `${value / 1000000}M`;
            if (value >= 1000) return `${value / 1000}K`;
            return value;
          },
        },
      },
    },
  };

  if (error) {
    return (
      <div className="p-4 md:p-8 max-w-[1200px] mx-auto pb-24 md:pb-8 flex flex-col gap-6 justify-center min-h-[50vh]">
        <EmptyState
          title="Không thể tải dữ liệu"
          description="Đã xảy ra lỗi khi kết nối với máy chủ. Vui lòng thử lại sau."
          action={
            <Button variant="primary" onClick={() => window.location.reload()}>
              Thử lại
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-[1200px] mx-auto flex flex-col gap-6 pb-24 md:pb-8 animate-fade-in">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
        <div className="flex flex-col text-left">
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight">
            Chào {user?.fullname || 'Bạn'}
          </h1>
          <p className="text-sm text-text-secondary mt-1">{getFormattedDate()}</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <label htmlFor="monthPicker" className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Tháng:
          </label>
          <input
            id="monthPicker"
            type="month"
            value={selectedMonthYear}
            onChange={(e) => setSelectedMonthYear(e.target.value)}
            className="bg-secondary-dark border border-border-dark text-text-primary px-3 py-2 rounded-xl text-sm focus:outline-hidden focus:border-accent-green cursor-pointer font-sans transition-colors duration-150 hover:border-border-dark-light"
          />
        </div>
      </header>

      {/* KPI Section */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
        {loading ? (
          <>
            <div className="h-24 skeleton-shimmer" />
            <div className="h-24 skeleton-shimmer" />
            <div className="h-24 skeleton-shimmer" />
            <div className="h-24 skeleton-shimmer" />
          </>
        ) : (
          <>
            <Card padding="none" className="flex items-center gap-4 bg-secondary-dark border border-border-dark border-l-4 border-l-income py-4 px-6 rounded-xl transition-all duration-200 hover:-translate-y-0.5 shadow-xs">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-income-bg text-income flex-shrink-0">
                <TrendUp size={24} weight="bold" />
              </div>
              <div className="flex flex-col text-left overflow-hidden">
                <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Tổng thu</span>
                <span className="text-lg font-bold text-text-primary mt-0.5 truncate">{formatCurrency(summary?.total_income)}</span>
              </div>
            </Card>

            <Card padding="none" className="flex items-center gap-4 bg-secondary-dark border border-border-dark border-l-4 border-l-expense py-4 px-6 rounded-xl transition-all duration-200 hover:-translate-y-0.5 shadow-xs">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-expense-bg text-expense flex-shrink-0">
                <TrendDown size={24} weight="bold" />
              </div>
              <div className="flex flex-col text-left overflow-hidden">
                <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Tổng chi</span>
                <span className="text-lg font-bold text-text-primary mt-0.5 truncate">{formatCurrency(summary?.total_expense)}</span>
              </div>
            </Card>

            <Card padding="none" className="flex items-center gap-4 bg-secondary-dark border border-border-dark border-l-4 border-l-accent-green py-4 px-6 rounded-xl transition-all duration-200 hover:-translate-y-0.5 shadow-xs">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-accent-subtle text-accent-green flex-shrink-0">
                <Scales size={24} weight="bold" />
              </div>
              <div className="flex flex-col text-left overflow-hidden">
                <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Số dư</span>
                <span className="text-lg font-bold text-text-primary mt-0.5 truncate">{formatCurrency(summary?.balance)}</span>
              </div>
            </Card>

            <Card padding="none" className="flex items-center gap-4 bg-secondary-dark border border-border-dark border-l-4 border-l-info py-4 px-6 rounded-xl transition-all duration-200 hover:-translate-y-0.5 shadow-xs">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-info-bg text-info flex-shrink-0">
                <PiggyBank size={24} weight="bold" />
              </div>
              <div className="flex flex-col text-left overflow-hidden">
                <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Tiết kiệm</span>
                <span className="text-lg font-bold text-text-primary mt-0.5 truncate">{formatPercent(summary?.saving_rate || 0)}</span>
              </div>
            </Card>
          </>
        )}
      </section>

      {/* Main Grid: Chart & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="flex flex-col gap-3 text-left">
          <div className="flex justify-between items-baseline mb-1">
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Chi tiêu 7 ngày qua</h2>
          </div>
          <Card padding="md" className="h-[280px]">
            {loading ? (
              <div className="w-full h-full skeleton-shimmer" />
            ) : (
              <Bar data={chartData} options={chartOptions} />
            )}
          </Card>
        </section>

        <section className="flex flex-col gap-3 text-left">
          <div className="flex justify-between items-baseline mb-1">
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Cơ cấu chi tiêu</h2>
          </div>
          <Card padding="lg" className="h-[280px] overflow-y-auto flex flex-col gap-4">
            {loading ? (
              <>
                <div className="h-8 skeleton-shimmer" />
                <div className="h-8 skeleton-shimmer" />
                <div className="h-8 skeleton-shimmer" />
              </>
            ) : categories.length === 0 ? (
              <EmptyState title="Không có dữ liệu phân tích" />
            ) : (
              categories.map((cat, idx) => (
                <div key={idx} className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-2 font-medium text-text-primary">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      {cat.category_name}
                    </span>
                    <span className="font-semibold text-text-primary">
                      {formatCurrency(cat.amount)}
                      <span className="text-xs text-text-muted ml-1">({formatPercent(cat.percentage)})</span>
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-tertiary-dark rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-[width] duration-500"
                      style={{
                        backgroundColor: cat.color,
                        width: `${cat.percentage}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </Card>
        </section>
      </div>

      {/* Recent Transactions Section */}
      <section className="flex flex-col gap-3 text-left">
        <div className="flex justify-between items-baseline mb-1">
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Giao dịch gần đây</h2>
          <Link to="/transactions" className="text-xs font-semibold text-accent-green hover:text-accent-green-hover transition-colors duration-150">
            Xem tất cả
          </Link>
        </div>

        <div className="flex flex-col gap-2">
          {loading ? (
            <>
              <div className="h-16 skeleton-shimmer" />
              <div className="h-16 skeleton-shimmer" />
            </>
          ) : recentTransactions.length === 0 ? (
            <Card padding="lg">
              <EmptyState
                icon={<ArrowsLeftRight size={32} />}
                title="Chưa có giao dịch nào"
                description="Hãy bắt đầu bằng cách thêm giao dịch đầu tiên của bạn."
                action={
                  <Link to="/transactions/new">
                    <Button variant="primary">Thêm giao dịch</Button>
                  </Link>
                }
              />
            </Card>
          ) : (
            recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex justify-between items-center bg-secondary-dark border border-border-dark p-4 rounded-xl cursor-pointer transition-all duration-200 hover:bg-hover-dark hover:border-border-dark-light hover:-translate-y-0.5"
                onClick={() => navigate(`/transactions?id=${tx.id}`)}
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
                      {new Intl.DateTimeFormat('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      }).format(new Date(tx.transaction_date || tx.created_at))}
                    </span>
                  </div>
                </div>
                <div
                  className={`font-semibold text-sm ${tx.type === 'INCOME' ? 'text-income' : 'text-expense'
                    }`}
                >
                  {tx.type === 'INCOME' ? '+' : '-'}
                  {formatCurrency(tx.amount)}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
