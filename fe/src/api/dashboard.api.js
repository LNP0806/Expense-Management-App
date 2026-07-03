const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const dashboardApi = {
  getSummary: async () => {
    await delay(600);
    return {
      data: {
        success: true,
        data: {
          total_income: 25000000,
          total_expense: 18500000,
          balance: 6500000,
          monthly_income: 12000000,
          monthly_expense: 8500000,
          saving_rate: 29.2,
        },
      },
    };
  },

  getCategoryBreakdown: async () => {
    await delay(500);
    return {
      data: {
        success: true,
        data: [
          { category_name: 'Ăn uống', amount: 3200000, percentage: 37.6, color: '#10b981' },
          { category_name: 'Di chuyển', amount: 1800000, percentage: 21.2, color: '#3b82f6' },
          { category_name: 'Mua sắm', amount: 1500000, percentage: 17.6, color: '#f59e0b' },
          { category_name: 'Giải trí', amount: 1200000, percentage: 14.1, color: '#8b5cf6' },
          { category_name: 'Hóa đơn', amount: 800000, percentage: 9.4, color: '#ef4444' },
        ],
      },
    };
  },

  getWeeklySpending: async () => {
    await delay(400);
    const today = new Date();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push({
        date: d.toISOString().split('T')[0],
        label: new Intl.DateTimeFormat('vi-VN', { weekday: 'short' }).format(d),
        amount: Math.floor(Math.random() * 800000) + 200000,
      });
    }
    return { data: { success: true, data: days } };
  },
};
