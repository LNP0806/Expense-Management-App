export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const TRANSACTION_TYPES = {
  INCOME: 'INCOME',
  EXPENSE: 'EXPENSE',
};

export const BUDGET_STATUS = {
  NORMAL: 'normal',
  WARNING: 'warning',
  EXCEEDED: 'exceeded',
};

export const STORAGE_KEYS = {
  TOKEN: 'smartspend_token',
  USER: 'smartspend_user',
};

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 10,
};
